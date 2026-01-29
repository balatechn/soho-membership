import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL
    }
  }
})

async function clearData() {
  console.log('Clearing all uploaded data...')
  
  // Delete in order due to foreign key constraints
  const invoices = await prisma.invoice.deleteMany({})
  console.log(`Deleted ${invoices.count} invoices`)
  
  const members = await prisma.member.deleteMany({})
  console.log(`Deleted ${members.count} members`)
  
  const uploadLogs = await prisma.uploadLog.deleteMany({})
  console.log(`Deleted ${uploadLogs.count} upload logs`)
  
  const auditLogs = await prisma.auditLog.deleteMany({})
  console.log(`Deleted ${auditLogs.count} audit logs`)
  
  console.log('All data cleared successfully!')
}

clearData()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
