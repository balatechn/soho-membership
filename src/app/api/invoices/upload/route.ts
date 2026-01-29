import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import * as XLSX from "xlsx"
import { parseExcelDate, getUploadMonth, isMaharashtra } from "@/lib/utils"

interface ExcelRow {
  "Invoice No"?: string
  "Invoice Date"?: string | number | Date
  "Global ID"?: string
  "Name"?: string
  "Pin Code"?: string
  "State"?: string
  "Email ID"?: string
  "Registration"?: string
  "Membership"?: number
  "Membership Total"?: number
  "CGST – 9%"?: number
  "SGST – 9%"?: number
  "IGST – 18%"?: number
  "Total Tax"?: number
  "Total Amount"?: number
  "Description 1"?: string
  "Description"?: string
  "Membership Start Date"?: string | number | Date
  "Membership End Date"?: string | number | Date
  "Payment Start Date"?: string | number | Date
  "Payment End Date"?: string | number | Date
  "Type"?: string
  "Renewal / Quarterly"?: string
  "Month"?: string
  "Product"?: string
  "Months (Tenure)"?: number
  "Calculation of Month"?: number
}

interface ValidationError {
  row: number
  field: string
  message: string
}

interface ProcessedInvoice {
  invoiceNo: string
  invoiceDate: Date
  globalId: string
  name: string
  pinCode: string | null
  state: string | null
  email: string | null
  registration: string | null
  membership: number
  membershipTotal: number
  cgst: number
  sgst: number
  igst: number
  totalTax: number
  totalAmount: number
  description1: string | null
  description: string | null
  membershipStartDate: Date | null
  membershipEndDate: Date | null
  paymentStartDate: Date | null
  paymentEndDate: Date | null
  type: string | null
  renewalType: string | null
  month: string | null
  product: string | null
  monthsTenure: number | null
  calculationMonth: number | null
  billingCycle: string | null
}

