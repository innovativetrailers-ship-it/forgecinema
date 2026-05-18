import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const ROLE_MAP: Record<string, string> = {
  free: 'FREE',
  pro: 'PRO',
  studio: 'STUDIO',
  ultimate: 'ULTIMATE',
}

const CREDITS_MAP: Record<string, number> = {
  free: 50,
  pro: 500,
  studio: 2000,
  ultimate: 6000,
}

export async function POST(req: NextRequest) {
  const userId = req.headers.get('x-user-id')
  const body = await req.json()
  const { userId: bodyUserId, planId, paymentProvider, externalPaymentId } = body

  const uid = userId ?? bodyUserId
  if (!uid) return NextResponse.json({ error: 'userId required' }, { status: 400 })
  if (!planId || !ROLE_MAP[planId]) return NextResponse.json({ error: 'invalid planId' }, { status: 400 })

  // For paid plans, the webhook will have already verified payment
  // This endpoint is called after Stripe/PayPal webhook confirms, or directly for free plan
  await db.user.update({
    where: { id: uid },
    data: {
      role: ROLE_MAP[planId] as 'FREE' | 'PRO' | 'STUDIO' | 'ULTIMATE' | 'ADMIN',
      creditBalance: CREDITS_MAP[planId],
      subscriptionStatus: planId === 'free' ? 'trial' : 'active',
    },
  })

  return NextResponse.json({ success: true })
}
