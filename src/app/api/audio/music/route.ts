import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { generateMusic } from '@/lib/audio/suno'
import { checkAndDeductCredits } from '@/lib/credits'

const schema = z.object({
  prompt: z.string().min(3),
  durationSeconds: z.number().min(10).max(240).default(30),
  instrumental: z.boolean().optional().default(true),
})

export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { prompt, durationSeconds, instrumental } = parsed.data
  const operation = durationSeconds <= 30 ? 'music_generate_30s' : 'music_generate_120s'

  try {
    await checkAndDeductCredits(userId, operation)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 402 })
  }

  const result = await generateMusic({ prompt, durationSeconds, instrumental })
  return NextResponse.json(result)
}
