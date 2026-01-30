import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import * as XLSX from "xlsx"
import { parseExcelDate, getUploadMonth, isMaharashtra } from "@/lib/utils"

// Helper function to normalize header names for flexible matching
function normalizeHeader(header: string): string {
  return header
    .toLowerCase()
    .replace(/[.\-–_]/g, ' ')  // Replace dots, dashes, underscores with space
    .replace(/\s+/g, ' ')       // Collapse multiple spaces
    .trim()
}

// Map to find the actual column name from the Excel row
function getColumnValue(row: Record<string, unknown>, possibleNames: string[]): unknown {
  for (const name of possibleNames) {
    if (row[name] !== undefined) return row[name]
  }
  // Try normalized matching
  const rowKeys = Object.keys(row)
  for (const key of rowKeys) {
    const normalizedKey = normalizeHeader(key)
    for (const name of possibleNames) {
      if (normalizeHeader(name) === normalizedKey) {
        return row[key]
      }
    }
  }
  return undefined
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
    const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet)

    if (data.length === 0) {
      return NextResponse.json({ error: "Excel file is empty" }, { status: 400 })
    }

    const errors: ValidationError[] = []
    const processedInvoices: ProcessedInvoice[] = []
    const existingInvoiceNos: Set<string> = new Set()

    // Check for existing invoices globally (not just this upload month)
    const existingInvoices = await prisma.invoice.findMany({
      select: { invoiceNo: true }
    })
    existingInvoices.forEach(inv => existingInvoiceNos.add(inv.invoiceNo))

    // Track duplicates within this upload
    const uploadInvoiceNos = new Set<string>()

    // Column name mappings - supports multiple variations
    const COLUMNS = {
      invoiceNo: ["Invoice No.", "Invoice No", "Invoice Number", "Inv No"],
      invoiceDate: ["Invoice Date", "Inv Date", "Date"],
      globalId: ["Global ID", "GlobalID", "Global Id", "Member ID"],
      name: ["Name", "Member Name", "Full Name"],
      state: ["State", "State Name"],
      email: ["Email Id", "Email ID", "Email", "E-mail"],
      registration: ["Registration", "Reg No", "Registration No"],
      membership: ["Membership", "Membership Type"],
      monthTotal: ["Month Total", "Monthly Total", "Total Amount", "Total"],
      cgst9: ["CGST 9%", "CGST – 9%", "CGST-9%", "CGST 9", "CGST"],
      sgst9: ["SGST 9%", "SGST – 9%", "SGST-9%", "SGST 9", "SGST"],
      cgst18: ["CGST 18%", "CGST – 18%", "CGST-18%", "CGST 18", "IGST – 18%", "IGST 18%"],
      sgst18: ["SGST 18%", "SGST – 18%", "SGST-18%", "SGST 18"],
      totalTax: ["Total Tax", "Tax Total", "Tax Amount"],
      description: ["Description", "Description 1", "Desc"],
      membershipStartDate: ["Membership Start Date", "Start Date", "Member Start"],
      membershipEndDate: ["Membership End Date", "End Date", "Member End"],
      paymentStartDate: ["Payment Start Date", "Pay Start Date"],
      paymentEndDate: ["Payment End Date", "Pay End Date"],
      renewalType: ["Renewal/Quarterly", "Renewal / Quarterly", "Renewal", "Type"],
      product: ["Product", "Product Name", "Product Type"],
      months: ["Months", "Months (Tenure)", "Tenure", "Duration"],
      calculationMonth: ["Calculations of Month", "Calculation of Month", "Calc Month"],
    }

    for (let i = 0; i < data.length; i++) {
      const row = data[i]
      const rowNum = i + 2 // Excel rows are 1-indexed, plus header

      // Get values using flexible column matching
      const invoiceNoVal = getColumnValue(row, COLUMNS.invoiceNo)
      const globalIdVal = getColumnValue(row, COLUMNS.globalId)
      const invoiceDateVal = getColumnValue(row, COLUMNS.invoiceDate)
      const monthTotalVal = getColumnValue(row, COLUMNS.monthTotal)

      // Skip completely empty rows (common at end of Excel files)
      if (!invoiceNoVal && !globalIdVal && !invoiceDateVal && !monthTotalVal) {
        continue // Skip this row silently - it's just an empty row
      }

      // Validate mandatory fields
      if (!invoiceNoVal) {
        errors.push({ row: rowNum, field: "Invoice No", message: "Invoice No is required" })
        continue
      }

      if (!globalIdVal) {
        errors.push({ row: rowNum, field: "Global ID", message: "Global ID is required" })
        continue
      }

      if (!invoiceDateVal) {
        errors.push({ row: rowNum, field: "Invoice Date", message: "Invoice Date is required" })
        continue
      }

      if (!monthTotalVal && monthTotalVal !== 0) {
        errors.push({ row: rowNum, field: "Month Total", message: "Month Total is required" })
        continue
      }

      const invoiceNo = String(invoiceNoVal)

      // Check for duplicates in database
      if (existingInvoiceNos.has(invoiceNo)) {
        errors.push({ row: rowNum, field: "Invoice No", message: `Invoice ${invoiceNo} already exists in the system` })
        continue
      }

      // Check for duplicates in current upload
      if (uploadInvoiceNos.has(invoiceNo)) {
        errors.push({ row: rowNum, field: "Invoice No", message: `Duplicate invoice ${invoiceNo} in upload file` })
        continue
      }

      uploadInvoiceNos.add(invoiceNo)

      const invoiceDate = parseExcelDate(invoiceDateVal as string | number | Date | null | undefined)
      if (!invoiceDate) {
        errors.push({ row: rowNum, field: "Invoice Date", message: "Invalid Invoice Date format" })
        continue
      }

      // Get all other values
      const cgst9 = Number(getColumnValue(row, COLUMNS.cgst9)) || 0
      const sgst9 = Number(getColumnValue(row, COLUMNS.sgst9)) || 0
      const cgst18 = Number(getColumnValue(row, COLUMNS.cgst18)) || 0
      const sgst18 = Number(getColumnValue(row, COLUMNS.sgst18)) || 0
      const monthsVal = getColumnValue(row, COLUMNS.months)
      const monthsTenure = monthsVal ? Number(monthsVal) : null
      
      // Get Calculations of Month (for accrual)
      const calcMonthVal = getColumnValue(row, COLUMNS.calculationMonth)
      const calculationMonth = calcMonthVal ? Number(calcMonthVal) : (monthsTenure || 1)

      // Determine billing cycle
      let billingCycle = null
      if (calculationMonth) {
        billingCycle = calculationMonth >= 12 ? "Annual" : calculationMonth >= 6 ? "Half-Yearly" : "Quarterly"
      }

      // Process invoice
      processedInvoices.push({
        invoiceNo,
        invoiceDate,
        globalId: String(globalIdVal),
        name: String(getColumnValue(row, COLUMNS.name) || ""),
        pinCode: null,
        state: String(getColumnValue(row, COLUMNS.state) || "") || null,
        email: String(getColumnValue(row, COLUMNS.email) || "") || null,
        registration: String(getColumnValue(row, COLUMNS.registration) || "") || null,
        membership: Number(getColumnValue(row, COLUMNS.membership)) || 0,
        membershipTotal: Number(monthTotalVal) || 0,
        cgst: cgst9 + cgst18,
        sgst: sgst9 + sgst18,
        igst: cgst18 + sgst18, // For interstate
        totalTax: Number(getColumnValue(row, COLUMNS.totalTax)) || (cgst9 + sgst9 + cgst18 + sgst18),
        totalAmount: Number(monthTotalVal) || 0,
        description1: null,
        description: String(getColumnValue(row, COLUMNS.description) || "") || null,
        membershipStartDate: parseExcelDate(getColumnValue(row, COLUMNS.membershipStartDate) as string | number | Date | null | undefined),
        membershipEndDate: parseExcelDate(getColumnValue(row, COLUMNS.membershipEndDate) as string | number | Date | null | undefined),
        paymentStartDate: parseExcelDate(getColumnValue(row, COLUMNS.paymentStartDate) as string | number | Date | null | undefined),
        paymentEndDate: parseExcelDate(getColumnValue(row, COLUMNS.paymentEndDate) as string | number | Date | null | undefined),
        type: null,
        renewalType: String(getColumnValue(row, COLUMNS.renewalType) || "") || null,
        month: String(getColumnValue(row, COLUMNS.calculationMonth) || "") || null,
        product: String(getColumnValue(row, COLUMNS.product) || "") || null,
        monthsTenure,
        calculationMonth, // Now properly parsed for accrual
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
        const createdInvoice = await prisma.invoice.create({
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

        // Create accrual entries based on "Calculations of Month"
        const calcMonths = invoice.calculationMonth || invoice.monthsTenure || 1
        if (calcMonths > 0) {
          const monthlyAmount = invoice.totalAmount / calcMonths
          const monthlyTax = invoice.totalTax / calcMonths
          const startDate = invoice.membershipStartDate || invoice.invoiceDate
          
          const accrualData = []
          for (let i = 0; i < calcMonths; i++) {
            const accrualDate = new Date(startDate)
            accrualDate.setMonth(accrualDate.getMonth() + i)
            const accrualMonth = `${accrualDate.getFullYear()}-${String(accrualDate.getMonth() + 1).padStart(2, '0')}`
            
            accrualData.push({
              invoiceId: createdInvoice.id,
              accrualMonth,
              amount: Math.round(monthlyAmount * 100) / 100, // Round to 2 decimals
              taxAmount: Math.round(monthlyTax * 100) / 100,
            })
          }
          
          await prisma.accrual.createMany({
            data: accrualData,
          })
        }

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

  } catch (error: unknown) {
    console.error("Upload error:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to process upload"
    return NextResponse.json(
      { error: errorMessage, details: String(error) },
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
