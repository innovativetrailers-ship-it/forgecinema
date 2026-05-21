import { nanoid } from 'nanoid'
import type { TimelineRecipe, Track, Clip } from '../timeline/schema'
import { getOpenRouterClient } from '../brain/openai-client'

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

  const user = await db.user.findUnique({ where: { id: userId }, select: { role: true } })
  const priority = getPriorityForRole(user?.role ?? 'FREE')

  const tracks = await Promise.all(
    recipe.tracks.map(async (track) => {
      if (track.type !== 'video') return track

      const clips = await Promise.all(
        track.clips.map(async (clip) => {
          if (clip.sourceUrl || !clip.prompt) return clip

          const modelId = clip.modelUsed ?? 'wan_2_2'
          const jobId = nanoid()
          const duration = Math.max(1, clip.endTime - clip.startTime)

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
              creditsCharged: 0,
            },
          })

          await renderQueue.add(
            'generate',
            {
              jobId,
              userId,
              projectId: recipe.projectId,
              prompt: clip.prompt,
              duration,
              modelId,
              clipId: clip.id,
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
