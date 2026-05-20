/**
 * @deprecated Import from `@/lib/routing` instead. Re-exports for backwards compatibility.
 */
export {
  ShotListRouter,
  SwarmRouter,
  decomposeClip,
  dispatchClip,
  blendMultiEngineClip,
  SeamlessBlender,
  inspectGeneratedClip,
  analyseTimelineEdit,
  executeTimelineEdit,
} from '../routing'
export type {
  SceneSegment,
  BlendProfile,
  Shot,
  ShotList,
  ModelId,
  OutcomeTier,
  SceneCategory,
  SwarmResult,
} from '../routing/types'
export { LongFormOrchestrator } from './LongFormOrchestrator'
export { AudioSwarm } from './AudioSwarm'
export * from './brain-prompts'
