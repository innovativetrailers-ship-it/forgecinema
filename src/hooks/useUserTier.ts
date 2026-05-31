import { useQuery } from '@tanstack/react-query'
import {
  getUserTier,
  TIER_PERMISSIONS,
  getRequiredUpgrade,
  type SubscriptionTier,
} from '@/lib/access/tiers'

interface BalanceResponse {
  isAdmin?:            boolean
  subscriptionStatus?: string | null
  credits?:            number
}

export function useUserTier() {
  const { data } = useQuery<BalanceResponse>({
    queryKey:  ['credits', 'balance'],
    queryFn:   () => fetch('/api/credits/balance', { credentials: 'include' }).then(r => r.json()),
    staleTime: 60_000,
  })

  const isAdmin = data?.isAdmin ?? false
  const tier    = (isAdmin ? 'admin' : getUserTier(data?.subscriptionStatus ?? null, 'USER')) as SubscriptionTier
  const perms   = TIER_PERMISSIONS[tier]

  const canUse = (featureKey: string): boolean =>
    isAdmin || !getRequiredUpgrade(tier, featureKey)

  return { tier, isAdmin, perms, canUse }
}
