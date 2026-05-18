import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { paypalPost, PAYPAL_PLAN_IDS } from '@/lib/paypal/client'

interface SubscriptionResponse {
  id: string
  status: string
  links: Array<{ href: string; rel: string }>
}

export async function POST(req: NextRequest) {
  const session = await auth()
  const userId = req.headers.get('x-user-id') ?? session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { planId, billing } = await req.json() as { planId: string; billing: 'monthly' | 'yearly' }

  const paypalPlanId = PAYPAL_PLAN_IDS[planId]?.[billing]
  if (!paypalPlanId) {
    return NextResponse.json({ error: `No PayPal plan configured for ${planId}/${billing}` }, { status: 400 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const subscription = await paypalPost<SubscriptionResponse>('/v1/billing/subscriptions', {
    plan_id: paypalPlanId,
    custom_id: `${userId}:${planId}:${billing}`,
    application_context: {
      brand_name: 'Cinematic Forge',
      return_url: `${appUrl}/api/credits/purchase/paypal/subscription/activate`,
      cancel_url: `${appUrl}/signup`,
    },
  })

  const approvalUrl = subscription.links.find((l) => l.rel === 'approve')?.href
  return NextResponse.json({ subscriptionId: subscription.id, approvalUrl })
}
