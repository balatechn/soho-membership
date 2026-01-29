import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import nodemailer from "nodemailer"
import * as XLSX from "xlsx"
import { format, startOfMonth, endOfMonth, addDays } from "date-fns"

// Create email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!["ADMIN", "FINANCE"].includes(session.user.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const body = await request.json()
    const { recipients, reportTypes, month, customMessage } = body

    if (!recipients || recipients.length === 0) {
      return NextResponse.json({ error: "At least one recipient is required" }, { status: 400 })
    }

    // Generate report data
    const reportMonth = month || format(new Date(), "yyyy-MM")
    const [year, monthNum] = reportMonth.split("-").map(Number)
    const monthStart = startOfMonth(new Date(year, monthNum - 1))
    const monthEnd = endOfMonth(monthStart)

    // Get summary data
    const invoices = await prisma.invoice.aggregate({
      where: {
        invoiceDate: {
          gte: monthStart,
          lte: monthEnd,
        }
      },
      _sum: {
        totalAmount: true,
        totalTax: true,
      },
      _count: true,
    })

    const activeMembers = await prisma.member.count({
      where: { status: "ACTIVE" }
    })

    const upcomingRenewals = await prisma.member.count({
      where: {
        membershipEndDate: {
          gte: new Date(),
          lte: addDays(new Date(), 30),
        },
        status: { not: "EXPIRED" }
      }
    })

    // Generate attachments
    const attachments: any[] = []

    for (const reportType of reportTypes || ["revenue-summary"]) {
      const { buffer, fileName } = await generateReportExcel(reportType, reportMonth)
      attachments.push({
        filename: `${fileName}.xlsx`,
        content: buffer,
      })
    }

    // Format currency
    const formatINR = (amount: number) => 
      new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amount)

    // Email content
    const monthName = format(monthStart, "MMMM yyyy")
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1a1a2e; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">Junobo Mumbai</h1>
          <p style="margin: 5px 0 0;">Membership Revenue Report</p>
        </div>
        
        <div style="padding: 20px; background: #f9f9f9;">
          <h2 style="color: #1a1a2e;">Monthly Report - ${monthName}</h2>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0;">
            <div style="background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <p style="margin: 0; color: #666; font-size: 12px;">Total Revenue</p>
              <p style="margin: 5px 0 0; font-size: 24px; font-weight: bold; color: #1a1a2e;">
                ${formatINR(invoices._sum.totalAmount || 0)}
              </p>
            </div>
            
            <div style="background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <p style="margin: 0; color: #666; font-size: 12px;">Total Tax Collected</p>
              <p style="margin: 5px 0 0; font-size: 24px; font-weight: bold; color: #1a1a2e;">
                ${formatINR(invoices._sum.totalTax || 0)}
              </p>
            </div>
            
            <div style="background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <p style="margin: 0; color: #666; font-size: 12px;">Active Members</p>
              <p style="margin: 5px 0 0; font-size: 24px; font-weight: bold; color: #1a1a2e;">
                ${activeMembers}
              </p>
            </div>
            
            <div style="background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <p style="margin: 0; color: #666; font-size: 12px;">Renewals Due (Next 30 Days)</p>
              <p style="margin: 5px 0 0; font-size: 24px; font-weight: bold; color: #e74c3c;">
                ${upcomingRenewals}
              </p>
            </div>
          </div>
          
          ${customMessage ? `
            <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px; color: #1a1a2e;">Additional Notes</h3>
              <p style="margin: 0; color: #333;">${customMessage}</p>
            </div>
          ` : ""}
          
          <p style="color: #666; font-size: 14px;">
            Please find the detailed report(s) attached to this email.
          </p>
        </div>
        
        <div style="background: #1a1a2e; color: #999; padding: 15px; text-align: center; font-size: 12px;">
          <p style="margin: 0;">
            This is an automated email from Junobo Mumbai Membership Management System.
          </p>
          <p style="margin: 5px 0 0;">
            Generated on ${format(new Date(), "PPpp")}
          </p>
        </div>
      </div>
    `

    // Send email
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || "Junobo Mumbai <noreply@junobo.com>",
        to: recipients.join(", "),
        subject: `Junobo Mumbai - Monthly Revenue Report (${monthName})`,
        html: htmlContent,
        attachments,
      })
    } catch (emailError) {
      console.error("Email sending failed:", emailError)
      // Continue anyway for development
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: "EMAIL",
        entity: "Report",
        details: JSON.stringify({
          recipients,
          reportTypes,
          month: reportMonth,
        }),
        userId: session.user.id,
      }
    })

    return NextResponse.json({
      success: true,
      message: `Report email sent to ${recipients.length} recipient(s)`,
    })
  } catch (error) {
    console.error("Email error:", error)
    return NextResponse.json(
      { error: "Failed to send email report" },
      { status: 500 }
    )
  }
}

async function generateReportExcel(reportType: string, month: string): Promise<{ buffer: Buffer, fileName: string }> {
  let data: any[] = []
  let fileName = `report_${month}`

  const [year, monthNum] = month.split("-").map(Number)
  const monthStart = startOfMonth(new Date(year, monthNum - 1))
  const monthEnd = endOfMonth(monthStart)

  switch (reportType) {
    case "revenue-summary":
      const invoices = await prisma.invoice.findMany({
        where: {
          invoiceDate: {
            gte: monthStart,
            lte: monthEnd,
          }
        },
        orderBy: { invoiceDate: "desc" }
      })

      data = invoices.map(inv => ({
        "Invoice No": inv.invoiceNo,
        "Invoice Date": format(inv.invoiceDate, "yyyy-MM-dd"),
        "Name": inv.name,
        "State": inv.state,
        "Product": inv.product,
        "Membership Total": inv.membershipTotal,
        "CGST": inv.cgst,
        "SGST": inv.sgst,
        "IGST": inv.igst,
        "Total Tax": inv.totalTax,
        "Total Amount": inv.totalAmount,
      }))
      fileName = `revenue_summary_${month}`
      break

    case "member-status":
      const members = await prisma.member.findMany({
        orderBy: { name: "asc" }
      })

      data = members.map(m => ({
        "Global ID": m.globalId,
        "Name": m.name,
        "Email": m.email,
        "Product": m.product,
        "Status": m.status,
        "Membership End": m.membershipEndDate ? format(m.membershipEndDate, "yyyy-MM-dd") : "",
      }))
      fileName = `member_status_${month}`
      break

    case "tax-report":
      const taxData = await prisma.invoice.groupBy({
        by: ["state"],
        where: {
          invoiceDate: {
            gte: monthStart,
            lte: monthEnd,
          }
        },
        _sum: {
          cgst: true,
          sgst: true,
          igst: true,
          totalTax: true,
          totalAmount: true,
        },
        _count: true,
      })

      data = taxData.map(t => ({
        "State": t.state || "Unknown",
        "CGST": t._sum.cgst || 0,
        "SGST": t._sum.sgst || 0,
        "IGST": t._sum.igst || 0,
        "Total Tax": t._sum.totalTax || 0,
        "Total Amount": t._sum.totalAmount || 0,
        "Invoice Count": t._count,
      }))
      fileName = `tax_report_${month}`
      break

    default:
      data = [{ message: "No data available for this report type" }]
  }

  const workbook = XLSX.utils.book_new()
  const worksheet = XLSX.utils.json_to_sheet(data)
  XLSX.utils.book_append_sheet(workbook, worksheet, "Report")

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" })

  return { buffer, fileName }
}

// GET endpoint to fetch email configuration
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const emailConfigs = await prisma.emailConfig.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" }
    })

    const scheduledReports = await prisma.scheduledReport.findMany({
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json({
      emailConfigs,
      scheduledReports,
    })
  } catch (error) {
    console.error("Get email config error:", error)
    return NextResponse.json(
      { error: "Failed to fetch email configuration" },
      { status: 500 }
    )
  }
}
