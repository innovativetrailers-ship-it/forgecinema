import { synthesiseVoice }                from '@/lib/engines/elevenLabs'
import { uploadToR2 }                     from '@/lib/storage/r2'
import { deductCredits, OPERATION_COSTS } from '@/lib/credits'
import { db }                             from '@/lib/db'
import { checkAccess }                    from '@/lib/access/guard'

export async function POST(req: Request) {
  const userId = req.headers.get('x-user-id')
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { text, voiceId, stability, similarity } = await req.json() as {
    text:        string
    voiceId?:    string
    stability?:  number
    similarity?: number
  }

  const cost = Math.max(1, Math.ceil(text.length / 100)) * OPERATION_COSTS['elevenlabs_tts_per_100_chars']

  const access = await checkAccess(userId, cost)
  if (!access.allowed) return Response.json({ error: access.reason }, { status: access.code })

  await deductCredits(db, userId, cost, `TTS: ${text.slice(0, 40)}`)

  const buf = await synthesiseVoice({ text, voiceId, stability, similarity })
  const url = await uploadToR2(buf, `audio/${userId}/${Date.now()}.mp3`, 'audio/mpeg')
  return Response.json({ audioUrl: url, cost })
}
