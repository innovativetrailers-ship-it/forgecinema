import { cloneVoice }                                from '@/lib/engines/elevenLabs'
import { deductCredits, OPERATION_COSTS }            from '@/lib/credits'
import { db }                                        from '@/lib/db'
import { checkAccess, checkTierAccess }              from '@/lib/access/guard'

export async function POST(req: Request) {
  const userId = req.headers.get('x-user-id')
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, description, audioUrls } = await req.json() as {
    name:        string
    description: string
    audioUrls:   string[]
  }

  // Tier check — voice cloning requires Studio or above
  const tierAccess = await checkTierAccess(userId, 'voice_clone')
  if (!tierAccess.allowed) {
    return Response.json({
      error:        tierAccess.reason,
      requiredTier: tierAccess.requiredTier,
      upgradeUrl:   '/pricing',
    }, { status: 403 })
  }

  const cost = OPERATION_COSTS['elevenlabs_clone_voice']
  const access = await checkAccess(userId, cost)
  if (!access.allowed) return Response.json({ error: access.reason }, { status: access.code })

  await deductCredits(db, userId, cost, `Clone voice: ${name}`)
  const { voiceId } = await cloneVoice({ name, description, audioUrls })
  await db.clonedVoice.create({ data: { userId, voiceId, name, description } })
  return Response.json({ voiceId })
}
