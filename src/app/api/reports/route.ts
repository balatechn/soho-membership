import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { addDays, startOfMonth, endOfMonth, subMonths, format } from "date-fns"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const reportType = searchParams.get("type") || "summary"
    const month = searchParams.get("month") // YYYY-MM format
    const year = searchParams.get("year")
    const quarter = searchParams.get("quarter") // Q1, Q2, Q3, Q4

    let startDate: Date
    let endDate: Date

    if (month) {
      const [y, m] = month.split("-").map(Number)
      startDate = new Date(y, m - 1, 1)
      endDate = endOfMonth(startDate)
    } else if (year && quarter) {
      const y = parseInt(year)
      const quarterMonths: Record<string, number[]> = {
        Q1: [3, 4, 5], // Apr-Jun
        Q2: [6, 7, 8], // Jul-Sep
        Q3: [9, 10, 11], // Oct-Dec
        Q4: [0, 1, 2], // Jan-Mar
      }
      const months = quarterMonths[quarter] || [0, 1, 2]
      startDate = new Date(quarter === "Q4" ? y : y, months[0], 1)
      endDate = endOfMonth(new Date(quarter === "Q4" ? y + 1 : y, months[2], 1))
    } else {
      // Default to current month
      startDate = startOfMonth(new Date())
      endDate = endOfMonth(new Date())
    }

    const dateFilter = {
      invoiceDate: {
        gte: startDate,
        lte: endDate,
      }
    }

    switch (reportType) {
      case "summary":
        return await getRevenueSummary(dateFilter)
      case "product":
        return await getProductWiseRevenue(dateFilter)
      case "membership-type":
        return await getMembershipTypeRevenue(dateFilter)
      case "renewals-vs-new":
        return await getRenewalsVsNew(dateFilter)
      case "state-tax":
        return await getStateTaxReport(dateFilter)
      case "member-status":
        return await getMemberStatusReport()
      case "upcoming-renewals":
        return await getUpcomingRenewals()
      case "quarterly":
        return await getQuarterlyComparison(parseInt(year || new Date().getFullYear().toString()))
      case "payment-tracking":
        return await getPaymentTracking()
      case "dashboard":
        return await getDashboardData()
      default:
        return NextResponse.json({ error: "Invalid report type" }, { status: 400 })
    }
  } catch (error) {
    console.error("Report error:", error)
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    )
  }
}

async function getRevenueSummary(dateFilter: any) {
  const invoices = await prisma.invoice.aggregate({
    where: dateFilter,
    _sum: {
      totalAmount: true,
      totalTax: true,
      cgst: true,
      sgst: true,
      igst: true,
      membershipTotal: true,
    },
    _count: true,
  })

  const totalRevenue = invoices._sum.totalAmount || 0
  const totalTax = invoices._sum.totalTax || 0
  const netRevenue = totalRevenue - totalTax

  return NextResponse.json({
    report: "Monthly Revenue Summary",
    data: {
      totalRevenue,
      totalTax,
      netRevenue,
      cgst: invoices._sum.cgst || 0,
      sgst: invoices._sum.sgst || 0,
      igst: invoices._sum.igst || 0,
      membershipTotal: invoices._sum.membershipTotal || 0,
      invoiceCount: invoices._count,
    }
  })
}

async function getProductWiseRevenue(dateFilter: any) {
  const products = await prisma.invoice.groupBy({
    by: ["product"],
    where: dateFilter,
    _sum: {
      totalAmount: true,
      totalTax: true,
    },
    _count: true,
  })

  return NextResponse.json({
    report: "Product-Wise Revenue",
    data: products.map(p => ({
      product: p.product || "Unknown",
      totalRevenue: p._sum.totalAmount || 0,
      totalTax: p._sum.totalTax || 0,
      netRevenue: (p._sum.totalAmount || 0) - (p._sum.totalTax || 0),
      count: p._count,
    }))
  })
}

async function getMembershipTypeRevenue(dateFilter: any) {
  const types = await prisma.invoice.groupBy({
    by: ["billingCycle"],
    where: dateFilter,
    _sum: {
      totalAmount: true,
      totalTax: true,
    },
    _count: true,
  })

  return NextResponse.json({
    report: "Membership Type Revenue",
    data: types.map(t => ({
      membershipType: t.billingCycle || "Unknown",
      totalRevenue: t._sum.totalAmount || 0,
      totalTax: t._sum.totalTax || 0,
      netRevenue: (t._sum.totalAmount || 0) - (t._sum.totalTax || 0),
      count: t._count,
    }))
  })
}

