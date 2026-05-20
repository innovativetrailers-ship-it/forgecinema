// MediaRouter — canonical entry point for the routing layer.
export { ShotListRouter, SwarmRouter } from './ShotListRouter'
export { decomposeClip } from './SceneDecomposer'
export { dispatchClip } from './MediaDispatcher'
export { blendMultiEngineClip } from './SeamlessBlender'
export type { SceneSegment, BlendProfile } from './types'
