import { db } from '../db'

/**
 * Central flywheel telemetry capture — all 7 training signal types.
 * Called silently from editor interactions. Non-blocking.
 */
export async function captureFlywheelSignal(
  type: string,
  data: Record<string, unknown>,
  userId: string
): Promise<void> {
  await db.trainingData.create({
    data: {
      userId,
      type,
      metadata: data as never,
      isProcessed: false,
    },
  })
}

// 1. Repaint delta — highest value training signal
export async function captureRepaintDelta(params: {
  userId: string
  originalVideoUrl: string
  instruction: string
  newVideoUrl: string
  modelUsed: string
  contextClips: string[]
}): Promise<void> {
  await captureFlywheelSignal('repaint_delta', params, params.userId)
}

// 2. Generation preference — DPO training pairs
export async function captureGenerationPreference(params: {
  userId: string
  prompt: string
  variants: Array<{ modelUsed: string; videoUrl: string }>
  chosenIndex: number
  rejectedIndices: number[]
}): Promise<void> {
  await captureFlywheelSignal('preference', params, params.userId)
}

// 3. Prompt refinement
export async function capturePromptRefinement(params: {
  userId: string
  originalPrompt: string
  refinedPrompt: string
  context: Record<string, unknown>
}): Promise<void> {
  await captureFlywheelSignal('prompt_refinement', params, params.userId)
}

// 4. Lighting preference
export async function captureLightingPreference(params: {
  userId: string
  beforeFrameUrl: string
  lightingParams: Record<string, unknown>
  afterFrameUrl: string
}): Promise<void> {
  await captureFlywheelSignal('lighting_preference', params, params.userId)
}

// 5. Character consistency pair
export async function captureCharacterConsistency(params: {
  userId: string
  characterRef: string
  scene1Url: string
  scene2Url: string
  modelUsed: string
}): Promise<void> {
  await captureFlywheelSignal('character_consistency', params, params.userId)
}

// 6. Routing feedback (implicit — user regenerated with different model)
export async function captureRoutingFeedback(params: {
  userId: string
  prompt: string
  originalModel: string
  newModel: string
  rejected: boolean
}): Promise<void> {
  await captureFlywheelSignal('routing_feedback', params, params.userId)
}

// 7. Auto-social acceptance
export async function captureAutoSocialFeedback(params: {
  userId: string
  assets: string[]
  proposedEdit: Record<string, unknown>
  accepted: boolean
  modifications?: Record<string, unknown>
}): Promise<void> {
  await captureFlywheelSignal('auto_social_feedback', params, params.userId)
}
