// src/lib/orchestration/bridgedGeneration.ts
// FilmWeaver dual cache + tail-to-head keyframe bridging

import { runFal, extractVideoUrl, extractImageUrl } from '@/lib/fal/client'
import { uploadToR2 } from '@/lib/storage/r2'
import { recordPerformance } from '@/lib/cognition/routing/performance'
import { analyseFrameMotion, injectMotionContext } from './opticalFlow'
import { generateVideo } from './dispatch'
import type { GenerationMode } from './costGuard'
import type { DAGNode, GeneratedSegment, PatientZeroAssets } from './types'

// Per-model generation timeout ceilings (milliseconds).
// Generous — these are HARD caps to prevent infinite hangs, NOT target times.
// A draft finishes in ~30s; premium/open-source models can legitimately take 20+ min.
const MODEL_TIMEOUT_MS: Record<string, number> = {
  'ltx-2.3-fast':       180_000,   //  3 min — fast draft model
  'wan-2.2':            1_200_000, // 20 min — open-source, can be slow on FAL
  'ltx-2.3':            600_000,   // 10 min
  'pika-2.5':           600_000,   // 10 min
  'luma-ray3':          600_000,   // 10 min
  'minimax-2.3':        900_000,   // 15 min
  'hunyuan-video-1.5':  1_200_000, // 20 min — open-source, heavy
  'hunyuan-hy-motion':  1_200_000, // 20 min
  'seedance-2.0':       900_000,   // 15 min
  'skyreels-v3':        1_500_000, // 25 min — long-form generation
  'kling-3.0':          900_000,   // 15 min
  'pixverse-c1':        900_000,   // 15 min
  'pixverse-v6':        600_000,   // 10 min
  'veo-3.1':            900_000,   // 15 min
  'grok-imagine-video': 300_000,   //  5 min — fast model
  'runway-gen4':        900_000,   // 15 min
  'sora-2':             1_200_000, // 20 min — Replicate physics model
  'happyhorse-1.0':     900_000,   // 15 min
  'kling-o3':           900_000,   // 15 min
  'hailuo-2.3':         600_000,   // 10 min
}

const DEFAULT_TIMEOUT_MS = 1_200_000  // 20 min fallback

export function getModelTimeout(model: string): number {
  return MODEL_TIMEOUT_MS[model] ?? DEFAULT_TIMEOUT_MS
}

