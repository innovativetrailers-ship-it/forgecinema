import { nanoid } from 'nanoid'
import type { TimelineRecipe, Track, Clip } from '../timeline/schema'
import { getOpenRouterClient } from '../brain/openai-client'
import { getOperationCostKey, normalizeWorkerModelId, normaliseModelId } from '../models/router'
import { OPERATION_COSTS } from '../credits'

const DIRECTOR_SYSTEM_PROMPT = `You are the AI Director for Cinematic Forge. You assign shots to video generation models.

AVAILABLE MODELS (use exactly as written in modelUsed fields):
- wan-2.6        cost: 2   best for: standard scenes, dialogue, establishing shots
- ltx-2.3        cost: 6   best for: rapid drafts, simple motion
- ltx-2.3-fast   cost: 2   best for: storyboard previews only
- seedance-2.0   cost: 20  best for: narrative arcs, story-driven scenes
- pixverse-c1    cost: 28  best for: text overlays, stylised scenes
- skyreels-v3    cost: 18  best for: emotional performances, close-ups
- minimax-2.3    cost: 10  best for: crowd scenes, wide shots
- luma-ray3      cost: 8   best for: cinematic lighting, atmosphere
- hunyuan-video-1.5 cost: 12 best for: crowd dynamics, large-scale scenes
- pika-2.5       cost: 8   best for: short punchy clips, motion graphics
- happyhorse-1.0 cost: 22  best for: dialogue close-ups, character acting
- kling-3.0      cost: 25  best for: complex motion, action sequences
- runway-gen4    cost: 22  best for: image-to-video, scene transitions
- veo-3.1        cost: 35  best for: photorealism, fluid physics, hero shots
- grok-imagine-video cost: 20 best for: creative/stylised content
- sora-2         cost: 35  best for: long coherent sequences

Your timeline plan must:
1. Follow proper film grammar (establish scene → develop → climax → resolution)
2. Vary shot types for visual dynamism (wide, medium, close-up)
3. Select the optimal model for each shot's requirements
4. Ensure character continuity when the same character appears across shots
5. Specify precise prompts for each clip

Return ONLY valid JSON matching the TimelineRecipe schema.
modelUsed fields must be exact kebab-case IDs from the list above.`

type DirectorCharacter = {
  id: string
  name: string
  modelFamily: string | null
  loraModelId?: string | null
  loraStatus?: string
  referenceUrls?: string[]
}

type DirectorLocation = {
  id: string
  name: string
  generativePrompt: string | null
  source?: string
}

export async function runAIDirector(params: {
  brief: string
  availableCharacters: DirectorCharacter[]
  availableLocations: DirectorLocation[]
  targetDuration: number
  style: string
  projectId: string
}): Promise<{ recipe: TimelineRecipe; directorNotes: string }> {
  const { brief, availableCharacters, availableLocations, targetDuration, style, projectId } = params

  const response = await getOpenRouterClient().chat.completions.create({
    model: 'anthropic/claude-sonnet-4-5',
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
  const directorNotes = text.replace(/\{[\s\S]*\}/, '').trim() || 'Director plan generated.'
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('AI Director failed to produce a valid timeline plan')

  const plan = JSON.parse(jsonMatch[0]) as Partial<TimelineRecipe>

  const recipe: TimelineRecipe = {
    id: plan.id ?? nanoid(),
    projectId,
    fps: plan.fps ?? 24,
    resolution: plan.resolution ?? { width: 1920, height: 1080 },
    durationSeconds: targetDuration,
    colorSpace: plan.colorSpace ?? 'rec709',
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

  return { recipe, directorNotes }
}

export async function queueDirectorGenerations(
  recipe: TimelineRecipe,
  userId: string,
): Promise<TimelineRecipe> {
  const { db } = await import('../db')
  const { renderQueue, getPriorityForRole } = await import('../queue')
  const { checkAndDeductCredits } = await import('../credits')

  const user = await db.user.findUnique({ where: { id: userId }, select: { role: true } })
  const priority = getPriorityForRole(user?.role ?? 'FREE')

  const tracks = await Promise.all(
    recipe.tracks.map(async (track) => {
      if (track.type !== 'video') return track

      const clips = await Promise.all(
        track.clips.map(async (clip) => {
          if (clip.sourceUrl || !clip.prompt) return clip

          const modelId = normaliseModelId(clip.modelUsed)
          const costKey = getOperationCostKey(normalizeWorkerModelId(modelId))
          const cost = OPERATION_COSTS[costKey] ?? 2
          const jobId = nanoid()
          const duration = Math.max(1, clip.endTime - clip.startTime)

          try {
            await checkAndDeductCredits(userId, costKey)
          } catch {
            return clip
          }

          await db.renderJob.create({
            data: {
              id: jobId,
              userId,
              projectId: recipe.projectId,
              type: 'GENERATE',
              status: 'QUEUED',
              modelUsed: modelId,
              inputPayload: {
                prompt: clip.prompt,
                duration,
                characterId: clip.characterId,
                locationId: clip.locationId,
                clipId: clip.id,
              } as never,
              creditsCharged: cost,
            },
          })

          await renderQueue.add(
            'render',
            {
              jobId,
              userId,
              projectId: recipe.projectId,
              type: 'GENERATE',
              modelId,
              payload: {
                prompt: clip.prompt,
                duration,
                aspectRatio: '16:9',
                characterId: clip.characterId,
                locationId: clip.locationId,
                clipId: clip.id,
              },
            },
            { priority },
          )

          return {
            ...clip,
            sourceUrl: '',
            metadata: { ...clip.metadata, jobId, generating: true },
          } satisfies Clip
        }),
      )

      return { ...track, clips }
    }),
  )

  return { ...recipe, tracks }
}
