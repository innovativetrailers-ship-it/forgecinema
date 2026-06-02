// src/lib/orchestration/bridgedGeneration.ts
// FilmWeaver dual cache + tail-to-head keyframe bridging

import { uploadToR2 }                                    from '@/lib/storage/r2'
import { analyseFrameMotion, injectMotionContext }       from './opticalFlow'
import type { DAGNode, GeneratedSegment, PatientZeroAssets } from './types'

const FAL_KEY = () => process.env.FAL_API_KEY!

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
}

async function extractTailFrame(videoUrl: string): Promise<string> {
  const result = await fetch('https://fal.run/fal-ai/ffmpeg', {
    method:  'POST',
    headers: { Authorization: `Key ${FAL_KEY()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      input: { video_url: videoUrl, command: 'extract_last_frame', output_format: 'jpg' },
    }),
  }).then(r => r.json())
  return result.image?.url ?? result.output_url
}

async function pollXAIVideo(requestId: string): Promise<string> {
  for (let i = 0; i < 60; i++) {
    await new Promise(r => setTimeout(r, 2000))
    const res = await fetch(`https://api.x.ai/v1/videos/${requestId}`, {
      headers: { Authorization: `Bearer ${process.env.XAI_API_KEY}` },
    }).then(r => r.json())
    if (res.status === 'done')   return res.video?.url
    if (res.status === 'failed') throw new Error(`Grok Imagine failed: ${res.error}`)
  }
  throw new Error('Grok Imagine timed out')
}

async function pollRunwayJob(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: any,
  taskId: string
): Promise<string> {
  for (let i = 0; i < 60; i++) {
    await new Promise(r => setTimeout(r, 3000))
    const task = await client.tasks.retrieve(taskId)
    if (task.status === 'SUCCEEDED') return task.output?.[0]
    if (task.status === 'FAILED')    throw new Error(`Runway failed: ${task.failure}`)
  }
  throw new Error('Runway timed out')
}

async function callVideoModel(params: {
  model:           string
  prompt:          string
  duration:        number
  imageUrl?:       string
  patientZeroUrl?: string
}): Promise<string> {

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
    return await pollXAIVideo(res.request_id)
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
    return await pollRunwayJob(client, task.id)
  }

  const useI2V  = !!params.imageUrl
  const modelId = useI2V
    ? (I2V_MODEL_IDS[params.model] ?? T2V_MODEL_IDS[params.model])
    : T2V_MODEL_IDS[params.model]

  if (!modelId) throw new Error(`Unknown model: ${params.model}`)

  const input: Record<string, unknown> = {
    prompt:       params.prompt,
    duration:     params.duration,
    aspect_ratio: '16:9',
    resolution:   '1080p',
  }

  if (useI2V)                   input.image_url           = params.imageUrl
  if (params.patientZeroUrl)    input.reference_image_url = params.patientZeroUrl
  if (params.model.includes('ltx') && params.model.includes('fast')) input.quality = 'fast'

  const result = await fetch(`https://fal.run/${modelId}`, {
    method:  'POST',
    headers: { Authorization: `Key ${FAL_KEY()}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify({ input }),
  }).then(r => r.json())

  return result.video?.url ?? result.video_url
}

export async function generateWithBridging(
  dag:        DAGNode[],
  assets:     PatientZeroAssets,
  onProgress: (shotIndex: number, status: string) => void
): Promise<GeneratedSegment[]> {

  const results: GeneratedSegment[] = []
  const shotMemoryCache: string[]   = []

  for (const node of dag) {
    onProgress(node.shot.shotIndex, 'generating')

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
        onProgress(node.shot.shotIndex, 'bridging')
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
    const MAX_RETRIES = 2

    while (retryCount <= MAX_RETRIES) {
      try {
        videoUrl = await callVideoModel({
          model:           node.assignedModel,
          prompt,
          duration:        node.shot.duration,
          imageUrl:        tailFrameUrl,
          patientZeroUrl:  characterRef,
        })
        break
      } catch (err: unknown) {
        retryCount++
        const msg = err instanceof Error ? err.message : String(err)
        console.warn(`[orchestration] shot ${node.shot.shotIndex} attempt ${retryCount} failed:`, msg)
        if (retryCount > MAX_RETRIES) {
          videoUrl = await callVideoModel({ model: 'ltx-2.3-fast', prompt, duration: node.shot.duration })
        }
        await new Promise(r => setTimeout(r, 2000 * retryCount))
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
      tailFrameUrl: tailFrameUrl ?? '',
      qualityScore: 1.0,
      retryCount,
    })
    onProgress(node.shot.shotIndex, 'complete')
  }

  return results
}
