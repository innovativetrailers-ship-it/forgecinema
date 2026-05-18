/**
 * PayPal subscription plan helpers.
 * Plans must be pre-created in the PayPal developer dashboard and IDs stored in env vars.
 * This module maps plan tiers to PayPal plan IDs and provides subscription lifecycle helpers.
 */
import { paypalPost, paypalGet, PAYPAL_PLAN_IDS } from './client'
import { db } from '../db'

export interface PayPalSubscription {
  id: string
  status: 'APPROVAL_PENDING' | 'APPROVED' | 'ACTIVE' | 'SUSPENDED' | 'CANCELLED' | 'EXPIRED'
  links: Array<{ href: string; rel: string; method: string }>
}

/**
 * Create a PayPal subscription for the given plan and billing cycle.
 * Returns the subscription object including the approval URL to redirect the user to.
 */
export async function createPayPalSubscription(params: {
  userId: string
  planId: 'pro' | 'studio' | 'ultimate'
  billing: 'monthly' | 'yearly'
  returnUrl: string
  cancelUrl: string
}): Promise<PayPalSubscription> {
  const paypalPlanId = PAYPAL_PLAN_IDS[params.planId]?.[params.billing]
  if (!paypalPlanId) {
    throw new Error(`No PayPal plan configured for ${params.planId}/${params.billing}`)
  }

  return paypalPost<PayPalSubscription>('/v1/billing/subscriptions', {
    plan_id: paypalPlanId,
    custom_id: `${params.userId}:${params.planId}`,
    application_context: {
      brand_name: 'Cinematic Forge',
      locale: 'en-US',
      shipping_preference: 'NO_SHIPPING',
      user_action: 'SUBSCRIBE_NOW',
      return_url: params.returnUrl,
      cancel_url: params.cancelUrl,
    },
  })
}

/**
 * Fetch a PayPal subscription by ID.
 */
export async function getPayPalSubscription(subscriptionId: string): Promise<PayPalSubscription> {
  return paypalGet<PayPalSubscription>(`/v1/billing/subscriptions/${subscriptionId}`)
}

/**
 * Cancel a PayPal subscription.
 */
export async function cancelPayPalSubscription(subscriptionId: string, reason: string): Promise<void> {
  await paypalPost(`/v1/billing/subscriptions/${subscriptionId}/cancel`, { reason })
}

/**
 * Handle the BILLING.SUBSCRIPTION.ACTIVATED webhook event.
 * Updates the user's role, credits, and subscription status.
 */
export async function handleSubscriptionActivated(params: {
  subscriptionId: string
  customId: string  // format: "userId:planId"
}): Promise<void> {
  const [userId, planId] = params.customId.split(':')
  if (!userId || !planId) throw new Error(`Invalid custom_id: ${params.customId}`)

  const { activateUser } = await import('../auth/verification')
  await activateUser({
    userId,
    planId: planId as 'pro' | 'studio' | 'ultimate',
    paymentProvider: 'paypal',
    externalPaymentId: params.subscriptionId,
  })

  // Store the PayPal subscription ID on the user record for future lifecycle management
  await db.user.update({
    where: { id: userId },
    data: { paypalSubscriptionId: params.subscriptionId } as Record<string, unknown>,
  }).catch(() => {
    // Field may not exist yet in schema — non-fatal
  })
}

/**
 * Handle the BILLING.SUBSCRIPTION.CANCELLED or BILLING.SUBSCRIPTION.EXPIRED webhook.
 * Downgrades the user to FREE tier.
 */
export async function handleSubscriptionCancelled(params: {
  customId: string
}): Promise<void> {
  const [userId] = params.customId.split(':')
  if (!userId) return

  await db.user.update({
    where: { id: userId },
    data: {
      role: 'FREE',
      subscriptionStatus: 'cancelled',
    },
  })
}
