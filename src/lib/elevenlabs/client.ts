// Central ElevenLabs SDK gateway — all audio generation routes through here.

import { ElevenLabsClient, ElevenLabsError } from '@elevenlabs/elevenlabs-js'

export class ElevenLabsServiceError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ElevenLabsServiceError'
  }
}

export function getElevenLabsClient(): ElevenLabsClient {
  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey) throw new ElevenLabsServiceError('ELEVENLABS_API_KEY not configured')
  return new ElevenLabsClient({ apiKey })
}

export async function streamToBuffer(stream: ReadableStream<Uint8Array>): Promise<Buffer> {
  const chunks: Buffer[] = []
  const reader = stream.getReader()
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      if (value?.byteLength) chunks.push(Buffer.from(value))
    }
  } finally {
    reader.releaseLock()
  }
  return Buffer.concat(chunks)
}

function wrapSdkError(err: unknown, fallback: string): never {
  if (err instanceof ElevenLabsError || err instanceof ElevenLabsServiceError) {
    throw new ElevenLabsServiceError(err.message || fallback)
  }
  if (err instanceof Error) throw new ElevenLabsServiceError(err.message || fallback)
  throw new ElevenLabsServiceError(fallback)
}

export interface VoiceSynthOptions {
  modelId?: string
  stability?: number
  similarityBoost?: number
  style?: number
  speakerBoost?: boolean
  speed?: number
  outputFormat?: 'mp3_44100_128' | 'mp3_44100_192'
}

export async function generateVoiceBuffer(
  text: string,
  voiceId: string,
  options?: VoiceSynthOptions,
): Promise<Buffer> {
  try {
    const client = getElevenLabsClient()
    const stream = await client.textToSpeech.convert(voiceId, {
      text,
      modelId: options?.modelId ?? process.env.ELEVENLABS_MODEL_ID ?? 'eleven_multilingual_v2',
      voiceSettings: {
        stability: options?.stability ?? 0.5,
        similarityBoost: options?.similarityBoost ?? 0.75,
        style: options?.style ?? 0,
        useSpeakerBoost: options?.speakerBoost ?? true,
        ...(options?.speed !== undefined ? { speed: options.speed } : {}),
      },
      outputFormat: options?.outputFormat ?? 'mp3_44100_128',
    })
    return await streamToBuffer(stream)
  } catch (err) {
    wrapSdkError(err, 'Voice synthesis failed')
  }
}

export async function cloneVoiceFromBuffers(
  name: string,
  files: Buffer[],
  description?: string,
): Promise<string> {
  if (files.length === 0) throw new ElevenLabsServiceError('No reference audio provided')
  try {
    const client = getElevenLabsClient()
    const response = await client.voices.ivc.create({
      name,
      description: description ?? '',
      files: files.map((buf) => new Blob([new Uint8Array(buf)], { type: 'audio/mpeg' })),
    })
    if (!response.voiceId) throw new ElevenLabsServiceError('Voice cloning returned no voice id')
    return response.voiceId
  } catch (err) {
    wrapSdkError(err, 'Voice cloning failed')
  }
}

export async function convertSpeechBuffer(
  audioBuffer: Buffer,
  targetVoiceId: string,
  options?: { modelId?: string; stability?: number },
): Promise<Buffer> {
  try {
    const client = getElevenLabsClient()
    const stream = await client.speechToSpeech.convert(targetVoiceId, {
      audio: new Blob([new Uint8Array(audioBuffer)], { type: 'audio/mpeg' }),
      modelId: options?.modelId ?? 'eleven_english_sts_v2',
      voiceSettings: JSON.stringify({
        stability: options?.stability ?? 0.5,
        similarity_boost: 0.75,
      }),
    })
    return await streamToBuffer(stream)
  } catch (err) {
    wrapSdkError(err, 'Speech-to-speech conversion failed')
  }
}

export async function generateSoundEffectBuffer(
  description: string,
  durationSeconds: number,
  promptInfluence = 0.3,
): Promise<Buffer> {
  try {
    const client = getElevenLabsClient()
    const stream = await client.textToSoundEffects.convert({
      text: description,
      durationSeconds: Math.min(30, Math.max(0.5, durationSeconds)),
      promptInfluence,
      outputFormat: 'mp3_44100_128',
    })
    return await streamToBuffer(stream)
  } catch (err) {
    wrapSdkError(err, 'SFX generation failed')
  }
}

export async function listVoicesSdk(): Promise<
  Array<{ voiceId: string; name: string; previewUrl?: string }>
> {
  try {
    const client = getElevenLabsClient()
    const response = await client.voices.getAll()
    return (response.voices ?? []).map((v) => ({
      voiceId: v.voiceId ?? '',
      name: v.name ?? '',
      previewUrl: v.previewUrl,
    }))
  } catch (err) {
    wrapSdkError(err, 'Failed to list voices')
  }
}
