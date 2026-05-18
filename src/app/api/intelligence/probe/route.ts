/**
 * Intelligence probe trigger API.
 * Runs the probe battery against one or more models.
 * Protected: requires CRON_SECRET or admin user.
 * POST { modelId, modelVersion?, probeCategories?, tier?, mode }
 */
import { NextRequest, NextResponse } from 'next/server'
import { ModelIntelligenceAnalyser } from '@/lib/intelligence/analyser'
import { PROBE_BATTERY, getProbeSets } from '@/lib/intelligence/probe-battery'
import type { OutcomeTier } from '@/lib/swarm/types'

const VALID_MODELS = [
  'veo_3_1', 'kling_3_0', 'seedance_2_0', 'runway_gen4_5',
  'wan_2_6', 'ltx_2_3', 'minimax_hailuo', 'skyreels_v1',
  'cogvideox_5b', 'mochi_1',
]

interface ProbeRequestBody {
  modelId: string
  modelVersion?: string
  probeCategories?: string[]    // subset of categories to run; omit for full battery
  tier?: OutcomeTier
  mode?: 'full' | 'fingerprint' | 'targeted'
}

export async function POST(req: NextRequest) {
  // Accept either CRON_SECRET (worker trigger) or x-user-id (admin UI)
  const cronSecret = req.headers.get('authorization')
  const userId = req.headers.get('x-user-id')

  const isWorker = cronSecret === `Bearer ${process.env.CRON_SECRET}`
  if (!isWorker && !userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: ProbeRequestBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { modelId, modelVersion = '0.0.0', probeCategories, tier = 'Studio', mode = 'full' } = body

  if (!modelId) return NextResponse.json({ error: 'modelId is required' }, { status: 400 })
  if (!VALID_MODELS.includes(modelId)) {
    return NextResponse.json({ error: `Unknown model: ${modelId}. Valid: ${VALID_MODELS.join(', ')}` }, { status: 400 })
  }

  // Select probe set
  const probeSet = probeCategories?.length
    ? getProbeSets(probeCategories)
    : mode === 'fingerprint'
    ? getProbeSets(['efficiency', 'consistency'])
    : PROBE_BATTERY

  const analyser = new ModelIntelligenceAnalyser()

  try {
    console.log(`[Intelligence API] Starting ${mode} probe: ${modelId} v${modelVersion}, ${probeSet.length} category sets`)
    const results = await analyser.probeModel({ modelId, modelVersion, probeSet, tier })
    const report = await analyser.writeAnalysisReport(modelId, results)

    return NextResponse.json({
      ok: true,
      modelId,
      modelVersion,
      probesRun: results.length,
      categories: [...new Set(results.map(r => r.category))],
      summary: {
        avgQuality: results.length > 0
          ? +(results.reduce((s, r) => s + r.assessment.quality_score, 0) / results.length).toFixed(2)
          : 0,
        highQuality: results.filter(r => r.assessment.quality_score >= 8).length,
        failures: results.filter(r => r.assessment.quality_score <= 4).length,
        optimalSceneTypes: report.optimal_scene_types,
        avoidSceneTypes: report.avoid_scene_types,
      },
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Probe run failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// GET — list valid models and probe categories
export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  return NextResponse.json({
    validModels: VALID_MODELS,
    categories: PROBE_BATTERY.map(s => ({ category: s.category, probeCount: s.probes.length })),
    tiers: ['Draft', 'Studio', 'Blockbuster'],
    modes: ['full', 'fingerprint', 'targeted'],
  })
}
