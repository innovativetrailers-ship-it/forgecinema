// V2 — photo ingestion for VaultCharacter (FAL calls identical to V3 desktop).

import { fal, runFal } from '@/lib/fal/client'
import { defaultAppearance, type CharacterAppearance } from './fccSchema'

const FACE_ID_ENDPOINT = 'fal-ai/face-id'
const INSTANT_ID_ENDPOINT = 'fal-ai/instant-id'

function extractEmbedding(data: unknown): number[] {
  if (!data || typeof data !== 'object') return []
  const d = data as Record<string, unknown>
  const emb = d.face_embedding ?? d.embedding
  if (Array.isArray(emb)) return emb.filter((n): n is number => typeof n === 'number')
  return []
}

async function analyseAppearanceWithClaude(imageUrl: string): Promise<CharacterAppearance> {
  if (!process.env.ANTHROPIC_API_KEY) return defaultAppearance()
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'content-type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 600,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image', source: { type: 'url', url: imageUrl } },
              {
                type: 'text',
                text: "Analyse appearance. Return JSON: skinTone, melanin, structuralAge, muscularityPct, bodyFatIndex, hairLength, wrinkleFreq. Only JSON.",
              },
            ],
          },
        ],
      }),
    })
    const json = (await res.json()) as { content?: Array<{ type: string; text?: string }> }
    const text = json.content?.find((c) => c.type === 'text')?.text ?? '{}'
    return { ...defaultAppearance(), ...JSON.parse(text.replace(/```json|```/g, '').trim()) }
  } catch {
    return defaultAppearance()
  }
}

export interface PhotoIngestResult {
  faceEmbedding: number[]
  bodyEmbedding: number[]
  appearance: CharacterAppearance
}

export async function ingestPhotoReferences(referenceUrls: string[]): Promise<PhotoIngestResult> {
  if (referenceUrls.length === 0) throw new Error('At least one reference image required')
  const primary = referenceUrls[0]

  let faceEmbedding: number[] = []
  try {
    const faceResult = await fal.subscribe(INSTANT_ID_ENDPOINT, {
      input: { face_image_url: primary, mode: 'embedding_only' },
    })
    faceEmbedding = extractEmbedding(faceResult.data)
  } catch {
    const fallback = await runFal(FACE_ID_ENDPOINT, { image_url: primary })
    faceEmbedding = extractEmbedding(fallback)
  }

  const appearance = await analyseAppearanceWithClaude(primary)
  let bodyEmbedding = faceEmbedding
  try {
    const bodyResult = (await runFal('fal-ai/ip-adapter-face-id', {
      face_image_url: primary,
      prompt: 'character reference',
    })) as unknown
    const emb = extractEmbedding(bodyResult)
    if (emb.length > 0) bodyEmbedding = emb
  } catch {
    // keep face embedding
  }

  return { faceEmbedding, bodyEmbedding, appearance }
}

function extractImageUrl(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null
  const d = data as Record<string, unknown>
  const images = d.images as Array<{ url?: string }> | undefined
  if (images?.[0]?.url) return images[0].url
  const image = d.image as { url?: string } | undefined
  if (image?.url) return image.url
  return null
}

/** Video URL → appearance + embeddings (uses middle frame as portrait proxy). */
export async function ingestVideoReference(videoUrl: string): Promise<PhotoIngestResult & { frameUrl: string }> {
  const frame = await fal.subscribe('fal-ai/ffmpeg-api/extract-frame', {
    input: { video_url: videoUrl, frame_type: 'middle' },
  })
  const frameUrl = extractImageUrl(frame.data) ?? videoUrl
  const ingested = await ingestPhotoReferences([frameUrl])
  return { ...ingested, frameUrl }
}

/** Sketch data URL + prompts → rendered portrait → photo ingest. */
export async function ingestSketchReference(
  sketchDataUrl: string,
  prompts: string[],
): Promise<PhotoIngestResult & { portraitUrl: string }> {
  const list = prompts.length > 0 ? prompts : ['photorealistic character portrait']
  let portraitUrl = sketchDataUrl
  try {
    const gen = await fal.subscribe('fal-ai/flux/dev', { input: { prompt: list[0] } })
    portraitUrl = extractImageUrl(gen.data) ?? sketchDataUrl
  } catch {
    portraitUrl = sketchDataUrl
  }
  for (let i = 1; i < list.length; i++) {
    try {
      const refined = await fal.subscribe('fal-ai/flux/dev', {
        input: { prompt: `${list[i]}, maintain exact same character` },
      })
      portraitUrl = extractImageUrl(refined.data) ?? portraitUrl
    } catch {
      // keep
    }
  }
  const ingested = await ingestPhotoReferences([portraitUrl])
  return { ...ingested, portraitUrl }
}
