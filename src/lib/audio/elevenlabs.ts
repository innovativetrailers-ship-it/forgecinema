import { uploadToR2 } from '../storage/r2'
import { nanoid } from 'nanoid'

const ELEVEN_API = 'https://api.elevenlabs.io/v1'

async function elevenRequest(
  method: string,
  path: string,
  body?: unknown,
  raw?: boolean
): Promise<Response | unknown> {
  const res = await fetch(`${ELEVEN_API}${path}`, {
    method,
    headers: {
      'xi-api-key': process.env.ELEVENLABS_API_KEY ?? '',
      ...(body && !raw ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`ElevenLabs API error ${res.status}: ${err}`)
  }

  if (raw) return res
  return res.json()
}

export async function synthesiseSpeech(params: {
  text: string
  voiceId: string
  emotion?: 'neutral' | 'excited' | 'sad' | 'angry' | 'whispering'
  stability?: number
  similarityBoost?: number
}): Promise<{ audioUrl: string }> {
  const response = await elevenRequest(
    'POST',
    `/text-to-speech/${params.voiceId}`,
    {
      text: params.text,
      model_id: 'eleven_turbo_v2_5',
      voice_settings: {
        stability: params.stability ?? 0.5,
        similarity_boost: params.similarityBoost ?? 0.75,
        style: 0,
        use_speaker_boost: true,
      },
    },
    true
  ) as Response

  const audioBuffer = await response.arrayBuffer()
  const key = `audio/speech/${nanoid()}.mp3`
  const audioUrl = await uploadToR2(Buffer.from(audioBuffer), key, 'audio/mpeg')

  return { audioUrl }
}

export async function cloneVoice(params: {
  name: string
  audioSamples: string[]
}): Promise<{ voiceId: string }> {
  // Fetch sample audio files and build FormData
  const formData = new FormData()
  formData.append('name', params.name)
  formData.append('description', `Cloned voice for CINÉMA character: ${params.name}`)

  for (const sampleUrl of params.audioSamples.slice(0, 5)) {
    const res = await fetch(sampleUrl)
    const buffer = await res.arrayBuffer()
    const blob = new Blob([buffer], { type: 'audio/mpeg' })
    formData.append('files', blob, `sample_${nanoid()}.mp3`)
  }

  interface VoiceResponse {
    voice_id: string
  }

  const data = await elevenRequest('POST', '/voices/add', formData) as VoiceResponse

  return { voiceId: data.voice_id }
}

export async function listVoices(): Promise<Array<{ voiceId: string; name: string; previewUrl: string }>> {
  interface VoicesResponse {
    voices: Array<{ voice_id: string; name: string; preview_url: string }>
  }

  const data = await elevenRequest('GET', '/voices') as VoicesResponse

  return data.voices.map((v) => ({
    voiceId: v.voice_id,
    name: v.name,
    previewUrl: v.preview_url,
  }))
}
