import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { checkAndDeductCredits, refundCredits } from '@/lib/credits'
import { ReferenceVideoAnalyser } from '@/lib/analysis/ReferenceVideoAnalyser'

const analyser = new ReferenceVideoAnalyser()

export async function POST(req: NextRequest) {
  const session = await auth()
  const userId = req.headers.get('x-user-id') ?? session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as {
    videoUrl: string
    analysisDepth?: 'quick' | 'standard' | 'deep'
    generateScript?: boolean
    newConcept?: string
    format?: 'feature_film' | 'short_film' | 'episode' | 'social'
    targetRuntime?: number
  }

  if (!body.videoUrl) {
    return NextResponse.json({ error: 'videoUrl is required' }, { status: 400 })
  }

  const depth = body.analysisDepth ?? 'standard'
  const analysisCreditKey = depth === 'quick' ? 'reference_quick_analysis' : 'reference_deep_analysis'

  const ok = await checkAndDeductCredits(userId, analysisCreditKey)
  if (!ok) return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 })

  try {
    const styleDNA = await analyser.analyseReference({
      videoUrl: body.videoUrl,
      analysisDepth: depth,
      extractScriptElements: body.generateScript,
    })

    let script: string | undefined

    if (body.generateScript && body.newConcept) {
      const scriptOk = await checkAndDeductCredits(userId, 'reference_script_generate')
      if (scriptOk) {
        script = await analyser.generateScriptFromReference({
          referenceVideoUrl: body.videoUrl,
          newConcept: body.newConcept,
          format: body.format ?? 'short_film',
          targetRuntime: body.targetRuntime ?? 5,
        })
      }
    }

    return NextResponse.json({ styleDNA, ...(script ? { script } : {}) })
  } catch (err) {
    await refundCredits(userId, analysisCreditKey)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Analysis failed' }, { status: 500 })
  }
}
