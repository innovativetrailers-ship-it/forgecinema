// MediaRouter — canonical entry point for the routing layer.
// Wraps SwarmRouter for backward compatibility while new code should
// use decomposeClip + dispatchClip + blendMultiEngineClip directly.
export { runSwarm as runGeneration } from '../swarm/SwarmRouter'
export { decomposeClip } from './SceneDecomposer'
export { dispatchClip } from './MediaDispatcher'
export { blendMultiEngineClip } from './SeamlessBlender'
export type { SceneSegment, BlendProfile } from './types'
