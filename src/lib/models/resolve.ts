/**
 * Canonical model resolver — the only place endpoint ids are read at runtime.
 */

import { normaliseModelId } from './normaliseId'
import {
  entryProvider,
  MODEL_REGISTRY_ALIASES,
  VIDEO_MODEL_REGISTRY,
  type Provider,
  type RegistryEntry,
} from './registry'

export class ModelResolveError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ModelResolveError'
  }
}

export interface ModelDef {
  id: string
  canonicalId: string
  provider: Provider
  falEndpoint: string | undefined
  i2vEndpoint: string | undefined
  isExternal: boolean
}

function toModelDef(id: string, entry: RegistryEntry): ModelDef {
  const provider = entryProvider(id, entry)
  return {
    id,
    canonicalId: normaliseModelId(id),
    provider,
    falEndpoint: entry.falEndpoint,
    i2vEndpoint: entry.i2vEndpoint,
    isExternal: provider !== 'fal',
  }
}

/** Queue status/result paths use the base app id = first two segments. */
export function falBaseApp(endpoint: string): string {
  return endpoint.split('/').slice(0, 2).join('/')
}

/** Canonical model lookup — kebab/snake tolerant. Throws ModelResolveError if unknown. */
export function resolveModel(id: string): ModelDef {
  const canon = normaliseModelId(id.trim().toLowerCase().replace(/[_\s]+/g, '-'))
  const aliasTarget = MODEL_REGISTRY_ALIASES[canon]
  const key = VIDEO_MODEL_REGISTRY[canon] ? canon : aliasTarget
  const entry = key ? VIDEO_MODEL_REGISTRY[key] : undefined

  if (!entry) {
    throw new ModelResolveError(
      `Unknown model '${id}' (canonical '${canon}'). Known: ${Object.keys(VIDEO_MODEL_REGISTRY).join(', ')}`,
    )
  }
  const provider = entryProvider(key!, entry)
  if (provider === 'elevenlabs' || provider === 'suno') {
    throw new ModelResolveError(
      `Model '${id}' is an audio provider — use the audio pipeline, not video dispatch`,
    )
  }
  if (provider === 'fal' && !entry.falEndpoint) {
    throw new ModelResolveError(`Model '${canon}' has no FAL endpoint mapping`)
  }
  return toModelDef(key!, entry)
}

export function assertModelsResolvable(modelIds: string[]): void {
  for (const id of modelIds) resolveModel(id)
}

export function resolveVideoEndpoint(registryModel: string, hasStartFrame: boolean): string | undefined {
  const def = resolveModel(registryModel)
  if (def.isExternal) return def.falEndpoint
  if (hasStartFrame && def.i2vEndpoint && def.i2vEndpoint !== def.falEndpoint) {
    return def.i2vEndpoint
  }
  return def.falEndpoint
}
