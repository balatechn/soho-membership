import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Fetch upload history with pagination
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const skip = (page - 1) * limit

    const [uploads, total] = await Promise.all([
      prisma.uploadLog.findMany({
        include: {
          user: {
            select: { id: true, name: true, email: true }
          },
          _count: {
            select: { invoices: true }
          }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.uploadLog.count()
    ])

    // Get invoice and accrual counts for each upload
    const uploadsWithStats = await Promise.all(
      uploads.map(async (upload) => {
        const invoiceIds = await prisma.invoice.findMany({
          where: { uploadLogId: upload.id },
          select: { id: true }
        })
        
        const accrualCount = await prisma.accrual.count({
          where: { invoiceId: { in: invoiceIds.map(i => i.id) } }
        })

        return {
          ...upload,
          invoiceCount: invoiceIds.length,
          accrualCount
        }
      })
    )

    return NextResponse.json({
      uploads: uploadsWithStats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error("Failed to fetch uploads:", error)
    return NextResponse.json({ error: "Failed to fetch uploads" }, { status: 500 })
  }
}

// DELETE - Delete an upload and its related data
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only admin can delete uploads
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Only administrators can delete uploads" }, { status: 403 })
    }

    const { uploadId } = await request.json()

    if (!uploadId) {
      return NextResponse.json({ error: "Upload ID is required" }, { status: 400 })
    }

    // Get the upload log
    const uploadLog = await prisma.uploadLog.findUnique({
      where: { id: uploadId },
      include: {
        invoices: {
          select: { id: true }
        }
      }
    })

    if (!uploadLog) {
      return NextResponse.json({ error: "Upload not found" }, { status: 404 })
    }

    const invoiceIds = uploadLog.invoices.map(i => i.id)

    // Delete in correct order (respecting foreign key constraints)
    // 1. Delete all accruals for these invoices
    const deletedAccruals = await prisma.accrual.deleteMany({
      where: { invoiceId: { in: invoiceIds } }
    })

    // 2. Delete all invoices from this upload
    const deletedInvoices = await prisma.invoice.deleteMany({
      where: { uploadLogId: uploadId }
    })

    // 3. Delete the upload log itself
    await prisma.uploadLog.delete({
      where: { id: uploadId }
    })

    return NextResponse.json({
      success: true,
      message: "Upload deleted successfully",
      deleted: {
        accruals: deletedAccruals.count,
        invoices: deletedInvoices.count,
        uploadLog: 1
      }
    })
  } catch (error) {
    console.error("Failed to delete upload:", error)
    return NextResponse.json({ error: "Failed to delete upload" }, { status: 500 })
  }
}
