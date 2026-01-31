import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const user = await prisma.user.findFirst({
    where: { email: 'bala.techn@gmail.com' },
    select: { email: true, role: true, name: true }
  })
  console.log('User:', user)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
