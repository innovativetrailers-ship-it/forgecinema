import { runFal } from './client'

export interface FaceEmbedding {
  embedding: number[]
  boundingBox?: { x: number; y: number; width: number; height: number }
}

export async function extractFaceEmbedding(imageUrl: string): Promise<FaceEmbedding> {
  interface FaceIdResult {
    embedding?: number[]
    face_embedding?: number[]
    bbox?: { x: number; y: number; width: number; height: number }
  }

  try {
    const result = await runFal<FaceIdResult>('fal-ai/ip-adapter-face-id', {
      prompt: 'portrait photograph, neutral expression, studio lighting',
      face_image_url: imageUrl,
      num_samples: 1,
    })

    return {
      embedding: result.embedding ?? result.face_embedding ?? [],
      boundingBox: result.bbox,
    }
  } catch {
    return { embedding: [] }
  }
}

export async function restoreFaceCharacter(imageUrl: string): Promise<string> {
  interface CodeformerResult {
    image?: { url: string }
    images?: Array<{ url: string }>
  }

  const result = await runFal<CodeformerResult>('fal-ai/codeformer', {
    image_url: imageUrl,
    fidelity: 0.7,
  })

  return result.image?.url ?? result.images?.[0]?.url ?? imageUrl
}

export interface IPAdapterPayload {
  ip_adapter_image_url?: string
  ip_adapter_scale?: number
  lora_url?: string
  lora_scale?: number
}

export function buildIPAdapterPayload(
  referenceUrls: string[],
  loraId?: string
): IPAdapterPayload {
  const payload: IPAdapterPayload = {}

  if (referenceUrls.length > 0) {
    payload.ip_adapter_image_url = referenceUrls[0]
    payload.ip_adapter_scale = 0.7
  }

  if (loraId) {
    payload.lora_url = loraId
    payload.lora_scale = 0.85
  }

  return payload
}

export async function extractCharacterFeatures(imageUrls: string[]): Promise<{
  faceEmbedding: number[]
  dominantColors: string[]
  hairColor: string
  skinTone: string
}> {
  try {
    const { default: Anthropic } = await import('@anthropic-ai/sdk')
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'url', url: imageUrls[0] },
            },
            {
              type: 'text',
              text: 'Describe this person\'s physical appearance for video generation: hair color, skin tone, eye color, age range, distinctive features. Reply as JSON: {"hairColor": "", "skinTone": "", "eyeColor": "", "ageRange": "", "features": []}',
            },
          ],
        },
      ],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
    const parsed = JSON.parse(text) as { hairColor?: string; skinTone?: string }

    return {
      faceEmbedding: [],
      dominantColors: [],
      hairColor: parsed.hairColor ?? 'unknown',
      skinTone: parsed.skinTone ?? 'unknown',
    }
  } catch {
    return { faceEmbedding: [], dominantColors: [], hairColor: 'unknown', skinTone: 'unknown' }
  }
}
