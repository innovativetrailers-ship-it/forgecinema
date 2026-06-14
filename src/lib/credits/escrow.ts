/**
 * Layer 1 — credit escrow: hold at job start, consume per delivered segment, settle on end.
 */

import { db } from '@/lib/db'

export class EscrowError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'EscrowError'
  }
}

export async function openHold(
  userId: string,
  jobId: string,
  estimateCredits: number,
  budgetCap?: number,
): Promise<number> {
  const held = Math.ceil(estimateCredits * 1.2)

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { creditBalance: true, role: true, heldCredits: true },
  })
  if (!user) throw new EscrowError('User not found')
  if (user.role === 'ADMIN') {
    await db.creditHold.upsert({
      where: { jobId },
      create: { userId, jobId, amountHeld: 0, amountUsed: 0, status: 'ACTIVE', budgetCap },
      update: { budgetCap },
    })
    return 0
  }

  const available = user.creditBalance
  if (available < held) {
    throw new EscrowError(`Insufficient credits: need ${held} held, have ${available}`)
  }

  await db.$transaction([
    db.user.update({
      where: { id: userId },
      data: {
        creditBalance: { decrement: held },
        heldCredits: { increment: held },
      },
    }),
    db.creditHold.upsert({
      where: { jobId },
      create: { userId, jobId, amountHeld: held, amountUsed: 0, status: 'ACTIVE', budgetCap },
      update: { amountHeld: held, amountUsed: 0, status: 'ACTIVE', budgetCap },
    }),
    db.creditTransaction.create({
      data: {
        userId,
        amount: -held,
        description: `Escrow hold for job ${jobId}`,
        balanceAfter: available - held,
      },
    }),
  ])

  return held
}

export async function consumeFromHold(
  jobId: string,
  segmentId: string,
  cost: number,
): Promise<void> {
  if (cost <= 0) return

  const hold = await db.creditHold.findUnique({ where: { jobId } })
  if (!hold || hold.status !== 'ACTIVE') return

  await db.$transaction([
    db.creditHold.update({
      where: { jobId },
      data: { amountUsed: { increment: cost } },
    }),
    db.segmentLedger.create({
      data: { jobId, segmentId, cost },
    }),
  ])
}

export async function getHold(jobId: string) {
  return db.creditHold.findUnique({ where: { jobId } })
}

export async function settleHold(jobId: string): Promise<{ used: number; refunded: number } | null> {
  const hold = await db.creditHold.findUnique({ where: { jobId } })
  if (!hold || hold.status !== 'ACTIVE') return null

  const refund = Math.max(0, hold.amountHeld - hold.amountUsed)
  const user = await db.user.findUnique({
    where: { id: hold.userId },
    select: { creditBalance: true, role: true },
  })

  if (user?.role === 'ADMIN') {
    await db.creditHold.update({
      where: { jobId },
      data: { status: 'SETTLED', settledAt: new Date() },
    })
    return { used: hold.amountUsed, refunded: 0 }
  }

  const newBalance = (user?.creditBalance ?? 0) + refund

  await db.$transaction([
    db.user.update({
      where: { id: hold.userId },
      data: {
        creditBalance: { increment: refund },
        heldCredits: { decrement: hold.amountHeld },
      },
    }),
    db.creditHold.update({
      where: { jobId },
      data: { status: 'SETTLED', settledAt: new Date() },
    }),
    ...(refund > 0
      ? [
          db.creditTransaction.create({
            data: {
              userId: hold.userId,
              amount: refund,
              description: `Escrow refund for job ${jobId}`,
              balanceAfter: newBalance,
            },
          }),
        ]
      : []),
  ])

  return { used: hold.amountUsed, refunded: refund }
}
