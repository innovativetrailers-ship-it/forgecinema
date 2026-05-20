import type { EXRData } from './EXRLoader'

export interface CompositorFrame {
  width: number
  height: number
  /** RGBA 8-bit buffer */
  rgba: Buffer
  depth?: Float32Array
  exr?: EXRData
}

export interface NodeInputs {
  video?: CompositorFrame
  foreground?: CompositorFrame
  background?: CompositorFrame
  mask?: CompositorFrame
  depth?: CompositorFrame
  exr?: EXRData
  [key: string]: CompositorFrame | EXRData | undefined
}
