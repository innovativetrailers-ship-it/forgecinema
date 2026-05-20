import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { checkAndDeductCredits, refundOperationCredits } from '@/lib/credits'
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

  try {
    await checkAndDeductCredits(userId, analysisCreditKey)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 402 })
  }

  try {
    const styleDNA = await analyser.analyseReference({
      videoUrl: body.videoUrl,
      analysisDepth: depth,
      extractScriptElements: body.generateScript,
    })

    let script: string | undefined

    if (body.generateScript && body.newConcept) {
      try {
        await checkAndDeductCredits(userId, 'reference_script_generate')
        script = await analyser.generateScriptFromReference({
          referenceVideoUrl: body.videoUrl,
          newConcept: body.newConcept,
          format: body.format ?? 'short_film',
          targetRuntime: body.targetRuntime ?? 5,
        })
      } catch {
        // Script generation skipped when credits insufficient
      }
    }

    return NextResponse.json({ styleDNA, ...(script ? { script } : {}) })
  } catch (err) {
    await refundOperationCredits(userId, analysisCreditKey)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Analysis failed' }, { status: 500 })
  }
}
