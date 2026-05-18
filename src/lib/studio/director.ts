import OpenAI from 'openai'
import { nanoid } from 'nanoid'
import type { TimelineRecipe, Track, Clip } from '../timeline/schema'
import type { VaultCharacter, VaultLocation } from '@prisma/client'
import { routeToModel } from '../models/router'

const client = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
})

const DIRECTOR_SYSTEM_PROMPT = `You are the AI Director of CINÉMA — the world's most advanced AI film production platform.

Given a creative brief, available characters, and a target duration, you produce a complete film plan as a structured JSON timeline.

You know exactly what each AI model excels at:
- wan/animatediff: budget, fast, environment and abstract shots
- luma: smooth camera motion, aerial and landscape shots
- seedance: character consistency, dialogue scenes
- kling_standard: action, motion-heavy scenes  
- kling_pro: premium character shots with high consistency
- runway: multi-shot continuity, professional quality
- veo3: photorealistic scenes, physics-aware shots, top quality

Your timeline plan must:
1. Follow proper film grammar (establish scene → develop → climax → resolution)
2. Vary shot types for visual dynamism (wide, medium, close-up)
3. Select the optimal model for each shot's requirements
4. Ensure character continuity when the same character appears across shots
5. Specify precise prompts for each clip

Return ONLY valid JSON matching the TimelineRecipe schema.`

export async function runAIDirector(params: {
  brief: string
  availableCharacters: Pick<VaultCharacter, 'id' | 'name' | 'modelFamily'>[]
  availableLocations: Pick<VaultLocation, 'id' | 'name' | 'generativePrompt'>[]
  targetDuration: number
  style: string
}): Promise<TimelineRecipe> {
  const { brief, availableCharacters, availableLocations, targetDuration, style } = params

  const response = await client.chat.completions.create({
    model: 'anthropic/claude-3.5-sonnet',
    max_tokens: 8000,
    messages: [
      { role: 'system', content: DIRECTOR_SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Creative brief: ${brief}

Style: ${style}
Target duration: ${targetDuration} seconds

Available characters:
${availableCharacters.map((c) => `- ${c.name} (id: ${c.id}, preferred model: ${c.modelFamily ?? 'any'})`).join('\n')}

Available locations:
${availableLocations.map((l) => `- ${l.name} (id: ${l.id}, prompt: ${l.generativePrompt ?? 'none'})`).join('\n')}

Produce a complete TimelineRecipe JSON for a ${targetDuration}-second film. Include:
- A video track with 3-8 clips
- An audio track slot for music
- Each clip must have: id, trackId, startTime, endTime, prompt, modelUsed, characterId (if applicable)

The clips together should tell a compelling story matching the brief and style.`,
      },
    ],
  })

  const text = response.choices[0]?.message?.content ?? '{}'
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('AI Director failed to produce a valid timeline plan')

  const plan = JSON.parse(jsonMatch[0]) as Partial<TimelineRecipe>

  // Build a proper TimelineRecipe from the plan
  const recipeId = nanoid()
  const recipe: TimelineRecipe = {
    id: recipeId,
    projectId: '',
    fps: 24,
    resolution: { width: 1920, height: 1080 },
    durationSeconds: targetDuration,
    colorSpace: 'rec709',
    tracks: plan.tracks ?? [
      {
        id: `track-${nanoid()}`,
        type: 'video',
        label: 'VIDEO 1',
        muted: false,
        locked: false,
        solo: false,
        clips: [],
      } as Track,
    ],
  }

  return recipe
}
