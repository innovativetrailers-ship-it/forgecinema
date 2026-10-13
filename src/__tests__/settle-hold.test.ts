type HoldBag = {
  balance: number
  heldCredits: number
  amountHeld: number
  amountUsed: number
  status: string
  email: string
  isInternal: boolean
  txns: Array<{ type: string; amount: number }>
}

function bag(): HoldBag {
  return (globalThis as { __hold?: HoldBag }).__hold!
}

jest.mock('@/lib/db', () => ({
  db: {
    creditHold: {
      findUnique: jest.fn(async () => ({
        userId: 'user-1',
        jobId: 'job-1',
        amountHeld: bag().amountHeld,
        amountUsed: bag().amountUsed,
        status: bag().status,
      })),
      update: jest.fn(async ({ data }: { data: { status?: string } }) => {
        if (data.status) bag().status = data.status
        return {}
      }),
    },
    user: {
      findUnique: jest.fn(async () => ({
        creditBalance: bag().balance,
        isInternal: bag().isInternal,
        email: bag().email,
      })),
      update: jest.fn(async ({ data }: { data: { creditBalance?: { increment: number }; heldCredits?: { decrement: number } } }) => {
        if (data.creditBalance?.increment) bag().balance += data.creditBalance.increment
        if (data.heldCredits?.decrement) bag().heldCredits -= data.heldCredits.decrement
        return {}
      }),
    },
    creditTransaction: {
      create: jest.fn(async ({ data }: { data: { type: string; amount: number } }) => {
        bag().txns.push({ type: data.type, amount: data.amount })
        return data
      }),
    },
    $transaction: jest.fn(async (ops: Array<Promise<unknown>>) => Promise.all(ops)),
  },
}))

import { releaseHold, settleHold } from '../lib/credits/escrow'

function reset(used: number) {
  ;(globalThis as { __hold?: HoldBag }).__hold = {
    balance: 100,
    heldCredits: 12,
    amountHeld: 12,
    amountUsed: used,
    status: 'ACTIVE',
    email: 'susi.tate@gmail.com',
    isInternal: false,
    txns: [],
  }
}

describe('hold settle releases the extra 20 percent', () => {
  it('charges the quote once and returns the reserve', async () => {
    reset(10)
    const result = await settleHold('job-1')
    expect(result).toEqual({ used: 10, refunded: 2 })
    expect(bag().balance).toBe(102)
    expect(bag().status).toBe('SETTLED')
    expect(bag().txns).toEqual([
      { type: 'release', amount: 12 },
      { type: 'deduction', amount: -10 },
    ])
  })

  it('refunds a failed job in full', async () => {
    reset(0)
    bag().amountUsed = 0
    await releaseHold('job-1')
    expect(bag().status).toBe('REFUNDED')
    expect(bag().balance).toBe(112)
    expect(bag().txns.map((row) => row.type)).toEqual(['release'])
    expect(bag().txns.some((row) => row.type === 'deduction')).toBe(false)
  })

  it('refunds a cancelled job in full', async () => {
    reset(4)
    await releaseHold('job-1')
    expect(bag().status).toBe('REFUNDED')
    expect(bag().balance).toBe(112)
    expect(bag().txns.filter((row) => row.type === 'deduction')).toHaveLength(0)
  })

  it('does not charge an ungated account', async () => {
    reset(10)
    bag().email = 'innovative.trailers@gmail.com'
    bag().isInternal = true
    const result = await settleHold('job-1')
    expect(result).toEqual({ used: 10, refunded: 0 })
    expect(bag().balance).toBe(100)
    expect(bag().txns).toHaveLength(0)
    expect(bag().status).toBe('SETTLED')
  })
})
