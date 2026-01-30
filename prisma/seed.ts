import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

// Use DATABASE_URL for Prisma Postgres
const prisma = new PrismaClient()

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
      email: 'management@junobo.com',
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
