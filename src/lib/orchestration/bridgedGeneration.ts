// src/lib/orchestration/bridgedGeneration.ts
// FilmWeaver dual cache + tail-to-head keyframe bridging

import { runFal, extractVideoUrl, extractImageUrl }      from '@/lib/fal/client'
import { uploadToR2 }                                    from '@/lib/storage/r2'
import { recordPerformance }                            from '@/lib/cognition/routing/performance'
import { buildPayload }                                  from '@/lib/cognition/routing/schemaPayload'
import { analyseFrameMotion, injectMotionContext }       from './opticalFlow'
import type { DAGNode, GeneratedSegment, PatientZeroAssets } from './types'

// Per-model generation timeout ceilings (milliseconds).
// Generous — these are HARD caps to prevent infinite hangs, NOT target times.
// A draft finishes in ~30s; premium/open-source models can legitimately take 20+ min.
const MODEL_TIMEOUT_MS: Record<string, number> = {
  'ltx-2.3-fast':       180_000,   //  3 min — fast draft model
  'wan-2.2':            1_200_000, // 20 min — open-source, can be slow on FAL
  'cogvideox':          1_200_000, // 20 min — open-source
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

async function callFalModel(
  modelId:       string,
  input:         Record<string, unknown>,
  onSubProgress?: (pct: number, message: string) => void
): Promise<string> {
  // Distinguish queue wait from inference time — surfaces FAL congestion vs slow inference.
  const submittedAt = Date.now()
  let   inferenceLogged = false
  const data = await runFal(modelId, input, (update) => {
    if (update.status === 'IN_QUEUE') {
      const pos = update.position
      console.log(`[fal:${modelId}] in queue ${Math.round((Date.now() - submittedAt) / 1000)}s, position ${pos ?? '?'}`)
      onSubProgress?.(0, `Queued (position ${pos ?? '?'})`)
    } else if (update.status === 'IN_PROGRESS') {
      if (!inferenceLogged) {
        console.log(`[fal:${modelId}] inference started after ${Math.round((Date.now() - submittedAt) / 1000)}s queue`)
        inferenceLogged = true
      }
      onSubProgress?.(50, update.message ?? 'Generating…')
    }
  })
  console.log(`[fal:${modelId}] complete after ${Math.round((Date.now() - submittedAt) / 1000)}s total`)
  const url = extractVideoUrl(data) ?? extractImageUrl(data)
  if (!url) throw new Error(`fal model ${modelId} returned no video URL`)
  return url
}

const I2V_MODEL_IDS: Record<string, string> = {
  'kling-3.0':          'fal-ai/kling-video/v1.6/pro/image-to-video',
  'seedance-2.0':       'fal-ai/seedance-video-lite',
  'luma-ray3':          'fal-ai/luma-dream-machine/image-to-video',
  'minimax-2.3':        'fal-ai/minimax-video',
  'wan-2.2':            'fal-ai/wan/v2.2-a14b/image-to-video',
  'ltx-2.3':            'fal-ai/ltx-video-v0-9-7',
  'ltx-2.3-fast':       'fal-ai/ltx-video-v0-9-7',
  'pixverse-c1':        'fal-ai/pixverse/v4.5',
  'hunyuan-video-1.5':  'fal-ai/hunyuan-video',
  'skyreels-v3':        'fal-ai/skyreels-v2-i2v',
  'happyhorse-1.0':     'fal-ai/happyhorse-v1',
  'kling-o3':           'fal-ai/kling-video/v2/pro/image-to-video',
  'hailuo-2.3':         'fal-ai/minimax-video',
}

const T2V_MODEL_IDS: Record<string, string> = {
  'kling-3.0':          'fal-ai/kling-video/v1.6/pro/text-to-video',
  'seedance-2.0':       'fal-ai/seedance-video-lite',
  'luma-ray3':          'fal-ai/luma-dream-machine',
  'minimax-2.3':        'fal-ai/minimax-video',
  'wan-2.2':            'fal-ai/wan/v2.2-a14b/text-to-video',
  'ltx-2.3':            'fal-ai/ltx-video-v0-9-7',
  'ltx-2.3-fast':       'fal-ai/ltx-video-v0-9-7',
  'pixverse-c1':        'fal-ai/pixverse/v4.5',
  'hunyuan-video-1.5':  'fal-ai/hunyuan-video',
  'skyreels-v3':        'fal-ai/skyreels-v2-t2v',
  'runway-gen4':        'runway-gen4',
  'veo-3.1':            'fal-ai/veo3',
  'grok-imagine-video': 'grok-imagine-video',
  'sora-2':             'sora-2',   // sentinel — handled via Replicate, not FAL
  'happyhorse-1.0':     'fal-ai/happyhorse-v1',
  'kling-o3':           'fal-ai/kling-video/v2/pro/text-to-video',
  'hailuo-2.3':         'fal-ai/minimax-video',
}

export async function extractTailFrame(videoUrl: string): Promise<string> {
  const result = await runFal<{ image?: { url: string }; output_url?: string }>('fal-ai/ffmpeg', {
    video_url: videoUrl,
    command: 'extract_last_frame',
    output_format: 'jpg',
  })
  return extractImageUrl(result) ?? result.output_url ?? ''
}

async function pollXAIVideo(
  requestId:      string,
  onSubProgress?: import('./types').SubProgressFn
): Promise<string> {
  const MAX = 300   // 300 × 2s = 600s (10 min) — was 60 (120s)
  for (let i = 0; i < MAX; i++) {
    await new Promise(r => setTimeout(r, 2000))
    const res = await fetch(`https://api.x.ai/v1/videos/${requestId}`, {
      headers: { Authorization: `Bearer ${process.env.XAI_API_KEY}` },
    }).then(r => r.json())
    if (res.status === 'pending') {
      const pct = Math.min(90, Math.round((i / MAX) * 100))
      onSubProgress?.({ pct, message: `Grok Imagine generating ${pct}%`, vendor: 'xai' })
    } else if (res.status === 'done') {
      onSubProgress?.({ pct: 100, message: 'Grok Imagine complete', vendor: 'xai' })
      return res.video?.url
    } else if (res.status === 'failed') {
      throw new Error(`Grok Imagine failed: ${res.error}`)
    }
  }
  throw new Error('Grok Imagine timed out after 10 min')
}

async function pollReplicate(
  getUrl:         string,
  token:          string,
  onSubProgress?: import('./types').SubProgressFn
): Promise<string> {
  for (let i = 0; i < 600; i++) {   // 600 × 2s = 1200s (20 min)
    await new Promise(r => setTimeout(r, 2000))
    const res = await fetch(getUrl, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json())
    if (res.status === 'starting' || res.status === 'processing') {
      const pct = Math.min(90, Math.round((i / 600) * 100))
      onSubProgress?.({ pct, message: `Sora 2 generating ${pct}%`, vendor: 'replicate' })
    } else if (res.status === 'succeeded') {
      onSubProgress?.({ pct: 100, message: 'Sora 2 complete', vendor: 'replicate' })
      return Array.isArray(res.output) ? res.output[0] : res.output
    } else if (res.status === 'failed' || res.status === 'canceled') {
      throw new Error(`Sora 2 ${res.status}: ${res.error ?? 'unknown'}`)
    }
  }
  throw new Error('Sora 2 timed out after 20 min')
}

async function pollRunwayJob(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client:         any,
  taskId:         string,
  onSubProgress?: import('./types').SubProgressFn
): Promise<string> {
  for (let i = 0; i < 300; i++) {   // 300 × 3s = 900s (15 min) — was 100 (300s)
    await new Promise(r => setTimeout(r, 3000))
    const task = await client.tasks.retrieve(taskId)
    if (task.status === 'RUNNING') {
      const pct = Math.round((task.progress ?? 0.5) * 100)
      onSubProgress?.({ pct, message: `Runway rendering ${pct}%`, vendor: 'runway' })
    } else if (task.status === 'PENDING') {
      onSubProgress?.({ pct: 0, message: 'Runway queued', vendor: 'runway' })
    } else if (task.status === 'SUCCEEDED') {
      onSubProgress?.({ pct: 100, message: 'Runway complete', vendor: 'runway' })
      return task.output?.[0]
    } else if (task.status === 'FAILED') {
      throw new Error(`Runway failed: ${task.failure ?? 'unknown'}`)
    }
  }
  throw new Error('Runway timed out after 15 min')
}

export interface VideoModelParams {
  model:           string
  prompt:          string
  duration:        number
  imageUrl?:       string
  patientZeroUrl?: string
  onSubProgress?:  import('./types').SubProgressFn
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

  if (params.model === 'grok-imagine-video') {
    const res = await fetch('https://api.x.ai/v1/videos/generations', {
      method:  'POST',
      headers: { Authorization: `Bearer ${process.env.XAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model:        'grok-imagine-video',
        prompt:       params.prompt,
        duration:     Math.min(params.duration, 15),
        aspect_ratio: '16:9',
        ...(params.imageUrl ? { image_url: params.imageUrl } : {}),
      }),
    }).then(r => r.json())
    return await pollXAIVideo(res.request_id, params.onSubProgress)
  }

  if (params.model === 'sora-2') {
    const token = process.env.REPLICATE_API_TOKEN
    if (!token) throw new Error('sora-2 requires REPLICATE_API_TOKEN')
    const create = await fetch('https://api.replicate.com/v1/models/openai/sora-2/predictions', {
      method:  'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: {
          prompt:  params.prompt,
          seconds: Math.min(params.duration, 20),
          ...(params.imageUrl ? { input_image: params.imageUrl } : {}),
        },
      }),
    }).then(r => r.json())
    const getUrl = create.urls?.get ?? `https://api.replicate.com/v1/predictions/${create.id}`
    return await pollReplicate(getUrl, token, params.onSubProgress)
  }

  if (params.model === 'runway-gen4') {
    if (!params.imageUrl) throw new Error('runway-gen4 requires an image URL (I2V bridge)')
    const RunwayML = (await import('@runwayml/sdk')).default
    const client   = new RunwayML({ apiKey: process.env.RUNWAY_API_KEY! })
    const task     = await client.imageToVideo.create({
      model:        'gen4_turbo',
      promptText:   params.prompt,
      promptImage:  params.imageUrl,
      duration:     params.duration as 5 | 10,
      ratio:        '1280:720',
    })
    return await pollRunwayJob(client, task.id, params.onSubProgress)
  }

  const useI2V  = !!params.imageUrl
  const modelId = useI2V
    ? (I2V_MODEL_IDS[params.model] ?? T2V_MODEL_IDS[params.model])
    : T2V_MODEL_IDS[params.model]

  if (!modelId) throw new Error(`Unknown model: ${params.model}`)

  // Schema-driven payload: read the model's actual accepted inputs so a renamed
  // FAL param (aspect_ratio vs ratio, duration vs seconds, …) never silently fails.
  // Falls back to the canonical base payload when the schema is unavailable.
  const input = await buildPayload(modelId, {
    prompt:       params.prompt,
    duration:     params.duration,
    imageUrl:     useI2V ? params.imageUrl : undefined,
    referenceUrl: params.patientZeroUrl,
  })

  if (params.model.includes('ltx') && params.model.includes('fast')) input.quality = 'fast'

  return await callFalModel(modelId, input, (pct, message) =>
    params.onSubProgress?.({ pct, message, vendor: 'fal' })
  )
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