async function getRenewalsVsNew(dateFilter: any) {
  const renewalTypes = await prisma.invoice.groupBy({
    by: ["renewalType"],
    where: dateFilter,
    _sum: {
      totalAmount: true,
    },
    _count: true,
  })

  const renewals = renewalTypes.find(r => 
    r.renewalType?.toLowerCase().includes("renewal")
  )
  const newIntake = renewalTypes.find(r => 
    !r.renewalType?.toLowerCase().includes("renewal")
  )

  return NextResponse.json({
    report: "Renewals vs New Intake",
    data: {
      renewals: {
        count: renewals?._count || 0,
        revenue: renewals?._sum.totalAmount || 0,
      },
      newIntake: {
        count: newIntake?._count || 0,
        revenue: newIntake?._sum.totalAmount || 0,
      },
      breakdown: renewalTypes.map(r => ({
        type: r.renewalType || "New",
        count: r._count,
        revenue: r._sum.totalAmount || 0,
      }))
    }
  })
}

async function getStateTaxReport(dateFilter: any) {
  const stateTax = await prisma.invoice.groupBy({
    by: ["state"],
    where: dateFilter,
    _sum: {
      cgst: true,
      sgst: true,
      igst: true,
      totalTax: true,
      totalAmount: true,
    },
    _count: true,
  })

  return NextResponse.json({
    report: "State-Wise Tax Report",
    data: stateTax.map(s => ({
      state: s.state || "Unknown",
      cgst: s._sum.cgst || 0,
      sgst: s._sum.sgst || 0,
      igst: s._sum.igst || 0,
      totalTax: s._sum.totalTax || 0,
      totalAmount: s._sum.totalAmount || 0,
      count: s._count,
    }))
  })
}

async function getMemberStatusReport() {
  const statusCounts = await prisma.member.groupBy({
    by: ["status"],
    _count: true,
  })

  const productCounts = await prisma.member.groupBy({
    by: ["product", "status"],
    _count: true,
  })

  return NextResponse.json({
    report: "Member Status Report",
    data: {
      byStatus: statusCounts.map(s => ({
        status: s.status,
        count: s._count,
      })),
      byProductAndStatus: productCounts.map(p => ({
        product: p.product || "Unknown",
        status: p.status,
        count: p._count,
      })),
      totals: {
        active: statusCounts.find(s => s.status === "ACTIVE")?._count || 0,
        expired: statusCounts.find(s => s.status === "EXPIRED")?._count || 0,
        renewed: statusCounts.find(s => s.status === "RENEWED")?._count || 0,
        quarterly: statusCounts.find(s => s.status === "QUARTERLY")?._count || 0,
        frozen: statusCounts.find(s => s.status === "FROZEN")?._count || 0,
      }
    }
  })
}

async function getUpcomingRenewals() {
  const today = new Date()
  const next30Days = addDays(today, 30)
  const next60Days = addDays(today, 60)
  const next90Days = addDays(today, 90)

  const [renewals30, renewals60, renewals90] = await Promise.all([
    prisma.member.findMany({
      where: {
        membershipEndDate: {
          gte: today,
          lte: next30Days,
        },
        status: { not: "EXPIRED" }
      },
      select: {
        id: true,
        globalId: true,
        name: true,
        email: true,
        membershipEndDate: true,
        product: true,
      }
    }),
    prisma.member.findMany({
      where: {
        membershipEndDate: {
          gt: next30Days,
          lte: next60Days,
        },
        status: { not: "EXPIRED" }
      },
      select: {
        id: true,
        globalId: true,
        name: true,
        email: true,
        membershipEndDate: true,
        product: true,
      }
    }),
    prisma.member.findMany({
      where: {
        membershipEndDate: {
          gt: next60Days,
          lte: next90Days,
        },
        status: { not: "EXPIRED" }
      },
      select: {
        id: true,
        globalId: true,
        name: true,
        email: true,
        membershipEndDate: true,
        product: true,
      }
    }),
  ])

  return NextResponse.json({
    report: "Upcoming Renewals",
    data: {
      next30Days: {
        count: renewals30.length,
        members: renewals30,
      },
      next60Days: {
        count: renewals60.length,
        members: renewals60,
      },
      next90Days: {
        count: renewals90.length,
        members: renewals90,
      },
      total: renewals30.length + renewals60.length + renewals90.length,
    }
  })
}

