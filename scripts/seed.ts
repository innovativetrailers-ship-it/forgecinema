#!/usr/bin/env tsx
/**
 * Database seed — creates an admin user and sample data for local development.
 * Run: npx tsx scripts/seed.ts
 */
import 'dotenv/config'
import bcrypt from 'bcryptjs'
import pg from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL! })
const adapter = new PrismaPg(pool)
const db = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Seeding database…')

  // ── Admin user ──────────────────────────────────────────────────────────────
  const adminEmail = 'admin@growthengine.ai'
  const existing = await db.user.findUnique({ where: { email: adminEmail } })

  if (!existing) {
    const passwordHash = await bcrypt.hash('Cinema2026!', 12)
    const admin = await db.user.create({
      data: {
        email: adminEmail,
        name: 'Cinema Admin',
        passwordHash,
        role: 'ADMIN',
        creditBalance: 100_000,
      },
    })
    console.log(`✓ Admin user created: ${admin.email} (id: ${admin.id})`)
  } else {
    console.log(`✓ Admin user already exists: ${adminEmail}`)
  }

  // ── Demo FREE user ──────────────────────────────────────────────────────────
  const demoEmail = 'demo@growthengine.ai'
  const demoExists = await db.user.findUnique({ where: { email: demoEmail } })
  if (!demoExists) {
    const passwordHash = await bcrypt.hash('Demo1234!', 12)
    await db.user.create({
      data: {
        email: demoEmail,
        name: 'Demo User',
        passwordHash,
        role: 'FREE',
        creditBalance: 100,
      },
    })
    console.log(`✓ Demo user created: ${demoEmail}`)
  }

  console.log('\n🎬 Seed complete.')
  console.log('Admin login:  admin@growthengine.ai / Cinema2026!')
  console.log('Demo login:   demo@growthengine.ai  / Demo1234!')
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect())
