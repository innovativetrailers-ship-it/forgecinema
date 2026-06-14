import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { TIER_PERMISSIONS, resolveSubscriptionTier } from '@/lib/access/tiers'
import {
  type DesktopPlatform,
  resolveReleaseAsset,
  keyFromReleaseUrl,
} from '@/lib/desktop/releases'
import { releaseObjectExists, getSignedReleaseUrl, releaseObjectKey } from '@/lib/storage/releasesR2'

const PLATFORMS: DesktopPlatform[] = ['mac_arm', 'mac_intel', 'windows']

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const session = await auth()
  const userId = request.headers.get('x-user-id') ?? session?.user?.id
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { role: true, subscriptionTier: true, subscriptionStatus: true },
  })
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const tier = user.role === 'ADMIN'
    ? 'admin'
    : resolveSubscriptionTier(user.subscriptionTier, user.subscriptionStatus, 'USER')

  if (!TIER_PERMISSIONS[tier].download) {
    return NextResponse.json(
      { error: 'Forge Extreme download requires Ultimate subscription or Dev Account' },
      { status: 403 },
    )
  }

  const platform = request.nextUrl.searchParams.get('platform') as DesktopPlatform | null
  if (!platform || !PLATFORMS.includes(platform)) {
    return NextResponse.json({ error: 'Invalid platform' }, { status: 400 })
  }

  const asset = await resolveReleaseAsset(platform)
  if (!asset) {
    return NextResponse.json(
      {
        error: 'Installer not available',
        hint: 'Publish v3 installers to R2 and connect releases.forgecinema.app, or set NEXT_PUBLIC_DESKTOP_RELEASES_URL.',
      },
      { status: 404 },
    )
  }

  const key = releaseObjectKey(keyFromReleaseUrl(asset.publicUrl))
  if (await releaseObjectExists(key)) {
    const signed = await getSignedReleaseUrl(key, 3600)
    return NextResponse.redirect(signed, 302)
  }

  return NextResponse.redirect(asset.publicUrl, 302)
}