// Preview endpoint - validates and returns preview data
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check role permissions
    if (!["ADMIN", "FINANCE"].includes(session.user.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const uploadMonth = formData.get("uploadMonth") as string || getUploadMonth()
    const action = formData.get("action") as string // 'preview' or 'import'

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Read Excel file
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: "array" })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json<ExcelRow>(worksheet)

    if (data.length === 0) {
      return NextResponse.json({ error: "Excel file is empty" }, { status: 400 })
    }

    const errors: ValidationError[] = []
    const processedInvoices: ProcessedInvoice[] = []
    const existingInvoiceNos: Set<string> = new Set()

    // Check for existing invoices in this upload month
    const existingInvoices = await prisma.invoice.findMany({
      where: { uploadMonth },
      select: { invoiceNo: true }
    })
    existingInvoices.forEach(inv => existingInvoiceNos.add(inv.invoiceNo))

    // Track duplicates within this upload
    const uploadInvoiceNos = new Set<string>()

    for (let i = 0; i < data.length; i++) {
      const row = data[i]
      const rowNum = i + 2 // Excel rows are 1-indexed, plus header

      // Validate mandatory fields
      if (!row["Invoice No"]) {
        errors.push({ row: rowNum, field: "Invoice No", message: "Invoice No is required" })
        continue
      }

      if (!row["Global ID"]) {
        errors.push({ row: rowNum, field: "Global ID", message: "Global ID is required" })
        continue
      }

      if (!row["Invoice Date"]) {
        errors.push({ row: rowNum, field: "Invoice Date", message: "Invoice Date is required" })
        continue
      }

      if (!row["Total Amount"] && row["Total Amount"] !== 0) {
        errors.push({ row: rowNum, field: "Total Amount", message: "Total Amount is required" })
        continue
      }

      const invoiceNo = row["Invoice No"].toString()

      // Check for duplicates in database
      if (existingInvoiceNos.has(invoiceNo)) {
        errors.push({ row: rowNum, field: "Invoice No", message: `Invoice ${invoiceNo} already exists for ${uploadMonth}` })
        continue
      }

      // Check for duplicates in current upload
      if (uploadInvoiceNos.has(invoiceNo)) {
        errors.push({ row: rowNum, field: "Invoice No", message: `Duplicate invoice ${invoiceNo} in upload file` })
        continue
      }

      uploadInvoiceNos.add(invoiceNo)

      const invoiceDate = parseExcelDate(row["Invoice Date"])
      if (!invoiceDate) {
        errors.push({ row: rowNum, field: "Invoice Date", message: "Invalid Invoice Date format" })
        continue
      }

      // Determine billing cycle
      const monthsTenure = row["Months (Tenure)"] || row["Calculation of Month"] || null
      let billingCycle = null
      if (monthsTenure) {
        billingCycle = monthsTenure >= 12 ? "Annual" : "Quarterly"
      }

      // Process invoice
      processedInvoices.push({
        invoiceNo,
        invoiceDate,
        globalId: row["Global ID"].toString(),
        name: row["Name"] || "",
        pinCode: row["Pin Code"]?.toString() || null,
        state: row["State"] || null,
        email: row["Email ID"] || null,
        registration: row["Registration"] || null,
        membership: row["Membership"] || 0,
        membershipTotal: row["Membership Total"] || 0,
        cgst: row["CGST – 9%"] || 0,
        sgst: row["SGST – 9%"] || 0,
        igst: row["IGST – 18%"] || 0,
        totalTax: row["Total Tax"] || 0,
        totalAmount: row["Total Amount"] || 0,
        description1: row["Description 1"] || null,
        description: row["Description"] || null,
        membershipStartDate: parseExcelDate(row["Membership Start Date"]),
        membershipEndDate: parseExcelDate(row["Membership End Date"]),
        paymentStartDate: parseExcelDate(row["Payment Start Date"]),
        paymentEndDate: parseExcelDate(row["Payment End Date"]),
        type: row["Type"] || null,
        renewalType: row["Renewal / Quarterly"] || null,
        month: row["Month"] || null,
        product: row["Product"] || null,
        monthsTenure: monthsTenure as number | null,
        calculationMonth: row["Calculation of Month"] || null,
        billingCycle,
      })
    }

    // If preview mode, return the data without importing
    if (action === "preview") {
      return NextResponse.json({
        totalRows: data.length,
        validRows: processedInvoices.length,
        errorRows: errors.length,
        errors,
        preview: processedInvoices.slice(0, 10), // Return first 10 for preview
        summary: {
          totalAmount: processedInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0),
          totalTax: processedInvoices.reduce((sum, inv) => sum + inv.totalTax, 0),
          uniqueMembers: new Set(processedInvoices.map(inv => inv.globalId)).size,
        }
      })
    }

    // Import mode - save to database
    if (processedInvoices.length === 0) {
      return NextResponse.json({ 
        error: "No valid invoices to import",
        errors 
      }, { status: 400 })
    }

    // Process each invoice and update/create members
    let successCount = 0
    let failedCount = 0

    for (const invoice of processedInvoices) {
      try {
        // Find or create member
        let member = await prisma.member.findUnique({
          where: { globalId: invoice.globalId }
        })

        if (member) {
          // Update existing member
          member = await prisma.member.update({
            where: { globalId: invoice.globalId },
            data: {
              name: invoice.name || member.name,
              email: invoice.email || member.email,
              pinCode: invoice.pinCode || member.pinCode,
              state: invoice.state || member.state,
              product: invoice.product || member.product,
              membershipType: invoice.billingCycle || member.membershipType,
              membershipStartDate: invoice.membershipStartDate || member.membershipStartDate,
              membershipEndDate: invoice.membershipEndDate || member.membershipEndDate,
              paymentStartDate: invoice.paymentStartDate || member.paymentStartDate,
              paymentEndDate: invoice.paymentEndDate || member.paymentEndDate,
              registration: invoice.registration || member.registration,
              status: determineMemberStatus(invoice.membershipEndDate, invoice.renewalType),
            }
          })
        } else {
          // Create new member
          member = await prisma.member.create({
            data: {
              globalId: invoice.globalId,
              name: invoice.name,
              email: invoice.email,
              pinCode: invoice.pinCode,
              state: invoice.state,
              product: invoice.product,
              membershipType: invoice.billingCycle,
              membershipStartDate: invoice.membershipStartDate,
              membershipEndDate: invoice.membershipEndDate,
              paymentStartDate: invoice.paymentStartDate,
              paymentEndDate: invoice.paymentEndDate,
              registration: invoice.registration,
              status: "ACTIVE",
            }
          })
        }

        // Create invoice
        await prisma.invoice.create({
          data: {
            invoiceNo: invoice.invoiceNo,
            invoiceDate: invoice.invoiceDate,
            memberId: member.id,
            name: invoice.name,
            pinCode: invoice.pinCode,
            state: invoice.state,
            email: invoice.email,
            registration: invoice.registration,
            membership: invoice.membership,
            membershipTotal: invoice.membershipTotal,
            cgst: invoice.cgst,
            sgst: invoice.sgst,
            igst: invoice.igst,
            totalTax: invoice.totalTax,
            totalAmount: invoice.totalAmount,
            description1: invoice.description1,
            description: invoice.description,
            membershipStartDate: invoice.membershipStartDate,
            membershipEndDate: invoice.membershipEndDate,
            paymentStartDate: invoice.paymentStartDate,
            paymentEndDate: invoice.paymentEndDate,
            type: invoice.type,
            renewalType: invoice.renewalType,
            month: invoice.month,
            product: invoice.product,
            monthsTenure: invoice.monthsTenure,
            calculationMonth: invoice.calculationMonth,
            billingCycle: invoice.billingCycle,
            uploadMonth,
          }
        })

        successCount++
      } catch (error) {
        console.error(`Error processing invoice ${invoice.invoiceNo}:`, error)
        failedCount++
        errors.push({
          row: 0,
          field: "System",
          message: `Failed to import invoice ${invoice.invoiceNo}: ${error}`
        })
      }
    }

    // Create upload log
    await prisma.uploadLog.create({
      data: {
        fileName: file.name,
        uploadMonth,
        recordsCount: data.length,
        successCount,
        failedCount,
        userId: session.user.id,
        status: failedCount === 0 ? "COMPLETED" : "COMPLETED_WITH_ERRORS",
        errors: errors.length > 0 ? JSON.stringify(errors) : null,
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: "UPLOAD",
        entity: "Invoice",
        details: JSON.stringify({
          fileName: file.name,
          uploadMonth,
          successCount,
          failedCount,
        }),
        userId: session.user.id,
      }
    })

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${successCount} invoices`,
      totalRows: data.length,
      successCount,
      failedCount,
      errors,
    })

  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json(
      { error: "Failed to process upload" },
      { status: 500 }
    )
  }
}

function determineMemberStatus(membershipEndDate: Date | null, renewalType: string | null): string {
  if (!membershipEndDate) return "ACTIVE"
  
  const today = new Date()
  const endDate = new Date(membershipEndDate)
  
  if (endDate < today) return "EXPIRED"
  
  if (renewalType?.toLowerCase().includes("renewal")) return "RENEWED"
  if (renewalType?.toLowerCase().includes("quarterly")) return "QUARTERLY"
  
  return "ACTIVE"
}
