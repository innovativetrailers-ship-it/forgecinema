import { orchestrate } from '@/lib/orchestration'
import { priceOrchestratePlan } from '@/lib/routing/estimatePlan'
import { quoteGenerationHold } from '@/lib/credits/quote'
import { requireUser } from '@/lib/auth/requireUser'

export async function POST(req: Request) {
  const userId = (await requireUser(req))?.id ?? null
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { prompt, duration, selectedModels, mode, tier } = await req.json() as {
    prompt?:         string
    duration?:       number
    selectedModels?: string[]
    mode?:           string
    tier?:           string
  }

  if (!prompt || !duration) {
    return Response.json({ error: 'prompt and duration required' }, { status: 400 })
  }

  if (mode === 'director' && selectedModels && selectedModels.length > 0) {
    const planned = await orchestrate({
      prompt,
      totalDuration: duration,
      selectedModels,
      userId,
      planOnly: true,
      generationMode: 'draft',
    })
    return Response.json(priceOrchestratePlan(planned))
  }

  const quote = quoteGenerationHold({ tier: tier ?? 'standard', durationSeconds: duration })
  const engine = quote.model
  const cost   = quote.credits
  return Response.json({
    totalCredits:   cost,
    totalDuration:  quote.billedDurationSeconds,
    segments:       [{ assignedModel: engine, duration, creditCost: cost }],
    modelBreakdown: { [engine]: { duration, cost } },
  })
}
