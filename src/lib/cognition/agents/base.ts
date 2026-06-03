// Shared Claude caller for all cognitive agents — one place to tune model + parsing.
// Routes through the project's callLLM helper (Anthropic SDK) rather than a bespoke
// fetch, so credits/keys/model-ids stay consistent with the rest of the app.

import { callLLM } from '@/lib/engines/llm'
import { parseLLMJson } from '../json'

export async function callAgentLLM(params: {
  system: string
  user: string
  maxTokens?: number
  fast?: boolean // use Haiku for cheap/quick agents
}): Promise<string> {
  const { content } = await callLLM({
    model: params.fast ? 'claude-haiku' : 'claude-sonnet',
    maxTokens: params.maxTokens ?? 800,
    system: params.system,
    messages: [{ role: 'user', content: params.user }],
  })
  return content
}

// Safe JSON parse for agent outputs (strips markdown fences, tolerates prose).
export const parseAgentJSON = parseLLMJson

export interface CognitiveAgent<Input, Output> {
  name: string
  fallback: (input: Input) => Output
  execute: (input: Input) => Promise<Output>
}
