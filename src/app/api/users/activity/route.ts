import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Update user's online status (called periodically from client)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Update last active timestamp
    await prisma.user.update({
      where: { id: session.user.id },
      data: { 
        lastActiveAt: new Date(),
        isOnline: true
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Activity update error:", error)
    return NextResponse.json({ error: "Failed to update activity" }, { status: 500 })
  }
}

// Get online users (admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only admin can see online users
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    // Consider users active if they were active in the last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)

    // First, mark users as offline if they haven't been active
    await prisma.user.updateMany({
      where: {
        lastActiveAt: { lt: fiveMinutesAgo },
        isOnline: true
      },
      data: { isOnline: false }
    })

    // Get all users with their online status
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        lastActiveAt: true,
        isOnline: true,
      },
      orderBy: [
        { isOnline: "desc" },
        { lastActiveAt: "desc" }
      ]
    })

    // Calculate online status based on last activity
    const usersWithStatus = users.map(user => ({
      ...user,
      isOnline: user.lastActiveAt && new Date(user.lastActiveAt) > fiveMinutesAgo,
      lastActiveAt: user.lastActiveAt
    }))

    const onlineCount = usersWithStatus.filter(u => u.isOnline).length

    return NextResponse.json({
      users: usersWithStatus,
      onlineCount,
      totalUsers: users.length
    })
  } catch (error) {
    console.error("Get online users error:", error)
    return NextResponse.json({ error: "Failed to fetch online users" }, { status: 500 })
  }
}
