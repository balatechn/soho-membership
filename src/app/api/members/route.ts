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
    const status = searchParams.get("status") || ""
    const product = searchParams.get("product") || ""

    const where: any = {}

    if (search) {
      where.OR = [
        { globalId: { contains: search } },
        { name: { contains: search } },
        { email: { contains: search } },
      ]
    }

    if (status) {
      where.status = status
    }

    if (product) {
      where.product = product
    }

    const [members, total] = await Promise.all([
      prisma.member.findMany({
        where,
        include: {
          _count: {
            select: { invoices: true }
          }
        },
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.member.count({ where })
    ])

    return NextResponse.json({
      members,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      }
    })
  } catch (error) {
    console.error("Get members error:", error)
    return NextResponse.json(
      { error: "Failed to fetch members" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!["ADMIN", "FINANCE"].includes(session.user.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: "Member ID is required" }, { status: 400 })
    }

    const member = await prisma.member.update({
      where: { id },
      data: updateData,
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: "UPDATE",
        entity: "Member",
        entityId: id,
        details: JSON.stringify(updateData),
        userId: session.user.id,
      }
    })

    return NextResponse.json(member)
  } catch (error) {
    console.error("Update member error:", error)
    return NextResponse.json(
      { error: "Failed to update member" },
      { status: 500 }
    )
  }
}
