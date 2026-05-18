import OpenAI from 'openai'

const client = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
})

export interface Model1Input {
  systemPrompt: string
  userMessage: string
  requireJSON?: boolean
  useAgenticLoop?: boolean
  images?: string[]  // base64 or URL strings for vision
}

export interface Model1Output {
  content: string
  inputTokens: number
  outputTokens: number
}

export async function runModel1(input: Model1Input): Promise<Model1Output> {
  const userContent: OpenAI.Chat.ChatCompletionContentPart[] = []

  if (input.images?.length) {
    for (const img of input.images) {
      if (img.startsWith('http')) {
        userContent.push({
          type: 'image_url',
          image_url: { url: img },
        })
      } else {
        userContent.push({
          type: 'image_url',
          image_url: { url: `data:image/jpeg;base64,${img}` },
        })
      }
    }
  }

  userContent.push({ type: 'text', text: input.userMessage })

  const msg = await client.chat.completions.create({
    model: 'groq/llama-3.3-70b-versatile',
    max_tokens: input.requireJSON ? 4096 : 2048,
    messages: [
      { role: 'system', content: input.systemPrompt },
      { role: 'user', content: userContent }
    ],
  })

  const text = msg.choices[0]?.message?.content ?? ''

  // Strip markdown code fences if the caller expects raw JSON
  const content = input.requireJSON ? stripJSONFences(text) : text

  return {
    content,
    inputTokens: msg.usage?.prompt_tokens ?? 0,
    outputTokens: msg.usage?.completion_tokens ?? 0,
  }
}

function stripJSONFences(raw: string): string {
  return raw.replace(/^```(?:json)?\s*/m, '').replace(/\s*```\s*$/m, '').trim()
}
