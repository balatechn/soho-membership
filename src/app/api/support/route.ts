import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Get all tickets (admin sees all, users see their own)
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const ticketId = searchParams.get("ticketId")

    // If ticketId provided, get single ticket with messages
    if (ticketId) {
      const ticket = await prisma.supportTicket.findUnique({
        where: { id: ticketId },
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true }
          },
          messages: {
            include: {
              sender: {
                select: { id: true, name: true, email: true, role: true }
              }
            },
            orderBy: { createdAt: 'asc' }
          }
        }
      })

      if (!ticket) {
        return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
      }

      // Check permission - admin can see all, users can only see their own
      if (session.user.role !== "ADMIN" && ticket.userId !== session.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }

      return NextResponse.json({ ticket })
    }

    // Get all tickets
    const where: Record<string, unknown> = {}
    
    // Non-admin users can only see their own tickets
    if (session.user.role !== "ADMIN") {
      where.userId = session.user.id
    }

    if (status && status !== "ALL") {
      where.status = status
    }

    const tickets = await prisma.supportTicket.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: {
              select: { name: true }
            }
          }
        },
        _count: {
          select: { messages: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    })

    // Count by status
    const statusCounts = await prisma.supportTicket.groupBy({
      by: ['status'],
      where: session.user.role !== "ADMIN" ? { userId: session.user.id } : {},
      _count: true
    })

    return NextResponse.json({ 
      tickets,
      counts: {
        total: tickets.length,
        open: statusCounts.find(s => s.status === 'OPEN')?._count || 0,
        inProgress: statusCounts.find(s => s.status === 'IN_PROGRESS')?._count || 0,
        resolved: statusCounts.find(s => s.status === 'RESOLVED')?._count || 0,
        closed: statusCounts.find(s => s.status === 'CLOSED')?._count || 0,
      }
    })
  } catch (error) {
    console.error("Error fetching support tickets:", error)
    return NextResponse.json(
      { error: "Failed to fetch support tickets" },
      { status: 500 }
    )
  }
}

// POST - Create new ticket or add message
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { action, ticketId, subject, message, priority } = body

    if (action === "create") {
      // Create new ticket
      if (!subject || !message) {
        return NextResponse.json(
          { error: "Subject and message are required" },
          { status: 400 }
        )
      }

      const ticket = await prisma.supportTicket.create({
        data: {
          subject,
          priority: priority || "NORMAL",
          userId: session.user.id,
          messages: {
            create: {
              message,
              senderId: session.user.id,
              isAdmin: session.user.role === "ADMIN"
            }
          }
        },
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true }
          },
          messages: true
        }
      })

      return NextResponse.json({ ticket, message: "Ticket created successfully" })
    }

    if (action === "message") {
      // Add message to existing ticket
      if (!ticketId || !message) {
        return NextResponse.json(
          { error: "Ticket ID and message are required" },
          { status: 400 }
        )
      }

      // Verify ticket exists and user has access
      const ticket = await prisma.supportTicket.findUnique({
        where: { id: ticketId }
      })

      if (!ticket) {
        return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
      }

      if (session.user.role !== "ADMIN" && ticket.userId !== session.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }

      // Add message and update ticket status
      const newMessage = await prisma.supportMessage.create({
        data: {
          ticketId,
          message,
          senderId: session.user.id,
          isAdmin: session.user.role === "ADMIN"
        },
        include: {
          sender: {
            select: { id: true, name: true, email: true, role: true }
          }
        }
      })

      // Update ticket status if admin responds
      if (session.user.role === "ADMIN" && ticket.status === "OPEN") {
        await prisma.supportTicket.update({
          where: { id: ticketId },
          data: { status: "IN_PROGRESS" }
        })
      }

      return NextResponse.json({ message: newMessage })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Error creating support ticket/message:", error)
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    )
  }
}

// PUT - Update ticket status (admin only)
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { ticketId, status, priority } = body

    if (!ticketId) {
      return NextResponse.json({ error: "Ticket ID is required" }, { status: 400 })
    }

    const updateData: Record<string, string> = {}
    if (status) updateData.status = status
    if (priority) updateData.priority = priority

    const ticket = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: updateData,
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true }
        }
      }
    })

    return NextResponse.json({ ticket, message: "Ticket updated successfully" })
  } catch (error) {
    console.error("Error updating support ticket:", error)
    return NextResponse.json(
      { error: "Failed to update ticket" },
      { status: 500 }
    )
  }
}
