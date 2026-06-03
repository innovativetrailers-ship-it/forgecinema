// Orchestrates the cognitive agents into a CreativeBrief — every step degrades
// safely. If everything degrades, enrichedPrompt falls back to the raw prompt and
// cognitionUsed is false, so orchestration runs exactly as it did before.

import { runAgent, noteAgentHealth } from './runtime'
import { intentAgent, type Intent } from './agents/intentAgent'
import { affectAgent, type EmotionalArc } from './agents/affectAgent'
import { ideationAgent, type CreativeDirection } from './agents/ideationAgent'
import { critiqueAgent } from './agents/critiqueAgent'
import { recallEpisodes, recordEpisode } from './memory/episodic'

export interface CreativeBrief {
  intent: Intent
  emotionalArc: EmotionalArc
  direction: CreativeDirection
  enrichedPrompt: string
  cognitionUsed: boolean // false if everything degraded — render uses raw prompt
}

export async function runCognitiveDirector(params: {
  userId: string
  prompt: string
  durationSec: number
  onProgress?: (detail: string) => void
}): Promise<CreativeBrief> {
  const { userId, prompt, durationSec, onProgress } = params
  let anyOk = false

  onProgress?.('Understanding intent...')
  const intentR = await runAgent({
    name: 'intent',
    timeoutMs: 25_000,
    run: () => intentAgent.execute({ userId, prompt }),
    fallback: intentAgent.fallback({ userId, prompt }),
  })
  noteAgentHealth('intent', intentR.ok)
  anyOk ||= intentR.ok
  const intent = intentR.value

  onProgress?.('Recalling past work...')
  let pastWins: string[] = []
  try {
    const eps = await recallEpisodes(userId, intent.inferredGoal || prompt, 5)
    pastWins = eps.filter(e => (e.outcome?.qualityScore ?? 0) > 0.7).map(e => e.summary)
  } catch (e) {
    console.warn('[cognition:recall] degraded:', e instanceof Error ? e.message : String(e))
  }

  onProgress?.('Composing emotional rhythm...')
  const arcR = await runAgent({
    name: 'affect',
    timeoutMs: 25_000,
    run: () => affectAgent.execute({ intent, durationSec }),
    fallback: affectAgent.fallback({ intent, durationSec }),
  })
  noteAgentHealth('affect', arcR.ok)
  anyOk ||= arcR.ok
  const emotionalArc = arcR.value

  onProgress?.('Imagining captivating scenes...')
  const ideaR = await runAgent({
    name: 'ideation',
    timeoutMs: 35_000,
    run: () => ideationAgent.execute({ intent, arc: emotionalArc, pastWins }),
    fallback: ideationAgent.fallback({ intent, arc: emotionalArc, pastWins }),
  })
  noteAgentHealth('ideation', ideaR.ok)
  anyOk ||= ideaR.ok
  let direction = ideaR.value

  if (ideaR.ok && direction.score < 0.85) {
    onProgress?.('Refining the vision...')
    const critR = await runAgent({
      name: 'critique',
      timeoutMs: 30_000,
      run: () => critiqueAgent.execute({ direction, arc: emotionalArc, intent: intent.inferredGoal }),
      fallback: direction,
    })
    noteAgentHealth('critique', critR.ok)
    direction = critR.value
  }

  const enrichedPrompt = anyOk
    ? [
        direction.concept || prompt,
        direction.visualStyle ? `Visual style: ${direction.visualStyle}.` : '',
        emotionalArc.shape ? `Emotional journey: ${emotionalArc.shape} — ${emotionalArc.rhythmNote ?? ''}.` : '',
        direction.scenes?.length ? `Scenes: ${direction.scenes.join(' / ')}.` : '',
        intent.targetEmotion ? `Evoke: ${intent.targetEmotion}.` : '',
      ].filter(Boolean).join(' ')
    : prompt // total degradation → raw prompt, render still proceeds

  recordEpisode({
    userId,
    kind: 'project',
    summary: `${intent.inferredGoal || prompt} — ${direction.concept || 'direct'}`,
    intent,
    brief: { emotionalArc, direction },
    importance: 0.6,
  }).catch(() => {})

  return { intent, emotionalArc, direction, enrichedPrompt, cognitionUsed: anyOk }
}
