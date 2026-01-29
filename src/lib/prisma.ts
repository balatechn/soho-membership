import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Helper to add response caching headers
export function getCacheHeaders(maxAge: number = 60) {
  return {
    'Cache-Control': `s-maxage=${maxAge}, stale-while-revalidate=${maxAge * 2}`,
  }
}
