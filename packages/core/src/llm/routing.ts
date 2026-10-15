/**
 * Brain task → FAL OpenRouter model id. One table. Video delegate does not
 * read this. Open-weight bases are pinned and are not entries here.
 * Verified router family 2026-09-28: openrouter/router, /vision, /openai/v1/chat/completions.
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { OPEN_WEIGHT_BASES } from '../logic/trainerRegistry'

export type BrainTask =
  | 'mechanical'
  | 'delegation'
  | 'script'
  | 'scene'
  | 'character'
  | 'asset'
  | 'training'
  | 'premise'

export type BrainTone = 'dark' | 'polished' | 'neutral'
export type BrainBudget = 'tight' | 'standard'

export interface BrainRoute {
  primary: string
  fallbacks: string[]
}

/**
 * Creative tier. Live on OpenRouter 2026-09-29: anthropic/claude-sonnet-5.
 * Blockbuster breakdown may opt into MAX_QUALITY_BREAKDOWN_MODEL.
 */
export const CREATIVE_TIER_MODEL = 'anthropic/claude-sonnet-5'
export const MAX_QUALITY_BREAKDOWN_MODEL = 'anthropic/claude-opus-5.5'

export const BRAIN_ROUTES: Record<BrainTask, BrainRoute> = {
  mechanical: {
    primary: 'google/gemini-3.5-flash-lite',
    fallbacks: ['openai/gpt-6-luna'],
  },
  delegation: {
    primary: 'anthropic/claude-opus-5.5',
    fallbacks: ['openai/gpt-6-astra'],
  },
  script: {
    primary: CREATIVE_TIER_MODEL,
    fallbacks: ['x-ai/grok-4', 'openai/gpt-6-sol'],
  },
  scene: {
    primary: 'google/gemini-3.5-flash-lite',
    fallbacks: ['openai/gpt-6-luna'],
  },
  character: {
    primary: 'google/gemini-3.5-flash-lite',
    fallbacks: ['openai/gpt-6-luna'],
  },
  asset: {
    primary: 'google/gemini-3.5-flash-lite',
    fallbacks: ['openai/gpt-6-luna'],
  },
  training: {
    primary: 'anthropic/claude-opus-5.5',
    fallbacks: ['openai/gpt-6-astra'],
  },
  premise: {
    primary: 'openai/gpt-6-astra',
    fallbacks: ['anthropic/claude-opus-5.5'],
  },
}

/** Open-weight bases stay pinned. This map must not route to or replace them. */
export const OPEN_WEIGHT_ROUTE_PIN = {
  class: 'open-weight-base',
  pinned: true,
} as const

/** Debate approvals may not swap these. Wave 4 owns the open-weight lane. */
const wan22 = OPEN_WEIGHT_BASES['wan-2.2']
export const OPEN_WEIGHT_MODEL_IDS = [
  'wan-2.2',
  wan22.t2vA14b,
  wan22.ti2v5b,
  wan22.trainer,
] as const

const approvedRoutes = new Map<BrainTask, string>()

export function approvedRouteFor(task: BrainTask): string | undefined {
  return approvedRoutes.get(task)
}

/** Human approval only. Refuses an open-weight id. */
export function applyApprovedRoute(task: BrainTask, model: string): void {
  const next = model.trim()
  if (!next) throw new Error('Approved route is empty')
  if ((OPEN_WEIGHT_MODEL_IDS as readonly string[]).includes(next)) {
    throw new Error(`Open-weight model ${next} cannot be a routing swap`)
  }
  if (!BRAIN_ROUTES[task]) throw new Error(`Unknown brain task ${task}`)
  approvedRoutes.set(task, next)
  console.log('[routing_approved]', JSON.stringify({ task, model: next }))
}

const CHEAP_TIER = 'google/gemini-3.5-flash-lite'
const DARK_CREATIVE = 'x-ai/grok-4'
const POLISHED_CREATIVE = CREATIVE_TIER_MODEL

export interface BrainModelChoice {
  model: string
  task: BrainTask
  substituted: boolean
  reason: string
}

