import {
  cloneVoiceFromBuffers,
  convertSpeechBuffer,
  generateSoundEffectBuffer,
  generateVoiceBuffer,
  listVoicesSdk,
} from '@/lib/elevenlabs/client'

export async function synthesiseVoice(params: {
  text: string
  voiceId?: string
  modelId?: string
  stability?: number
  similarity?: number
  style?: number
  speakerBoost?: boolean
}): Promise<Buffer> {
  const voiceId = params.voiceId ?? process.env.ELEVENLABS_DEFAULT_VOICE_ID!
  return generateVoiceBuffer(params.text, voiceId, {
    modelId: params.modelId,
    stability: params.stability,
    similarityBoost: params.similarity,
    style: params.style,
    speakerBoost: params.speakerBoost,
  })
}

export async function cloneVoice(params: {
  name: string
  description: string
  audioUrls: string[]
}): Promise<{ voiceId: string }> {
  const files: Buffer[] = []
  for (const url of params.audioUrls) {
    const buf = await fetch(url).then((r) => r.arrayBuffer())
    files.push(Buffer.from(buf))
  }
  const voiceId = await cloneVoiceFromBuffers(params.name, files, params.description)
  return { voiceId }
}

export async function speechToSpeech(params: {
  audioBuffer: Buffer
  voiceId: string
  modelId?: string
}): Promise<Buffer> {
  return convertSpeechBuffer(params.audioBuffer, params.voiceId, { modelId: params.modelId })
}

export async function generateSFX(params: {
  text: string
  durationSeconds: number
}): Promise<Buffer> {
  return generateSoundEffectBuffer(params.text, params.durationSeconds)
}

export async function listVoices(): Promise<unknown[]> {
  return listVoicesSdk()
}
