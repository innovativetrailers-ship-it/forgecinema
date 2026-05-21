import OpenAI from 'openai'

let client: OpenAI | undefined

/** Lazy OpenRouter client — avoids throwing during Next.js build when env vars are unset. */
export const getOpenRouterClient = (): OpenAI => {
  if (!client) {
    client = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey:
        process.env.OPENROUTER_API_KEY ??
        process.env.OPENAI_API_KEY ??
        'sk-build-placeholder',
    })
  }
  return client
}
