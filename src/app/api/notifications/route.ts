import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sendTestEmail } from "@/lib/email"

// GET - Get all notification configs
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all notification configs
    const configs = await prisma.notificationConfig.findMany({
      orderBy: { type: 'asc' }
    })

    // Get recent notification logs
    const logs = await prisma.notificationLog.findMany({
      orderBy: { sentAt: 'desc' },
      take: 20
    })

    // If no configs exist, create defaults
    if (configs.length === 0) {
      const defaultTypes = ['UPLOAD_SUCCESS', 'UPLOAD_ERROR', 'RENEWAL_REMINDER']
      for (const type of defaultTypes) {
        await prisma.notificationConfig.create({
          data: {
            type,
            emails: '',
            enabled: false
          }
        })
      }
      
      const newConfigs = await prisma.notificationConfig.findMany({
        orderBy: { type: 'asc' }
      })
      
      return NextResponse.json({ configs: newConfigs, logs })
    }

    return NextResponse.json({ configs, logs })
  } catch (error) {
    console.error("Error fetching notification configs:", error)
    return NextResponse.json(
      { error: "Failed to fetch notification configs" },
      { status: 500 }
    )
  }
}

// POST - Update notification config
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { type, emails, enabled } = body

    if (!type) {
      return NextResponse.json({ error: "Type is required" }, { status: 400 })
    }

    const config = await prisma.notificationConfig.upsert({
      where: { type },
      update: {
        emails: emails || '',
        enabled: enabled ?? true
      },
      create: {
        type,
        emails: emails || '',
        enabled: enabled ?? true
      }
    })

    return NextResponse.json({ config })
  } catch (error) {
    console.error("Error updating notification config:", error)
    return NextResponse.json(
      { error: "Failed to update notification config" },
      { status: 500 }
    )
  }
}

// PUT - Send test email
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const result = await sendTestEmail(email)

    if (result.success) {
      return NextResponse.json({ message: "Test email sent successfully" })
    } else {
      return NextResponse.json(
        { error: "Failed to send test email", details: result.error },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Error sending test email:", error)
    return NextResponse.json(
      { error: "Failed to send test email" },
      { status: 500 }
    )
  }
}
