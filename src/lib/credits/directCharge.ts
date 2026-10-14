import { MissingPriceError } from '@/lib/credits/math'
import { directChargeCredits } from '@/lib/credits/quote'
import { CreditError } from '@/lib/credits'
import { EscrowError } from '@/lib/credits/escrow'

export { directChargeCredits }

/**
 * Same deduct-and-refund path as jobs/create. The amount is the quote for the
 * models the director actually assigned, summed once. A throw gives the credits back.
 */
export async function chargeDirectRun<T>(
  userId: string,
  shots: Array<{ model: string; durationSeconds: number }>,
  run: () => Promise<T>,
): Promise<T> {
  const { checkAndDeductCredits, refundCredits } = await import('@/lib/credits')
  const { isUngatedAccount } = await import('@/lib/billing/accountAllow')
  const { db } = await import('@/lib/db')
  let credits = 0
  try {
    credits = directChargeCredits(shots)
  } catch (err) {
    const account = await db.user.findUnique({ where: { id: userId }, select: { email: true, isInternal: true } })
    if (err instanceof MissingPriceError && account && isUngatedAccount(account.email, account.isInternal === true)) credits = 0
    else throw err
  }
  if (credits > 0) {
    try {
      await checkAndDeductCredits(db, userId, credits, 'direct')
    } catch (err) {
      if (err instanceof CreditError) throw new EscrowError(err.message)
      throw err
    }
  }
  try {
    return await run()
  } catch (err) {
    if (credits > 0) {
      try {
        await refundCredits(db, userId, credits, 'direct failed')
      } catch (refundErr) {
        console.warn('[direct] refund', refundErr instanceof Error ? refundErr.message : refundErr)
      }
    }
    throw err
  }
}
