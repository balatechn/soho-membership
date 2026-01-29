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

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const search = searchParams.get("search") || ""
    const uploadMonth = searchParams.get("uploadMonth") || ""
    const memberId = searchParams.get("memberId") || ""

    const where: any = {}

    if (search) {
      where.OR = [
        { invoiceNo: { contains: search } },
        { name: { contains: search } },
        { member: { globalId: { contains: search } } },
      ]
    }

    if (uploadMonth) {
      where.uploadMonth = uploadMonth
    }

    if (memberId) {
      where.memberId = memberId
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          member: {
            select: {
              globalId: true,
              status: true,
            }
          }
        },
        orderBy: { invoiceDate: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.invoice.count({ where })
    ])

    return NextResponse.json({
      invoices,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      }
    })
  } catch (error) {
    console.error("Get invoices error:", error)
    return NextResponse.json(
      { error: "Failed to fetch invoices" },
      { status: 500 }
    )
  }
}
