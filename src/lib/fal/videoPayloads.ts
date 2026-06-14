/**
 * Model-specific FAL input payloads — delegates to videoPayloadAdapters.
 */

export type { AudioPolicy, FalVideoIntent } from './videoPayloadAdapters'
export { buildFalVideoInput, buildFalVideoInputWithHeal, klingV3Duration, wantsNativeAudio } from './videoPayloadAdapters'