export function llmModelForTask(
  task: BrainTask,
  opts?: { tone?: BrainTone; budget?: BrainBudget },
): BrainModelChoice {
  const route = BRAIN_ROUTES[task]
  const approved = approvedRoutes.get(task)
  if (approved && !opts?.budget && !opts?.tone) {
    return { model: approved, task, substituted: approved !== route.primary, reason: 'approved-debate' }
  }
  if (opts?.budget === 'tight') {
    const choice: BrainModelChoice = {
      model: CHEAP_TIER,
      task,
      substituted: CHEAP_TIER !== route.primary,
      reason: 'budget-tight',
    }
    if (choice.substituted) {
      console.log('[brain_route_substituted]', JSON.stringify(choice))
    }
    assertModelAvailable(task, choice.model)
    return choice
  }
  if (opts?.tone === 'dark' && (task === 'script' || task === 'character')) {
    const choice: BrainModelChoice = {
      model: DARK_CREATIVE,
      task,
      substituted: true,
      reason: 'tone-dark',
    }
    console.log('[brain_route_substituted]', JSON.stringify(choice))
    assertModelAvailable(task, choice.model)
    return choice
  }
  if (opts?.tone === 'polished' && task === 'script' && !route.primary.startsWith('anthropic/')) {
    const choice: BrainModelChoice = {
      model: POLISHED_CREATIVE,
      task,
      substituted: true,
      reason: 'tone-polished',
    }
    console.log('[brain_route_substituted]', JSON.stringify(choice))
    assertModelAvailable(task, choice.model)
    return choice
  }
  assertModelAvailable(task, route.primary)
  return { model: route.primary, task, substituted: false, reason: 'primary' }
}

/** Every id this table can send. Verification reads this. It does not change the table. */
export function routedModelIds(): string[] {
  const ids = new Set<string>()
  for (const route of Object.values(BRAIN_ROUTES)) {
    ids.add(route.primary)
    for (const fallback of route.fallbacks) ids.add(fallback)
  }
  return [...ids]
}

/** Logged on every expert-brief call. The version is the brief's BRIEF_VERSION. */
export function logExpertBrief(role: string, version: string): void {
  console.log('[expert_brief]', JSON.stringify({ role, version }))
}

const STYLE_UNAVAILABLE = 'This style is temporarily unavailable'

export class ModelUnavailableError extends Error {
  readonly role: string
  readonly modelId: string
  readonly reason: string

  constructor(role: string, modelId: string, reason: string) {
    super(STYLE_UNAVAILABLE)
    this.name = 'ModelUnavailableError'
    this.role = role
    this.modelId = modelId
    this.reason = reason
  }
}

let cacheOverride: Set<string> | null = null
let cacheLoaded: Set<string> | null = null

/** Test and startup hook. Replaces the on-disk verification cache. */
export function applyVerificationCache(missing: readonly string[]): void {
  cacheOverride = new Set(missing)
}

export function resetVerificationCache(): void {
  cacheOverride = null
  cacheLoaded = null
}

function missingFromCache(): Set<string> {
  if (cacheOverride) return cacheOverride
  if (cacheLoaded) return cacheLoaded
  cacheLoaded = new Set()
  try {
    const raw = readFileSync(resolve(process.cwd(), 'docs/model-route-cache.json'), 'utf8')
    const parsed = JSON.parse(raw) as { missing?: unknown }
    if (Array.isArray(parsed.missing)) {
      cacheLoaded = new Set(parsed.missing.filter((id): id is string => typeof id === 'string'))
    }
  } catch (err) {
    console.warn('[model_unavailable]', err instanceof Error ? err.message : err)
  }
  return cacheLoaded
}

/** Throws when the verification cache marks this id missing. Does not pick another model. */
export function assertModelAvailable(role: string, modelId: string): void {
  if (!missingFromCache().has(modelId)) return
  const reason = 'missing from the verification cache'
  console.error('[model_unavailable]', JSON.stringify({ role, modelId, reason }))
  throw new ModelUnavailableError(role, modelId, reason)
}
