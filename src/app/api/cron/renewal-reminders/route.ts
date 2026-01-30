import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendRenewalReminderNotification } from "@/lib/email"
import { format, startOfMonth, endOfMonth, addMonths } from "date-fns"

// Vercel Cron authentication
const CRON_SECRET = process.env.CRON_SECRET

export async function GET(request: Request) {
  try {
    // Verify cron secret for production
    const authHeader = request.headers.get('authorization')
    if (process.env.NODE_ENV === 'production' && CRON_SECRET) {
      if (authHeader !== `Bearer ${CRON_SECRET}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
    }

    // Get query params
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'current' // 'current' or 'next'

    const today = new Date()
    let targetMonth: Date
    let monthLabel: string

    if (type === 'next') {
      targetMonth = addMonths(today, 1)
      monthLabel = format(targetMonth, 'MMMM yyyy')
    } else {
      targetMonth = today
      monthLabel = format(targetMonth, 'MMMM yyyy')
    }

    const monthStart = startOfMonth(targetMonth)
    const monthEnd = endOfMonth(targetMonth)

    // Find members expiring in the target month
    const expiringMembers = await prisma.member.findMany({
      where: {
        status: 'ACTIVE',
        membershipEndDate: {
          gte: monthStart,
          lte: monthEnd
        }
      },
      orderBy: {
        membershipEndDate: 'asc'
      }
    })

    if (expiringMembers.length === 0) {
      console.log(`No members expiring in ${monthLabel}`)
      return NextResponse.json({
        message: `No members expiring in ${monthLabel}`,
        count: 0
      })
    }

    // Calculate total revenue at risk (based on last invoice)
    let totalRevenueAtRisk = 0
    for (const member of expiringMembers) {
      const lastInvoice = await prisma.invoice.findFirst({
        where: { memberId: member.id },
        orderBy: { invoiceDate: 'desc' }
      })
      if (lastInvoice) {
        totalRevenueAtRisk += lastInvoice.totalAmount
      }
    }

    // Send notification
    const result = await sendRenewalReminderNotification({
      month: monthLabel,
      type: type as 'current' | 'next',
      members: expiringMembers.map(m => ({
        name: m.name,
        globalId: m.globalId,
        email: m.email,
        product: m.product,
        membershipEndDate: m.membershipEndDate!
      })),
      totalRevenueAtRisk
    })

    return NextResponse.json({
      message: `Renewal reminder sent for ${monthLabel}`,
      count: expiringMembers.length,
      revenueAtRisk: totalRevenueAtRisk,
      notificationResult: result.success ? 'sent' : ('reason' in result ? result.reason : 'failed')
    })
  } catch (error) {
    console.error("Error in renewal reminder cron:", error)
    return NextResponse.json(
      { error: "Failed to process renewal reminders" },
      { status: 500 }
    )
  }
}
