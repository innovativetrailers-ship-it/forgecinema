// Growth Engine Orchestrator
// Coordinates Model 1 (Claude) reasoning, Model 2 (Mochi) generation,
// and the agentic loop for quality-gated production pipelines.

import { runModel1 } from './model1'
import { runModel2, evaluateQuality } from './model2'
import { db } from '../db'

export interface OrchestratorJob {
  userId: string
  prompt: string
  tier: string
  duration: number
  maxIterations?: number
  qualityThreshold?: number
  characterIds?: string[]
}

export interface OrchestratorResult {
  videoUrl: string
  qualityScore: number
  iterations: number
  promptHistory: string[]
}

const DEFAULT_QUALITY_THRESHOLD = 0.72
const DEFAULT_MAX_ITERATIONS = 3

export async function orchestrate(job: OrchestratorJob): Promise<OrchestratorResult> {
  const maxIter = job.maxIterations ?? DEFAULT_MAX_ITERATIONS
  const threshold = job.qualityThreshold ?? DEFAULT_QUALITY_THRESHOLD

  let currentPrompt = job.prompt
  const promptHistory: string[] = []
  let bestResult: { videoUrl: string; qualityScore: number } | null = null

  for (let iter = 0; iter < maxIter; iter++) {
    promptHistory.push(currentPrompt)

    // Step 1: Enhance prompt with Model 1
    const enhancedResult = await runModel1({
      systemPrompt: `You are a professional cinematographer and prompt engineer.
Enhance the following video generation prompt to maximise cinematic quality.
Return ONLY the enhanced prompt — no explanation, no markdown.
Keep it under 200 words. Focus on: composition, lighting, motion, atmosphere.`,
      userMessage: currentPrompt,
    })

    const enhancedPrompt = enhancedResult.content.trim()

    // Step 2: Generate with Model 2
    const generated = await runModel2({
      prompt: enhancedPrompt,
      duration: job.duration,
    })

    // Step 3: Evaluate quality
    const evaluation = await evaluateQuality(generated.videoUrl, enhancedPrompt)

    if (!bestResult || evaluation.score > bestResult.qualityScore) {
      bestResult = { videoUrl: generated.videoUrl, qualityScore: evaluation.score }
    }

    // Log training signal
    await db.rLHFLog.create({
      data: {
        userId: job.userId,
        promptRaw: job.prompt,
        promptEnhanced: enhancedPrompt,
        videoUrl: generated.videoUrl,
        qualityScore: evaluation.score,
        iteration: iter,
        tier: job.tier,
      },
    }).catch(() => { /* rLHFLog may not be migrated yet */ })

    if (evaluation.score >= threshold) break

    // Step 4: Plan next iteration — ask Model 1 what to fix
    if (iter < maxIter - 1 && evaluation.issues.length > 0) {
      const fixPlan = await runModel1({
        systemPrompt: `You are fixing a video generation prompt to address quality issues.
Return ONLY the improved prompt — no explanation.`,
        userMessage: `Original prompt: "${currentPrompt}"\nIssues: ${evaluation.issues.join(', ')}`,
      })
      currentPrompt = fixPlan.content.trim()
    }
  }

  return {
    videoUrl: bestResult!.videoUrl,
    qualityScore: bestResult!.qualityScore,
    iterations: promptHistory.length,
    promptHistory,
  }
}