async function getQuarterlyComparison(year: number) {
  const quarters = [
    { name: "Q1", startMonth: 3, endMonth: 5, year },
    { name: "Q2", startMonth: 6, endMonth: 8, year },
    { name: "Q3", startMonth: 9, endMonth: 11, year },
    { name: "Q4", startMonth: 0, endMonth: 2, year: year + 1 },
  ]

  const quarterData = await Promise.all(
    quarters.map(async (q) => {
      const startDate = new Date(q.year, q.startMonth, 1)
      const endDate = endOfMonth(new Date(q.name === "Q4" ? q.year : year, q.endMonth, 1))

      const data = await prisma.invoice.aggregate({
        where: {
          invoiceDate: {
            gte: startDate,
            lte: endDate,
          }
        },
        _sum: {
          totalAmount: true,
          totalTax: true,
        },
        _count: true,
      })

      return {
        quarter: q.name,
        period: `${format(startDate, "MMM yyyy")} - ${format(endDate, "MMM yyyy")}`,
        revenue: data._sum.totalAmount || 0,
        tax: data._sum.totalTax || 0,
        netRevenue: (data._sum.totalAmount || 0) - (data._sum.totalTax || 0),
        invoiceCount: data._count,
      }
    })
  )

  return NextResponse.json({
    report: "Quarter-Wise Revenue Comparison",
    financialYear: `FY ${year}-${(year + 1).toString().slice(-2)}`,
    data: quarterData,
  })
}

async function getPaymentTracking() {
  const today = new Date()

  const [currentPeriod, futurePeriod, expiredPeriod] = await Promise.all([
    // Active payment periods
    prisma.member.count({
      where: {
        paymentStartDate: { lte: today },
        paymentEndDate: { gte: today },
      }
    }),
    // Future payment periods
    prisma.member.count({
      where: {
        paymentStartDate: { gt: today },
      }
    }),
    // Expired payment periods
    prisma.member.count({
      where: {
        paymentEndDate: { lt: today },
      }
    }),
  ])

  return NextResponse.json({
    report: "Payment Period Tracking",
    data: {
      currentPeriod,
      futurePeriod,
      expiredPeriod,
    }
  })
}

async function getDashboardData() {
  const today = new Date()
  const currentMonth = startOfMonth(today)
  const lastMonth = startOfMonth(subMonths(today, 1))
  const next30Days = addDays(today, 30)

  // Run ALL queries in parallel for faster response
  const [
    currentMonthRevenue,
    lastMonthRevenue,
    memberCounts,
    upcomingRenewals,
    productDistribution,
    ...monthlyTrendResults
  ] = await Promise.all([
    // Current month revenue
    prisma.invoice.aggregate({
      where: {
        invoiceDate: {
          gte: currentMonth,
          lte: today,
        }
      },
      _sum: {
        totalAmount: true,
        totalTax: true,
      },
      _count: true,
    }),
    // Last month revenue for comparison
    prisma.invoice.aggregate({
      where: {
        invoiceDate: {
          gte: lastMonth,
          lt: currentMonth,
        }
      },
      _sum: {
        totalAmount: true,
      },
    }),
    // Member counts
    prisma.member.groupBy({
      by: ["status"],
      _count: true,
    }),
    // Upcoming renewals (next 30 days)
    prisma.member.count({
      where: {
        membershipEndDate: {
          gte: today,
          lte: next30Days,
        },
        status: { not: "EXPIRED" }
      }
    }),
    // Product distribution
    prisma.member.groupBy({
      by: ["product"],
      where: { status: "ACTIVE" },
      _count: true,
    }),
    // Monthly trend (last 6 months) - all in parallel
    ...Array.from({ length: 6 }, (_, i) => {
      const monthStart = startOfMonth(subMonths(today, i))
      const monthEnd = endOfMonth(monthStart)
      return prisma.invoice.aggregate({
        where: {
          invoiceDate: {
            gte: monthStart,
            lte: monthEnd,
          }
        },
        _sum: {
          totalAmount: true,
        },
      })
    })
  ])

  // Process monthly trend
  const monthlyTrend = monthlyTrendResults.map((result, i) => ({
    month: format(startOfMonth(subMonths(today, i)), "MMM yyyy"),
    revenue: result._sum.totalAmount || 0,
  }))

  const activeMembers = memberCounts.find(m => m.status === "ACTIVE")?._count || 0
  const expiredMembers = memberCounts.find(m => m.status === "EXPIRED")?._count || 0
  const totalMembers = memberCounts.reduce((sum, m) => sum + m._count, 0)

  return NextResponse.json({
    report: "Dashboard",
    data: {
      revenue: {
        currentMonth: currentMonthRevenue._sum.totalAmount || 0,
        lastMonth: lastMonthRevenue._sum.totalAmount || 0,
        change: calculateChange(
          currentMonthRevenue._sum.totalAmount || 0,
          lastMonthRevenue._sum.totalAmount || 0
        ),
        tax: currentMonthRevenue._sum.totalTax || 0,
        invoiceCount: currentMonthRevenue._count,
      },
      members: {
        total: totalMembers,
        active: activeMembers,
        expired: expiredMembers,
        upcomingRenewals,
      },
      productDistribution: productDistribution.map(p => ({
        product: p.product || "Unknown",
        count: p._count,
      })),
      monthlyTrend: monthlyTrend.reverse(),
    }
  }, {
    headers: {
      'Cache-Control': 'private, max-age=30', // Cache for 30 seconds
    }
  })
}

function calculateChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 100)
}
