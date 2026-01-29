import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const member = await prisma.member.findUnique({
      where: { id },
      include: {
        invoices: {
          orderBy: { invoiceDate: "desc" }
        }
      }
    })

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 })
    }

    return NextResponse.json(member)
  } catch (error) {
    console.error("Get member error:", error)
    return NextResponse.json(
      { error: "Failed to fetch member" },
      { status: 500 }
    )
  }
}
