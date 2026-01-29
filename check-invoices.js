const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const invoices = await prisma.invoice.findMany({
    take: 5,
    select: {
      invoiceNo: true,
      invoiceDate: true,
      totalAmount: true,
      totalTax: true,
      uploadMonth: true
    }
  })
  console.log('Sample invoices:')
  console.log(JSON.stringify(invoices, null, 2))
  
  // Check current month
  const now = new Date()
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  console.log('\nCurrent month start:', currentMonth)
  
  const currentMonthInvoices = await prisma.invoice.count({
    where: {
      invoiceDate: {
        gte: currentMonth,
        lte: now
      }
    }
  })
  console.log('Invoices in current month:', currentMonthInvoices)
  
  // Check total invoices
  const total = await prisma.invoice.count()
  console.log('Total invoices:', total)
  
  // Get date range of invoices
  const dateRange = await prisma.invoice.aggregate({
    _min: { invoiceDate: true },
    _max: { invoiceDate: true }
  })
  console.log('Invoice date range:', dateRange)
}

main()
  .finally(() => prisma.$disconnect())
