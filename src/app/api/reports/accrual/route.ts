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

    const searchParams = request.nextUrl.searchParams
    const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString())

    // Get all accruals for the year
    const startMonth = `${year}-01`
    const endMonth = `${year}-12`

    const accruals = await prisma.accrual.findMany({
      where: {
        accrualMonth: {
          gte: startMonth,
          lte: endMonth,
        },
      },
      include: {
        invoice: {
          select: {
            renewalType: true,
            billingCycle: true,
            calculationMonth: true,
            memberId: true,
          },
        },
      },
    })

    // Get current month
    const currentMonth = new Date().getMonth() + 1
    const currentMonthStr = `${year}-${String(currentMonth).padStart(2, '0')}`
    const prevMonthStr = currentMonth === 1 
      ? `${year - 1}-12` 
      : `${year}-${String(currentMonth - 1).padStart(2, '0')}`

    // Calculate stats
    const totalYTD = accruals.reduce((sum, a) => sum + a.amount, 0)
    
    const currentMonthAccruals = accruals.filter(a => a.accrualMonth === currentMonthStr)
    const currentMonthTotal = currentMonthAccruals.reduce((sum, a) => sum + a.amount, 0)
    
    const prevMonthAccruals = accruals.filter(a => a.accrualMonth === prevMonthStr)
    const prevMonthTotal = prevMonthAccruals.reduce((sum, a) => sum + a.amount, 0)
    
    const currentMonthGrowth = prevMonthTotal > 0 
      ? Math.round(((currentMonthTotal - prevMonthTotal) / prevMonthTotal) * 100)
      : 0

    // Get unique members with accruals
    const membersWithAccruals = new Set(accruals.map(a => a.invoice.memberId)).size

    // Group by month
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                        'July', 'August', 'September', 'October', 'November', 'December']
    
    const monthlyData = monthNames.map((monthName, index) => {
      const monthStr = `${year}-${String(index + 1).padStart(2, '0')}`
      const monthAccruals = accruals.filter(a => a.accrualMonth === monthStr)
      
      // Categorize by tenure type
      const quarterlyOneYear = monthAccruals
        .filter(a => a.invoice.billingCycle === 'Quarterly' && (a.invoice.calculationMonth || 0) <= 12)
        .reduce((sum, a) => sum + a.amount, 0)
      
      const quarterlyFiveYear = monthAccruals
        .filter(a => a.invoice.billingCycle === 'Quarterly' && (a.invoice.calculationMonth || 0) > 12)
        .reduce((sum, a) => sum + a.amount, 0)
      
      const isIntake = (renewalType: string | null) => 
        !renewalType || renewalType.toLowerCase().includes('new') || renewalType.toLowerCase().includes('intake')
      
      const intakeOneYear = monthAccruals
        .filter(a => isIntake(a.invoice.renewalType) && (a.invoice.calculationMonth || 0) <= 12)
        .reduce((sum, a) => sum + a.amount, 0)
      
      const intakeFiveYear = monthAccruals
        .filter(a => isIntake(a.invoice.renewalType) && (a.invoice.calculationMonth || 0) > 12)
        .reduce((sum, a) => sum + a.amount, 0)
      
      const isRenewal = (renewalType: string | null) => 
        renewalType && (renewalType.toLowerCase().includes('renewal') || renewalType.toLowerCase().includes('renew'))
      
      const renewalOneYear = monthAccruals
        .filter(a => isRenewal(a.invoice.renewalType) && (a.invoice.calculationMonth || 0) <= 12)
        .reduce((sum, a) => sum + a.amount, 0)
      
      const renewalFiveYear = monthAccruals
        .filter(a => isRenewal(a.invoice.renewalType) && (a.invoice.calculationMonth || 0) > 12)
        .reduce((sum, a) => sum + a.amount, 0)

      return {
        month: monthName,
        totalAccrual: monthAccruals.reduce((sum, a) => sum + a.amount, 0),
        quarterlyTenure: { oneYear: quarterlyOneYear, fiveYear: quarterlyFiveYear },
        intakeTenure: { oneYear: intakeOneYear, fiveYear: intakeFiveYear },
        renewalTenure: { oneYear: renewalOneYear, fiveYear: renewalFiveYear },
      }
    })

    // Chart data (short month names)
    const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                         'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const chartData = shortMonths.map((month, index) => ({
      month,
      amount: monthlyData[index].totalAccrual,
    }))

    // Yearly target (can be configured)
    const yearlyTarget = 10000000 // ₹1 Crore default target

    return NextResponse.json({
      totalYTD,
      currentMonth: currentMonthTotal,
      currentMonthGrowth,
      yearlyTarget,
      membersWithAccruals,
      monthlyData,
      chartData,
    })
  } catch (error) {
    console.error("Accrual report error:", error)
    return NextResponse.json(
      { error: "Failed to generate accrual report" },
      { status: 500 }
    )
  }
}
