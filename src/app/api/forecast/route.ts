import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only ADMIN and MANAGEMENT can access forecast
    if (!["ADMIN", "MANAGEMENT"].includes(session.user.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const months = parseInt(searchParams.get("months") || "3")
    const product = searchParams.get("product") || ""
    const location = searchParams.get("location") || ""

    // Get current date
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    // Calculate end date based on forecast period
    const endDate = new Date(currentYear, currentMonth + months, 0)

    // Build filter for members
    const memberWhere: any = {
      membershipEndDate: {
        gte: now,
        lte: endDate
      }
    }

    if (product) {
      memberWhere.product = { contains: product }
    }

    if (location) {
      memberWhere.location = location
    }

    // Get members with expiring memberships in the forecast period
    const expiringMembers = await prisma.member.findMany({
      where: memberWhere,
      include: {
        invoices: {
          orderBy: { invoiceDate: "desc" },
          take: 1,
          select: {
            membershipTotal: true,
            totalTax: true,
            totalAmount: true,
            product: true,
            billingCycle: true
          }
        }
      },
      orderBy: { membershipEndDate: "asc" }
    })

    // Get members expiring in next 30 days (at risk)
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    const atRiskMembers = expiringMembers.filter(m => 
      m.membershipEndDate && new Date(m.membershipEndDate) <= thirtyDaysFromNow
    )

    // Group by month for chart data
    const monthlyForecast: Record<string, {
      month: string,
      monthLabel: string,
      renewalCount: number,
      expectedRevenue: number,
      beforeTax: number,
      members: any[]
    }> = {}

    // Initialize months
    for (let i = 0; i < months; i++) {
      const forecastDate = new Date(currentYear, currentMonth + i + 1, 1)
      const monthKey = `${forecastDate.getFullYear()}-${String(forecastDate.getMonth() + 1).padStart(2, "0")}`
      const monthLabel = forecastDate.toLocaleDateString("en-IN", { month: "short", year: "numeric" })
      
      monthlyForecast[monthKey] = {
        month: monthKey,
        monthLabel,
        renewalCount: 0,
        expectedRevenue: 0,
        beforeTax: 0,
        members: []
      }
    }

    // Calculate expected revenue based on last invoice
    let totalExpectedRevenue = 0
    let totalBeforeTax = 0

    expiringMembers.forEach(member => {
      if (!member.membershipEndDate) return

      const expiryDate = new Date(member.membershipEndDate)
      const monthKey = `${expiryDate.getFullYear()}-${String(expiryDate.getMonth() + 1).padStart(2, "0")}`

      if (monthlyForecast[monthKey]) {
        const lastInvoice = member.invoices[0]
        const beforeTax = lastInvoice?.membershipTotal || 0
        const tax = lastInvoice?.totalTax || 0
        const expectedAmount = beforeTax + tax

        monthlyForecast[monthKey].renewalCount++
        monthlyForecast[monthKey].expectedRevenue += expectedAmount
        monthlyForecast[monthKey].beforeTax += beforeTax
        monthlyForecast[monthKey].members.push({
          id: member.id,
          globalId: member.globalId,
          name: member.name,
          email: member.email,
          product: member.product,
          membershipEndDate: member.membershipEndDate,
          expectedAmount,
          beforeTax,
          tax,
          billingCycle: lastInvoice?.billingCycle
        })

        totalExpectedRevenue += expectedAmount
        totalBeforeTax += beforeTax
      }
    })

    // Group by product type
    const productBreakdown: Record<string, { count: number, revenue: number, beforeTax: number }> = {}
    
    expiringMembers.forEach(member => {
      const productType = member.product || "Unknown"
      const lastInvoice = member.invoices[0]
      const beforeTax = lastInvoice?.membershipTotal || 0
      const expectedAmount = beforeTax + (lastInvoice?.totalTax || 0)

      if (!productBreakdown[productType]) {
        productBreakdown[productType] = { count: 0, revenue: 0, beforeTax: 0 }
      }
      productBreakdown[productType].count++
      productBreakdown[productType].revenue += expectedAmount
      productBreakdown[productType].beforeTax += beforeTax
    })

    // Get distinct locations
    const locations = await prisma.member.findMany({
      select: { location: true },
      distinct: ["location"]
    })

    // Get distinct products
    const products = await prisma.member.findMany({
      select: { product: true },
      distinct: ["product"],
      where: { product: { not: null } }
    })

    return NextResponse.json({
      summary: {
        totalExpectedRevenue,
        totalBeforeTax,
        totalRenewalsDue: expiringMembers.length,
        atRiskCount: atRiskMembers.length,
        forecastPeriod: months
      },
      monthlyForecast: Object.values(monthlyForecast),
      productBreakdown: Object.entries(productBreakdown).map(([product, data]) => ({
        product,
        ...data
      })),
      atRiskMembers: atRiskMembers.map(m => ({
        id: m.id,
        globalId: m.globalId,
        name: m.name,
        email: m.email,
        product: m.product,
        membershipEndDate: m.membershipEndDate,
        expectedAmount: (m.invoices[0]?.membershipTotal || 0) + (m.invoices[0]?.totalTax || 0)
      })),
      filters: {
        locations: locations.map(l => l.location),
        products: products.map(p => p.product).filter(Boolean)
      }
    })
  } catch (error) {
    console.error("Forecast error:", error)
    return NextResponse.json(
      { error: "Failed to generate forecast" },
      { status: 500 }
    )
  }
}
