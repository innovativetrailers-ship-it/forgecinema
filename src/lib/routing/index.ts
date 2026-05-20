/**
 * Media Routing Engine — canonical public API.
 * Import from `@/lib/routing` in new code.
 */

export { ShotListRouter, SwarmRouter } from './ShotListRouter'
export { decomposeClip } from './SceneDecomposer'
export { dispatchClip } from './MediaDispatcher'
export { blendMultiEngineClip, SeamlessBlender } from './SeamlessBlender'
export type { BlendJob } from './SeamlessBlender'
export { inspectGeneratedClip } from './QualityInspector'
export { analyseTimelineEdit, executeTimelineEdit } from './TimelineEditor'
export type { SceneSegment, BlendProfile, Shot, ShotList, ModelId, OutcomeTier, SceneCategory, SwarmResult } from './types'
