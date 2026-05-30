import { type NextRequest, NextResponse } from 'next/server'
import { generateMusic } from '@/lib/engines/suno'
import { uploadToR2 } from '@/lib/storage/r2'
import { deductCredits, refundCredits, OPERATION_COSTS } from '@/lib/credits'
import { db } from '@/lib/db'

export async function POST(req: NextRequest): Promise<NextResponse> {
  const userId = req.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: {
    prompt?:       string
    style?:        string
    duration?:     number
    instrumental?: boolean
    title?:        string
  }
  try {
    body = (await req.json()) as typeof body
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { prompt, style, duration, instrumental, title } = body
  if (!prompt?.trim()) return NextResponse.json({ error: 'prompt is required' }, { status: 400 })

  const durationSecs = duration ?? 60
  const cost = Math.ceil(durationSecs / 30) * (OPERATION_COSTS['suno_music_per_30s'] ?? 5)

  try {
    await deductCredits(db, userId, cost, `Music: ${prompt.slice(0, 40)}`)
  } catch {
    return NextResponse.json(
      { error: `Insufficient credits. Music generation costs ${cost} credits.` },
      { status: 402 },
    )
  }

  try {
    const result = await generateMusic({
      prompt: prompt.trim(),
      style,
      duration: durationSecs,
      instrumental,
      title,
    })

    const buffer = await fetch(result.audioUrl).then((r) => r.arrayBuffer())
    const audioUrl = await uploadToR2(
      Buffer.from(buffer),
      `music/${userId}/${Date.now()}.mp3`,
      'audio/mpeg',
    )

    return NextResponse.json({ audioUrl, cost, jobId: result.jobId })
  } catch (err: unknown) {
    await refundCredits(userId, cost, 'Music generation failed')
    const message = err instanceof Error ? err.message : 'Music generation failed'
    console.error('[api/audio/music]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
