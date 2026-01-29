import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import * as XLSX from "xlsx"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { reportType, month, year, quarter, filters } = body

    let data: any[] = []
    let fileName = "report"

    switch (reportType) {
      case "invoices":
        data = await getInvoicesData(filters)
        fileName = `invoices_${month || "all"}`
        break
      case "members":
        data = await getMembersData(filters)
        fileName = `members_${new Date().toISOString().split("T")[0]}`
        break
      case "revenue-summary":
        data = await getRevenueSummaryData(month)
        fileName = `revenue_summary_${month || "all"}`
        break
      case "tax-report":
        data = await getTaxReportData(month)
        fileName = `tax_report_${month || "all"}`
        break
      case "renewals":
        data = await getRenewalsData()
        fileName = `upcoming_renewals_${new Date().toISOString().split("T")[0]}`
        break
      default:
        return NextResponse.json({ error: "Invalid report type" }, { status: 400 })
    }

    // Create workbook
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(data)
    XLSX.utils.book_append_sheet(workbook, worksheet, "Report")

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: "EXPORT",
        entity: "Report",
        details: JSON.stringify({ reportType, month, filters }),
        userId: session.user.id,
      }
    })

    // Return as downloadable file
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${fileName}.xlsx"`,
      }
    })
  } catch (error) {
    console.error("Export error:", error)
    return NextResponse.json(
      { error: "Failed to export report" },
      { status: 500 }
    )
  }
}

async function getInvoicesData(filters: any) {
  const where: any = {}
  if (filters?.uploadMonth) where.uploadMonth = filters.uploadMonth
  if (filters?.product) where.product = filters.product

  const invoices = await prisma.invoice.findMany({
    where,
    include: {
      member: {
        select: { globalId: true, status: true }
      }
    },
    orderBy: { invoiceDate: "desc" }
  })

  return invoices.map(inv => ({
    "Invoice No": inv.invoiceNo,
    "Invoice Date": inv.invoiceDate.toISOString().split("T")[0],
    "Global ID": inv.member.globalId,
    "Name": inv.name,
    "State": inv.state,
    "Email": inv.email,
    "Membership": inv.membership,
    "Membership Total": inv.membershipTotal,
    "CGST (9%)": inv.cgst,
    "SGST (9%)": inv.sgst,
    "IGST (18%)": inv.igst,
    "Total Tax": inv.totalTax,
    "Total Amount": inv.totalAmount,
    "Product": inv.product,
    "Type": inv.type,
    "Billing Cycle": inv.billingCycle,
    "Member Status": inv.member.status,
  }))
}

async function getMembersData(filters: any) {
  const where: any = {}
  if (filters?.status) where.status = filters.status
  if (filters?.product) where.product = filters.product

  const members = await prisma.member.findMany({
    where,
    include: {
      _count: { select: { invoices: true } }
    },
    orderBy: { name: "asc" }
  })

  return members.map(m => ({
    "Global ID": m.globalId,
    "Name": m.name,
    "Email": m.email,
    "State": m.state,
    "Pin Code": m.pinCode,
    "Product": m.product,
    "Membership Type": m.membershipType,
    "Status": m.status,
    "Membership Start": m.membershipStartDate?.toISOString().split("T")[0] || "",
    "Membership End": m.membershipEndDate?.toISOString().split("T")[0] || "",
    "Payment Start": m.paymentStartDate?.toISOString().split("T")[0] || "",
    "Payment End": m.paymentEndDate?.toISOString().split("T")[0] || "",
    "Total Invoices": m._count.invoices,
    "Location": m.location,
  }))
}

async function getRevenueSummaryData(month?: string) {
  const where: any = {}
  if (month) where.uploadMonth = month

  const invoices = await prisma.invoice.findMany({
    where,
    orderBy: { invoiceDate: "desc" }
  })

  // Summary row
  const summary = invoices.reduce((acc, inv) => {
    acc.totalAmount += inv.totalAmount
    acc.totalTax += inv.totalTax
    acc.cgst += inv.cgst
    acc.sgst += inv.sgst
    acc.igst += inv.igst
    return acc
  }, { totalAmount: 0, totalTax: 0, cgst: 0, sgst: 0, igst: 0 })

  return [
    {
      "Metric": "Total Revenue",
      "Amount": summary.totalAmount,
    },
    {
      "Metric": "Total Tax",
      "Amount": summary.totalTax,
    },
    {
      "Metric": "Net Revenue",
      "Amount": summary.totalAmount - summary.totalTax,
    },
    {
      "Metric": "CGST Collected",
      "Amount": summary.cgst,
    },
    {
      "Metric": "SGST Collected",
      "Amount": summary.sgst,
    },
    {
      "Metric": "IGST Collected",
      "Amount": summary.igst,
    },
    {
      "Metric": "Invoice Count",
      "Amount": invoices.length,
    },
  ]
}

async function getTaxReportData(month?: string) {
  const where: any = {}
  if (month) where.uploadMonth = month

  const stateTax = await prisma.invoice.groupBy({
    by: ["state"],
    where,
    _sum: {
      cgst: true,
      sgst: true,
      igst: true,
      totalTax: true,
      totalAmount: true,
    },
    _count: true,
  })

  return stateTax.map(s => ({
    "State": s.state || "Unknown",
    "CGST (9%)": s._sum.cgst || 0,
    "SGST (9%)": s._sum.sgst || 0,
    "IGST (18%)": s._sum.igst || 0,
    "Total Tax": s._sum.totalTax || 0,
    "Total Amount": s._sum.totalAmount || 0,
    "Invoice Count": s._count,
  }))
}

async function getRenewalsData() {
  const today = new Date()
  const next90Days = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000)

  const members = await prisma.member.findMany({
    where: {
      membershipEndDate: {
        gte: today,
        lte: next90Days,
      },
      status: { not: "EXPIRED" }
    },
    orderBy: { membershipEndDate: "asc" }
  })

  return members.map(m => {
    const daysUntilExpiry = Math.ceil(
      (new Date(m.membershipEndDate!).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    )
    return {
      "Global ID": m.globalId,
      "Name": m.name,
      "Email": m.email,
      "Product": m.product,
      "Membership End": m.membershipEndDate?.toISOString().split("T")[0] || "",
      "Days Until Expiry": daysUntilExpiry,
      "Status": m.status,
      "Renewal Window": daysUntilExpiry <= 30 ? "Next 30 Days" : daysUntilExpiry <= 60 ? "30-60 Days" : "60-90 Days",
    }
  })
}
