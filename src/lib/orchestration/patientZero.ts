// src/lib/orchestration/patientZero.ts
// Pre-generate character and location reference images BEFORE any video.
// These become the consistent visual anchor for all downstream generations.

import { runFal, extractImageUrl } from '@/lib/fal/client'
import { uploadToR2 } from '@/lib/storage/r2'
import type { PatientZeroAssets } from './types'

interface PatientZeroInput {
  characters: Array<{ name: string; description: string }>
  locations:  Array<{ name: string; description: string }>
}

export async function generatePatientZeroAssets(
  input: PatientZeroInput
): Promise<PatientZeroAssets> {

  const characters = await Promise.all(input.characters.map(async char => {
    const res = await runFal('fal-ai/gemini-pro-image', {
      prompt: `Ultra-detailed character reference sheet for film production.
Character: ${char.name}. ${char.description}.
Show: front view, 3/4 view, close-up face.
Photorealistic, consistent lighting, white background.
Film production reference quality. 8K resolution.`,
    })

    const rawUrl = extractImageUrl(res)
    if (!rawUrl) throw new Error(`Patient Zero character image failed for ${char.name}`)
    const buf    = await fetch(rawUrl).then(r => r.arrayBuffer())
    const r2Url  = await uploadToR2(
      Buffer.from(buf),
      `patient-zero/characters/${char.name.replace(/\s/g, '_')}_${Date.now()}.jpg`,
      'image/jpeg'
    )

    return { name: char.name, imageUrl: r2Url, embedUrl: r2Url }
  }))

  const locations = await Promise.all(input.locations.map(async loc => {
    const res = await runFal('fal-ai/gemini-pro-image', {
      prompt: `Cinematic location plate for film production.
Location: ${loc.name}. ${loc.description}.
Wide establishing shot, photorealistic, dramatic lighting.
Film production reference quality.`,
    })

    const rawUrl = extractImageUrl(res)
    if (!rawUrl) throw new Error(`Patient Zero location image failed for ${loc.name}`)
    const buf    = await fetch(rawUrl).then(r => r.arrayBuffer())
    const r2Url  = await uploadToR2(
      Buffer.from(buf),
      `patient-zero/locations/${loc.name.replace(/\s/g, '_')}_${Date.now()}.jpg`,
      'image/jpeg'
    )

    return { name: loc.name, imageUrl: r2Url }
  }))

  return { characters, locations }
}

export async function extractNarrativeEntities(prompt: string): Promise<PatientZeroInput> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method:  'POST',
    headers: {
      'x-api-key':         process.env.ANTHROPIC_API_KEY!,
      'content-type':      'application/json',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model:      'claude-sonnet-4-20250514',
      max_tokens: 512,
      system:     'Extract characters and locations from a video prompt. Return ONLY valid JSON.',
      messages: [{
        role:    'user',
        content: `From this video prompt, extract named characters and distinct locations.
Prompt: "${prompt}"

Return JSON:
{
  "characters": [{ "name": "string", "description": "detailed physical description" }],
  "locations":  [{ "name": "string", "description": "detailed visual description" }]
}

If no named characters/locations, return empty arrays.`,
      }],
    }),
  }).then(r => r.json())

  try {
    return JSON.parse(res.content?.[0]?.text?.replace(/```json|```/g, '').trim() ?? '{}')
  } catch {
    return { characters: [], locations: [] }
  }
}
