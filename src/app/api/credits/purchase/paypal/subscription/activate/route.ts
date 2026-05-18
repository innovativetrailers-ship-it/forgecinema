import { NextRequest, NextResponse } from 'next/server'
import { paypalGet } from '@/lib/paypal/client'
import { db } from '@/lib/db'
import { TIER_MONTHLY_CREDITS } from '@/lib/credits'

interface SubscriptionDetails {
  id: string
  status: string
  custom_id: string
}

const ROLE_MAP: Record<string, string> = {
  pro: 'PRO',
  studio: 'STUDIO',
  ultimate: 'ULTIMATE',
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const subscriptionId = searchParams.get('subscription_id')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  if (!subscriptionId) {
    return NextResponse.redirect(`${appUrl}/signup?error=missing_subscription`)
  }

  const subscription = await paypalGet<SubscriptionDetails>(`/v1/billing/subscriptions/${subscriptionId}`)

  if (subscription.status !== 'ACTIVE' && subscription.status !== 'APPROVED') {
    return NextResponse.redirect(`${appUrl}/signup?error=subscription_not_active`)
  }

  const [userId, planId] = (subscription.custom_id ?? '').split(':')
  const role = ROLE_MAP[planId]

  if (userId && role) {
    await db.user.update({
      where: { id: userId },
      data: {
        role: role as 'PRO' | 'STUDIO' | 'ULTIMATE',
        creditBalance: TIER_MONTHLY_CREDITS[role] ?? 0,
        subscriptionStatus: 'active',
      },
    })
  }

  return NextResponse.redirect(`${appUrl}/simple?welcome=1`)
}
