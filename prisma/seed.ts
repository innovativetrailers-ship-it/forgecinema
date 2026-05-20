import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
})

async function main() {
  const DEV_EMAIL = process.env.DEV_ACCOUNT_EMAIL ?? 'innovative.trailers@gmail.com'

  const existing = await db.user.findUnique({ where: { email: DEV_EMAIL } })

  if (!existing) {
    await db.user.create({
      data: {
        email: DEV_EMAIL,
        name: 'INNOVATIVE Dev',
        role: 'ADMIN',
        creditBalance: 9_999_999,
        totalGenerated: 0,
      },
    })
    console.log(`✓ Dev account created: ${DEV_EMAIL}`)
    console.log('  Role: ADMIN | Credits: 9,999,999 | Login: Google OAuth')
  } else {
    await db.user.update({
      where: { email: DEV_EMAIL },
      data: { role: 'ADMIN', creditBalance: 9_999_999 },
    })
    console.log(`✓ Dev account updated to ADMIN with unlimited credits: ${DEV_EMAIL}`)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
