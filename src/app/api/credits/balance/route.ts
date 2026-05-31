import { NextRequest, NextResponse } from 'next/server'
import { db }                        from '@/lib/db'

export async function GET(req: NextRequest): Promise<NextResponse> {
  const userId = req.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await db.user.findUnique({
    where:  { id: userId },
    select: { role: true, creditBalance: true, subscriptionStatus: true },
  })

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // ADMIN / Dev: unlimited
  if (user.role === 'ADMIN') {
    return NextResponse.json({
      isAdmin:            true,
      credits:            9_999_999,
      unlimited:          true,
      subscriptionStatus: 'admin',
      tier:               'admin',
      message:            'Dev account — unlimited credits',
    })
  }

  // Regular user: real balance from DB
  let stripeBalanceUSD: number | null = null
  try {
    const { getStripeBalance } = await import('@/lib/payments/stripeCustomer')
    const stripeData            = await getStripeBalance(userId)
    stripeBalanceUSD            = stripeData?.balanceCents ? stripeData.balanceCents / 100 : null
  } catch {
    // Stripe not configured — fall back to DB balance only
  }

  return NextResponse.json({
    isAdmin:            false,
    credits:            user.creditBalance ?? 0,
    unlimited:          false,
    subscriptionStatus: user.subscriptionStatus ?? 'free',
    tier:               user.subscriptionStatus ?? 'free',
    stripeBalanceUSD,
  })
}