export function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${Math.round(ms / 1000)}s`)), ms)
    ),
  ])
}

export async function extractTailFrame(videoUrl: string): Promise<string> {
  const result = await runFal<{ image?: { url: string }; output_url?: string }>('fal-ai/ffmpeg', {
    video_url: videoUrl,
    command: 'extract_last_frame',
    output_format: 'jpg',
  })
  return extractImageUrl(result) ?? result.output_url ?? ''
}

export interface VideoModelParams {
  model:           string
  prompt:          string
  duration:        number
  imageUrl?:       string
  endImageUrl?:    string
  patientZeroUrl?: string
  jobId?:           string
  shotIndex?:       number
  generationMode?:  GenerationMode
  onSubProgress?:   import('./types').SubProgressFn
  onPoll?:          () => void | Promise<void>
}

// Public entry: times every model call and records live performance (latency +
// success) into the cognitive routing matrix. Non-fatal — a cognition/DB failure
// is swallowed and never affects the render.
export async function callVideoModel(params: VideoModelParams): Promise<string> {
  const t0 = Date.now()
  let ok = false
  try {
    const url = await runVideoModel(params)
    ok = true
    return url
  } finally {
    void recordPerformance({ model: params.model, latencyMs: Date.now() - t0, success: ok }).catch(() => {})
  }
}

async function runVideoModel(params: VideoModelParams): Promise<string> {
  return generateVideo(params)
}

export async function generateWithBridging(
  dag:        DAGNode[],
  assets:     PatientZeroAssets,
  onProgress: (data: {
    shotIndex:    number
    totalShots:   number
    status:       string
    subProgress?: number
    subMessage?:  string
  }) => void
): Promise<GeneratedSegment[]> {

  const results: GeneratedSegment[] = []
  const shotMemoryCache: string[]   = []
  const total = dag.length

  for (const node of dag) {
    onProgress({ shotIndex: node.shot.shotIndex, totalShots: total, status: 'generating' })

    let prompt = node.shot.visualPrompt
    if (shotMemoryCache.length > 0) {
      prompt += ` Maintain visual consistency with previous shots.`
    }

    let tailFrameUrl: string | undefined
    if (node.shot.bridgeRequired && results.length > 0) {
      const prev = results[results.length - 1]
      try {
        tailFrameUrl = await extractTailFrame(prev.videoUrl)
        const motion = await analyseFrameMotion(tailFrameUrl)
        prompt = injectMotionContext(prompt, motion, {
          contentType: dag[node.shot.shotIndex - 1]?.shot.contentType ?? '',
          lighting:    dag[node.shot.shotIndex - 1]?.shot.lighting ?? 'natural_day',
        })
        onProgress({ shotIndex: node.shot.shotIndex, totalShots: total, status: 'bridging' })
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        console.warn(`[orchestration] tail frame extraction failed for shot ${node.shot.shotIndex}:`, msg)
      }
    }

    const characterRef = node.shot.charactersPresent.length > 0
      ? assets.characters.find(c => c.name === node.shot.charactersPresent[0])?.imageUrl
      : undefined

    let videoUrl = ''
    let retryCount = 0
    const MAX_RETRIES = 1  // one retry then LTX fallback

    while (retryCount <= MAX_RETRIES) {
      try {
        videoUrl = await withTimeout(
          callVideoModel({
            model:          node.assignedModel,
            prompt,
            duration:       node.shot.duration,
            imageUrl:       tailFrameUrl,
            patientZeroUrl: characterRef,
            onSubProgress: (sub) => {
              // Blend per-vendor sub-progress into the overall pipeline band (40-88%)
              const shotsBefore    = node.shot.shotIndex
              const currentFrac    = sub.pct / 100
              const overallShotPct = ((shotsBefore + currentFrac) / Math.max(total, 1)) * 100
              const bandPct        = 40 + Math.round((overallShotPct / 100) * 48)
              onProgress({
                shotIndex:   node.shot.shotIndex,
                totalShots:  total,
                status:      'generating',
                subProgress: sub.pct,
                subMessage:  `Shot ${node.shot.shotIndex + 1}/${total}: ${sub.message}`,
              })
              void bandPct  // consumed by caller via overall % calculation in index.ts
            },
          }),
          getModelTimeout(node.assignedModel),  // model-aware hard cap per segment
          `Shot ${node.shot.shotIndex} (${node.assignedModel})`
        )
        break
      } catch (err: unknown) {
        retryCount++
        const msg = err instanceof Error ? err.message : String(err)
        console.warn(`[orchestration] shot ${node.shot.shotIndex} attempt ${retryCount} failed:`, msg)
        if (retryCount > MAX_RETRIES) {
          // LTX fallback — fast and cheap
          videoUrl = await callVideoModel({ model: 'ltx-2.3-fast', prompt, duration: node.shot.duration })
        } else {
          await new Promise(r => setTimeout(r, 3000 * retryCount))
        }
      }
    }

    try {
      const keyframeUrl = tailFrameUrl ?? await extractTailFrame(videoUrl)
      if (keyframeUrl) {
        const buf  = await fetch(keyframeUrl).then(r => r.arrayBuffer())
        const r2Kf = await uploadToR2(
          Buffer.from(buf),
          `shot-memory/${node.shot.shotIndex}_${Date.now()}.jpg`,
          'image/jpeg'
        )
        shotMemoryCache.push(r2Kf)
      }
    } catch { /* non-fatal */ }

    results.push({
      shotIndex:    node.shot.shotIndex,
      videoUrl,
      duration:     node.shot.duration,
      model:        node.assignedModel,
      contentType:  node.shot.contentType,
      tailFrameUrl: tailFrameUrl ?? '',
      qualityScore: 1.0,
      retryCount,
    })
    onProgress({ shotIndex: node.shot.shotIndex, totalShots: total, status: 'complete' })
  }

  return results
}
