// Single source of truth for ALL access decisions.
// ADMIN users: always allowed, credits never deducted.
// Regular users: gated by creditBalance and subscription tier.

import { db } from '@/lib/db'
import {
  getUserTier,
  TIER_PERMISSIONS,
  getRequiredUpgrade,
  type SubscriptionTier,
} from './tiers'

export type AccessResult =
  | { allowed: true;  isAdmin: boolean; credits: number }
  | { allowed: false; reason: string;   code: 401 | 402 | 403 | 503 }

/**
 * Check if a user can perform an operation costing `creditsRequired`.
 * ADMIN: always allowed, credits never deducted, no Stripe check.
 * Regular: must have sufficient creditBalance.
 */
export async function checkAccess(
  userId:          string | null,
  creditsRequired: number = 0,
): Promise<AccessResult> {
  if (!userId) {
    return { allowed: false, reason: 'Not authenticated', code: 401 }
  }

  const user = await db.user.findUnique({
    where:  { id: userId },
    select: { role: true, creditBalance: true, subscriptionStatus: true },
  })

  if (!user) {
    return { allowed: false, reason: 'User not found', code: 401 }
  }

  // ADMIN / DEV — always allowed, unlimited
  if (user.role === 'ADMIN') {
    return { allowed: true, isAdmin: true, credits: 9_999_999 }
  }

  // Regular user — credit balance check
  const balance = user.creditBalance ?? 0

  if (balance < creditsRequired) {
    return {
      allowed: false,
      reason:  `Insufficient credits. You have ${balance} credits, this costs ${creditsRequired}. Add more credits to continue.`,
      code:    402,
    }
  }

  return { allowed: true, isAdmin: false, credits: balance }
}

// ─── Tier access ──────────────────────────────────────────────────────────────

export type TierAccessResult =
  | { allowed: true }
  | { allowed: false; reason: string; requiredTier: SubscriptionTier }

const TIER_LABELS: Record<string, string> = {
  pro:      'Pro ($19/mo)',
  studio:   'Studio ($49/mo)',
  ultimate: 'Ultimate ($99/mo)',
}

/**
 * Check if a user's subscription tier allows a specific feature.
 * ADMIN always passes.
 */
export async function checkTierAccess(
  userId:     string | null,
  featureKey: string,
): Promise<TierAccessResult> {
  if (!userId) return { allowed: false, reason: 'Not authenticated', requiredTier: 'pro' }

  const user = await db.user.findUnique({
    where:  { id: userId },
    select: { role: true, subscriptionStatus: true },
  })

  const tier = getUserTier(user?.subscriptionStatus ?? null, user?.role ?? 'USER')

  if (tier === 'admin') return { allowed: true }

  const required = getRequiredUpgrade(tier, featureKey)
  if (required) {
    return {
      allowed:      false,
      reason:       `This feature requires ${TIER_LABELS[required] ?? required}`,
      requiredTier: required,
    }
  }

  return { allowed: true }
}

/**
 * Check if a user's plan allows the chosen Director model count.
 */
export async function checkDirectorModelLimit(
  userId:        string | null,
  selectedCount: number,
): Promise<TierAccessResult> {
  if (!userId) return { allowed: false, reason: 'Not authenticated', requiredTier: 'pro' }

  const user = await db.user.findUnique({
    where:  { id: userId },
    select: { role: true, subscriptionStatus: true },
  })

  const tier  = getUserTier(user?.subscriptionStatus ?? null, user?.role ?? 'USER')
  const perms = TIER_PERMISSIONS[tier]

  if (selectedCount > perms.maxDirectorModels) {
    const needed: SubscriptionTier = selectedCount <= 3 ? 'pro' : selectedCount <= 5 ? 'studio' : 'ultimate'
    return {
      allowed:      false,
      reason:       `Your plan allows ${perms.maxDirectorModels} model${perms.maxDirectorModels === 1 ? '' : 's'} in Director mode. Select fewer, or upgrade.`,
      requiredTier: needed,
    }
  }

  return { allowed: true }
}

// ─── Credit deduction ─────────────────────────────────────────────────────────

/**
 * Deduct credits from a regular user.
 * ADMIN users are never charged — this is a no-op for them.
 */
export async function deductUserCredits(
  userId:         string,
  amount:         number,
  description:    string,
  vendor?:        string,
  vendorCostUSD?: number,
): Promise<void> {
  const user = await db.user.findUnique({
    where:  { id: userId },
    select: { role: true, creditBalance: true },
  })

  // ADMIN — never deduct
  if (user?.role === 'ADMIN') return

  const newBalance = (user?.creditBalance ?? 0) - amount

  await db.$transaction([
    db.user.update({
      where: { id: userId },
      data:  { creditBalance: { decrement: amount } },
    }),
    db.creditTransaction.create({
      data: {
        userId,
        amount:      -amount,
        description,
        balanceAfter: newBalance,
      },
    }),
    ...(vendor && vendorCostUSD !== undefined
      ? [db.vendorUsageLog.create({
          data: { userId, vendor, operation: description, costUSD: vendorCostUSD, creditCost: amount },
        })]
      : []),
  ])
}
