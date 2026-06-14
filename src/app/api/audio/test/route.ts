import { NextRequest, NextResponse } from 'next/server'
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js'

export async function GET(req: NextRequest) {
  const key = req.headers.get('x-elevenlabs-key') ?? process.env.ELEVENLABS_API_KEY
  if (!key) return NextResponse.json({ ok: false, reason: 'no key' }, { status: 401 })
  try {
    const client = new ElevenLabsClient({ apiKey: key })
    await client.voices.getAll()
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false, reason: 'invalid key' }, { status: 401 })
  }
}
