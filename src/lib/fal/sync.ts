import { fal } from './client'

export interface LipSyncInput {
  videoUrl: string
  audioUrl?: string
  text?: string
  voiceId?: string
}

export async function lipSync(input: LipSyncInput): Promise<string> {
  interface SadTalkerResult {
    video?: { url: string }
  }

  if (!input.audioUrl && !input.text) {
    throw new Error('LipSync requires either audioUrl or text')
  }

  // fal-ai/sadtalker requires both fields; use a safe cast
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (fal.run as (id: string, opts: { input: Record<string, any> }) => Promise<unknown>)(
    'fal-ai/sadtalker',
    {
      input: {
        source_image_url: input.videoUrl,
        driven_audio_url: input.audioUrl ?? '',
      },
    }
  ) as SadTalkerResult

  return result.video?.url ?? input.videoUrl
}

export async function transcribeAudio(audioUrl: string): Promise<{
  text: string
  segments: Array<{ start: number; end: number; text: string }>
}> {
  interface WhisperResult {
    text?: string
    chunks?: Array<{ timestamp: [number, number]; text: string }>
  }

  const result = await fal.run('fal-ai/whisper', {
    input: {
      audio_url: audioUrl,
      task: 'transcribe',
      chunk_level: 'segment',
    },
  }) as WhisperResult

  return {
    text: result.text ?? '',
    segments: (result.chunks ?? []).map((c) => ({
      start: c.timestamp[0],
      end: c.timestamp[1],
      text: c.text,
    })),
  }
}
