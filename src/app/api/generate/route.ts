import { orchestrateMultiModelGeneration }                from '@/lib/routing/MediaRouter'
import { calculateSimpleCost, deductCredits }             from '@/lib/credits'
import { TIER_ENGINE_MAP }                                from '@/lib/routing/engineRegistry'
import { db }                                             from '@/lib/db'
import { renderQueue }                                    from '@/lib/queue'
import { checkAccess, checkTierAccess, checkDirectorModelLimit } from '@/lib/access/guard'

export async function POST(req: Request) {
  const userId = req.headers.get('x-user-id')
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const {
    prompt,
    duration       = 10,
    selectedModels = [],
    mode           = 'simple',
    tier           = 'standard',
    imageUrl,
  } = await req.json() as {
    prompt?:         string
    duration?:       number
    selectedModels?: string[]
    mode?:           string
    tier?:           string
    imageUrl?:       string
  }

  if (!prompt) return Response.json({ error: 'prompt required' }, { status: 400 })

  try {
    // 1. Quality tier access check (simple mode)
    if (mode === 'simple' && tier !== 'draft') {
      const tierAccess = await checkTierAccess(userId, `quality_${tier}`)
      if (!tierAccess.allowed) {
        return Response.json({
          error:        tierAccess.reason,
          requiredTier: tierAccess.requiredTier,
          upgradeUrl:   '/pricing',
        }, { status: 403 })
      }
    }

    // 2. Director mode access check
    if (mode === 'director') {
      const modeAccess = await checkTierAccess(userId, 'mode_director')
      if (!modeAccess.allowed) {
        return Response.json({
          error:        modeAccess.reason,
          requiredTier: modeAccess.requiredTier,
          upgradeUrl:   '/pricing',
        }, { status: 403 })
      }

      // 3. Director model count limit check
      if (selectedModels.length > 0) {
        const modelAccess = await checkDirectorModelLimit(userId, selectedModels.length)
        if (!modelAccess.allowed) {
          return Response.json({
            error:        modelAccess.reason,
            requiredTier: modelAccess.requiredTier,
            upgradeUrl:   '/pricing',
          }, { status: 403 })
        }
      }
    }

    // 4. Compute cost
    let creditCost: number
    let segments: Array<{ assignedModel: string; duration: number }>

    if (mode === 'director' && selectedModels.length > 0) {
      const plan = await orchestrateMultiModelGeneration(prompt, duration, selectedModels)
      creditCost = plan.totalCredits
      segments   = plan.segments
    } else {
      creditCost = calculateSimpleCost(tier, duration)
      segments   = [{ assignedModel: TIER_ENGINE_MAP[tier] ?? 'ltx-2.3-fast', duration }]
    }

    // 5. Credit balance check (ADMIN always passes)
    const access = await checkAccess(userId, creditCost)
    if (!access.allowed) {
      return Response.json({ error: access.reason }, { status: access.code })
    }

    await deductCredits(db, userId, creditCost, `Generate: ${prompt.slice(0, 60)}`)

    const jobIds: string[] = []
    for (const seg of segments) {
      const job = await renderQueue.add('render-segment', {
        userId,
        prompt,
        model:    seg.assignedModel,
        duration: seg.duration,
        imageUrl,
      })
      jobIds.push(String(job.id))
    }

    return Response.json({ queued: true, creditCost, segments, jobIds })

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[generate]', err)
    return Response.json({ error: msg }, { status: 500 })
  }
}
