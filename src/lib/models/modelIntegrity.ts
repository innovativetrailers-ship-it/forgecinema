import { resolveModel, resolveVideoEndpoint, type ModelDef } from './resolve'

export class ModelIntegrityError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ModelIntegrityError'
  }
}

/** Refuse silent model/endpoint substitution at submit time. */
export function assertModelIntegrity(
  selectedId: string,
  def: ModelDef,
  endpoint: string,
  hasStartFrame = false,
): void {
  const expected = resolveModel(selectedId)
  if (expected.canonicalId !== def.canonicalId) {
    throw new ModelIntegrityError(
      `Model substitution detected: user selected '${selectedId}' ` +
        `(canonical ${expected.canonicalId}) but dispatch resolved '${def.canonicalId}'.`,
    )
  }

  if (def.provider !== 'fal') return

  const expectedEndpoint = resolveVideoEndpoint(expected.canonicalId, hasStartFrame)
  if (!expectedEndpoint) {
    throw new ModelIntegrityError(`Model '${selectedId}' has no FAL endpoint mapping`)
  }
  if (endpoint !== expectedEndpoint) {
    throw new ModelIntegrityError(
      `Model substitution detected: user selected '${selectedId}' ` +
        `(endpoint ${expectedEndpoint}) but about to submit ${endpoint}. Refusing — no silent swaps.`,
    )
  }
}
