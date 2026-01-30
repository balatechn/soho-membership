import { NextResponse } from "next/server"
import { checkDatabaseConnection, getCacheHeaders } from "@/lib/prisma"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  const startTime = Date.now()
  
  // Check database connection
  const dbCheck = await checkDatabaseConnection()
  
  const healthStatus = {
    status: dbCheck.connected ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    database: {
      connected: dbCheck.connected,
      latency: dbCheck.latency ? `${dbCheck.latency}ms` : null,
      error: dbCheck.error || null,
      provider: 'Supabase PostgreSQL',
      region: 'aws-0-ap-south-1',
    },
    responseTime: `${Date.now() - startTime}ms`,
  }

  return NextResponse.json(healthStatus, {
    status: dbCheck.connected ? 200 : 503,
    headers: getCacheHeaders(10), // Cache for 10 seconds
  })
}
