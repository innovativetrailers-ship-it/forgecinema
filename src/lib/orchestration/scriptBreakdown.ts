// src/lib/orchestration/scriptBreakdown.ts
// VideoGen-of-Thought style: prompt → structured multi-shot plan

import type { StructuredShot, PatientZeroAssets, ContinuityChain } from './types'
import { MODEL_SPECIALTIES }                       from '@/lib/routing/engineRegistry'

export async function breakdownToShots(
  prompt:        string,
  totalSeconds:  number,
  assets:        PatientZeroAssets,
  availablePool: string[] = []
): Promise<StructuredShot[]> {

  const characterNames = assets.characters.map(c => c.name).join(', ') || 'none'
  const locationNames  = assets.locations.map(l => l.name).join(', ')  || 'none'

  const modelHints = availablePool.length > 0
    ? availablePool
        .map(m => {
          const spec = MODEL_SPECIALTIES[m]
          return spec ? `• ${m}: ${spec.bestFor}` : null
        })
        .filter(Boolean)
        .join('\n')
    : 'All models available — use the full content type range'

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method:  'POST',
    headers: {
      'x-api-key':         process.env.ANTHROPIC_API_KEY!,
      'content-type':      'application/json',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model:      'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: `You are a Hollywood cinematographer and VFX supervisor.
Break down video prompts into structured shot lists optimised for multi-model AI generation.
You will be given the available AI video models and their specialties.
Design shots that PLAY TO THE STRENGTHS of the available models.
For example: if Kling is available, design locomotion/action shots; if Seedance, dialogue close-ups.
If only budget models are available, keep shots simple and achievable.
Each shot gets the minimum duration needed — don't pad.
Group shots into continuity chains. Shots that depict ONE continuous unbroken action
(same location, same moment, camera following through) share a continuityGroup number.
A hard cut to a different location/time/subject starts a NEW continuityGroup.
Most narrative films have several short chains rather than one long one.
Return ONLY valid JSON array. No markdown.`,
      messages: [{
        role:    'user',
        content: `Video prompt: "${prompt}"
Total duration: ${totalSeconds} seconds
Characters available: ${characterNames}
Locations available: ${locationNames}

AVAILABLE MODELS AND THEIR STRENGTHS (design shots to use these):
${modelHints}

Break into 1-8 shots. Assign contentType values that match the available models above. Shots must sum to exactly ${totalSeconds}s.

For each shot return:
{
  "shotIndex": number (0-based),
  "startSeconds": number,
  "endSeconds": number,
  "duration": number,
  "contentType": one of [aerial_establishing|dialogue_closeup|physical_action|cgi_vfx|crowd_urban|camera_control|physics_simulation|character_emotion|cgi_character|long_sequence|fast_draft|environment_travel|product_commercial|audio_native],
  "visualPrompt": "detailed cinematic description written to maximise the assigned model's strengths",
  "cameraMove": "static|slow_push_in|pull_out|pan_left|pan_right|tilt_up|tilt_down|crane_up|aerial_descent|handheld|orbit",
  "motionLevel": "static|slow|medium|fast|complex",
  "hasDialogue": boolean,
  "hasFaces": boolean,
  "hasAudio": boolean,
  "hasCGI": boolean,
  "charactersPresent": [],
  "locationsPresent": [],
  "lighting": "natural_day|golden_hour|night|overcast|studio|dramatic|neon",
  "mood": "tension|joy|sorrow|wonder|fear|calm|action",
  "bridgeRequired": boolean (true for all shots after the first),
  "suggestedModel": "which model from the available pool best suits this shot",
  "sceneNumber": number (narrative scene — new location/time = new sceneNumber),
  "scriptBeatId": string (optional id linking to a script dialogue beat),
  "continuityGroup": number (same as sceneNumber when possible),
  "isChainStart": boolean (true ONLY for shotIndex 0 — first clip of the entire film)
}`,
      }],
    }),
  }).then(r => r.json())

  try {
    const parsed: StructuredShot[] = JSON.parse(
      res.content?.[0]?.text?.replace(/```json|```/g, '').trim() ?? '[]'
    )

    // Normalise continuity fields — Claude may omit them; fall back to each shot
    // being its own chain so downstream scheduling is always well-defined.
    const seenGroups = new Set<number>()
    const basePrompt = typeof prompt === 'string' ? prompt.trim() : ''
    const shots: StructuredShot[] = parsed
      .filter((shot): shot is StructuredShot => shot != null && typeof shot === 'object')
      .map((shot, index) => {
      const sceneNumber = shot.sceneNumber ?? shot.continuityGroup ?? shot.shotIndex ?? index
      const continuityGroup = shot.continuityGroup ?? sceneNumber
      const isChainStart = shot.isChainStart ?? index === 0
      seenGroups.add(continuityGroup)
      const raw = shot as StructuredShot & { prompt?: string }
      const visualPrompt =
        (shot.visualPrompt ?? raw.prompt ?? basePrompt).trim() || basePrompt || 'Cinematic shot'
      const startsAtHardCut = shot.startsAtHardCut ?? isChainStart
      return { ...shot, visualPrompt, sceneNumber, continuityGroup, isChainStart, startsAtHardCut }
    })

    const total = shots.reduce((s, shot) => s + shot.duration, 0)
    if (Math.abs(total - totalSeconds) > 0.5) {
      const scale = totalSeconds / total
      return shots.map(shot => ({
        ...shot,
        duration:     shot.duration * scale,
        endSeconds:   shot.endSeconds * scale,
        startSeconds: shot.startSeconds * scale,
      }))
    }
    return shots
  } catch {
    return [{
      shotIndex:         0,
      startSeconds:      0,
      endSeconds:        totalSeconds,
      duration:          totalSeconds,
      contentType:       'physical_action',
      visualPrompt:      prompt,
      cameraMove:        'slow_push_in',
      motionLevel:       'medium',
      hasDialogue:       false,
      hasFaces:          false,
      hasAudio:          false,
      hasCGI:            false,
      charactersPresent: [],
      locationsPresent:  [],
      lighting:          'natural_day',
      mood:              'calm',
      bridgeRequired:    false,
      continuityGroup:   0,
      isChainStart:      true,
    }]
  }
}

/**
 * Group shots into continuity chains. Shots sharing a continuityGroup form one
 * sequential chain (rendered tail-to-head); separate groups render in parallel.
 */
export function groupIntoChains(shots: StructuredShot[]): ContinuityChain[] {
  const groups = new Map<number, StructuredShot[]>()
  for (const shot of shots) {
    const g = shot.continuityGroup ?? shot.shotIndex   // fallback: each shot its own chain
    if (!groups.has(g)) groups.set(g, [])
    groups.get(g)!.push(shot)
  }
  return [...groups.entries()]
    .map(([groupId, s]) => ({ groupId, shots: s.sort((a, b) => a.shotIndex - b.shotIndex) }))
    .sort((a, b) => a.shots[0].shotIndex - b.shots[0].shotIndex)
}
