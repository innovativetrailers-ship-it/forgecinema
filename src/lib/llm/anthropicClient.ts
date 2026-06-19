import type Anthropic from '@anthropic-ai/sdk'
import { GenerationPausedError, isGenerationPaused } from '@/lib/generation/pause'

export type ClaudeBillableClass = 'interactive' | 'eval' | 'background'

export class AnthropicCallRefusedError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AnthropicCallRefusedError'
  }
}

function assertCallerSource(source: string | undefined): asserts source is string {
  const s = source?.trim()
  if (!s || s === 'UNKNOWN') {
    throw new AnthropicCallRefusedError('Anthropic call with no caller source — refusing')
  }
}

/** Single chokepoint for all Anthropic messages.create calls. */
export async function claudeCall(
  client: Anthropic,
  params: Anthropic.MessageCreateParamsNonStreaming,
  ctx: { source: string; billableClass?: ClaudeBillableClass },
): Promise<Anthropic.Message> {
  assertCallerSource(ctx.source)
  const billableClass = ctx.billableClass ?? 'background'

  if (isGenerationPaused() && billableClass !== 'interactive') {
    throw new GenerationPausedError(`Blocked Anthropic: ${ctx.source}`)
  }

  if (billableClass === 'eval') {
    const { intelligenceProbesEnabled } = await import('@/lib/intelligence/guards')
    if (!intelligenceProbesEnabled()) {
      throw new AnthropicCallRefusedError(`Eval Anthropic blocked: ${ctx.source}`)
    }
  }

  const tokensInEstimate = Math.round(JSON.stringify(params.messages ?? []).length / 4)
  console.log('[anthropic_call]', JSON.stringify({
    source: ctx.source,
    model: params.model,
    billableClass,
    tokensInEstimate,
  }))

  return client.messages.create(params)
}
