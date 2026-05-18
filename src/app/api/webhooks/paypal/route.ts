import { NextRequest, NextResponse } from 'next/server'
import { addCredits, handleSubscriptionRenewal, TIER_MONTHLY_CREDITS } from '@/lib/credits'
import { CREDIT_PACKS } from '@/lib/paypal/client'
import { db } from '@/lib/db'

const ROLE_MAP: Record<string, string> = {
  pro: 'PRO',
  studio: 'STUDIO',
  ultimate: 'ULTIMATE',
}

export async function POST(req: NextRequest) {
  const event = await req.json() as {
    event_type: string
    resource: {
      id: string
      custom_id?: string
      custom?: string
    }
  }

  switch (event.event_type) {
    case 'PAYMENT.CAPTURE.COMPLETED': {
      // One-time credit pack purchase
      const customId = event.resource.custom_id ?? ''
      const [userId, packId] = customId.split(':')
      const pack = CREDIT_PACKS.find((p) => p.packId === packId)
      if (userId && pack) {
        await addCredits(userId, pack.credits, `paypal:${event.resource.id}`)
      }
      break
    }

    case 'BILLING.SUBSCRIPTION.ACTIVATED': {
      // New subscription activated
      const customId = event.resource.custom_id ?? event.resource.custom ?? ''
      const [userId, planId] = customId.split(':')
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
      break
    }

    case 'BILLING.SUBSCRIPTION.RENEWED': {
      // Monthly credit top-up
      const customId = event.resource.custom_id ?? event.resource.custom ?? ''
      const [userId, planId] = customId.split(':')
      if (userId && planId && planId in ROLE_MAP) {
        await handleSubscriptionRenewal(userId, planId as 'pro' | 'studio' | 'ultimate')
      }
      break
    }

    case 'BILLING.SUBSCRIPTION.CANCELLED':
    case 'BILLING.SUBSCRIPTION.SUSPENDED': {
      const customId = event.resource.custom_id ?? event.resource.custom ?? ''
      const [userId] = customId.split(':')
      if (userId) {
        await db.user.update({
          where: { id: userId },
          data: { subscriptionStatus: 'cancelled' },
        })
      }
      break
    }
  }

  return new NextResponse('OK', { status: 200 })
}
