import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

// Use DIRECT_URL for seeding to avoid pooler issues
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL
    }
  }
})

async function main() {
  console.log('Seeding database...')

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 12)
  
  const admin = await prisma.user.upsert({
    where: { email: 'bala.techn@gmail.com' },
    update: {},
    create: {
      email: 'bala.techn@gmail.com',
      name: 'Admin User',
      password: hashedPassword,
      role: 'ADMIN',
    },
  })

  console.log('Created admin user:', admin.email)

  // Create sample email config
  await prisma.emailConfig.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      name: 'Management Team',
      email: 'management@sohohouse.com',
      isActive: true,
      reportTypes: JSON.stringify(['revenue-summary', 'member-status']),
    },
  })

  console.log('Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
