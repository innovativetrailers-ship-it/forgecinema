import { runModel1 } from '../brain/model1'
import { enforceContinuityPolicy } from './continuityPolicy'
import type { SceneSegment } from './types'

const SCENE_DECOMPOSER_SYSTEM_PROMPT = `You are a scene decomposition specialist for a professional AI film production platform.
Given a video prompt and parameters, analyse the prompt and identify distinct temporal phases or visual requirements.
Return ONLY a valid JSON object matching this schema:
{
  "segments": [
    {
      "segmentId": "string (unique)",
      "startSeconds": number,
      "endSeconds": number,
      "prompt": "string (specific to this segment)",
      "requirements": ["array of requirement tags from the allowed list"],
      "characterIds": ["optional array of character IDs"]
    }
  ]
}

Requirement tags (use ONLY these):
text_rendering, fluid_dynamics, atmosphere, emotional_acting, human_locomotion,
character_detail, crowd_dynamics, aerial_landscape, wildlife_motion, cost_efficient,
abstract_visual, action_sequence, dialogue_scene, establishing_shot, vfx_heavy

Rules:
- If the prompt has only one visual theme, return a single segment.
- Split at natural visual or temporal transitions.
- Each segment must have at least 2 seconds duration.
- Segment prompts must be self-contained and specific.`

function selectOptimalEngine(requirements: string[], tier: string): string {
  if (requirements.includes('text_rendering'))   return 'pixverse'
  if (requirements.includes('fluid_dynamics'))   return 'veo3'
  if (requirements.includes('atmosphere'))       return 'veo3'
  if (requirements.includes('emotional_acting')) return 'hailuo-2.3'
  if (requirements.includes('human_locomotion')) return 'kling_pro'
  if (requirements.includes('character_detail')) return 'seedance'
  if (requirements.includes('crowd_dynamics'))   return 'wan'
  if (requirements.includes('aerial_landscape')) return 'luma'
  if (requirements.includes('wildlife_motion'))  return 'wan'
  if (requirements.includes('cost_efficient'))   return tier === 'Draft' ? 'ltx' : 'wan'
  const defaults: Record<string, string> = {
    Draft: 'wan', Standard: 'wan', Studio: 'kling_pro', Cinematic: 'kling_pro', Film: 'veo3',
  }
  return defaults[tier] ?? 'wan'
}

function estimateSegmentCredits(seg: { startSeconds: number; endSeconds: number; engineId: string }): number {
  const durationUnits = Math.ceil((seg.endSeconds - seg.startSeconds) / 5)
  const perUnit: Record<string, number> = {
    ltx: 1, wan: 2, luma: 8, pixverse: 5, skyreels: 20,
    kling_pro: 25, seedance: 20, runway: 22, veo3: 35,
  }
  return durationUnits * (perUnit[seg.engineId] ?? 10)
}

export async function decomposeClip(params: {
  masterPrompt: string
  clipId: string
  duration: number
  tier: string
  characterIds?: string[]
  locationId?: string
  forceMultiEngine?: boolean
}): Promise<SceneSegment[]> {
  const result = await runModel1({
    systemPrompt: SCENE_DECOMPOSER_SYSTEM_PROMPT,
    userMessage: JSON.stringify({
      prompt: params.masterPrompt,
      totalDuration: params.duration,
      tier: params.tier,
      characterIds: params.characterIds ?? [],
      locationId: params.locationId,
    }),
    requireJSON: true,
  })

  let parsed: { segments: Array<{
    segmentId: string
    startSeconds: number
    endSeconds: number
    prompt: string
    requirements: string[]
    characterIds?: string[]
  }> }

  try {
    parsed = JSON.parse(result.content) as typeof parsed
  } catch {
    // Fallback: single segment covering full duration
    const engineId = selectOptimalEngine([], params.tier)
    return enforceContinuityPolicy([{
      segmentId: `${params.clipId}-0`,
      clipId: params.clipId,
      shotId: params.clipId,
      startSeconds: 0,
      endSeconds: params.duration,
      prompt: params.masterPrompt,
      engineId,
      tier: params.tier,
      requirements: [],
      characterIds: params.characterIds,
      isHardCut: true,
      estimatedCredits: estimateSegmentCredits({
        startSeconds: 0,
        endSeconds: params.duration,
        engineId,
      }),
    }])
  }

  const withEngines = parsed.segments.map((seg, index) => {
    const engineId = selectOptimalEngine(seg.requirements, params.tier)
    return {
      segmentId: seg.segmentId,
      clipId: params.clipId,
      shotId: params.clipId,
      startSeconds: seg.startSeconds,
      endSeconds: seg.endSeconds,
      prompt: seg.prompt?.trim() ? seg.prompt : params.masterPrompt,
      engineId,
      tier: params.tier,
      requirements: seg.requirements,
      characterIds: seg.characterIds ?? params.characterIds,
      isHardCut: index === 0,
      estimatedCredits: estimateSegmentCredits({ startSeconds: seg.startSeconds, endSeconds: seg.endSeconds, engineId }),
    }
  })

  return enforceContinuityPolicy(withEngines)
}
