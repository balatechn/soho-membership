const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL
    }
  }
})

async function main() {
  const users = await prisma.user.findMany()
  console.log('Users in database:')
  users.forEach(u => {
    console.log(`  - Email: ${u.email}, Role: ${u.role}`)
  })
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
