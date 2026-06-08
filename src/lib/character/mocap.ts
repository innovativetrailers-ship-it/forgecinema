import { fal } from '@/lib/fal/client'
import {
  buildMocapPrompt,
  clampMocapStrength,
  type MocapDrawMode,
  type MocapResolution,
} from './characterMotion'

const DWPOSE_ENDPOINT = 'fal-ai/dwpose/video'
const HUNYUAN_V2V_ENDPOINT = 'fal-ai/hunyuan-video/video-to-video'

function extractVideoUrl(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null
  const d = data as Record<string, unknown>
  const video = d.video as { url?: string } | undefined
  if (video?.url) return video.url
  if (typeof d.video_url === 'string') return d.video_url
  if (typeof d.pose_video_url === 'string') return d.pose_video_url
  if (typeof d.url === 'string') return d.url
  return null
}

async function pollFal(endpoint: string, requestId: string): Promise<unknown> {
  const deadline = Date.now() + 20 * 60 * 1000
  for (;;) {
    if (Date.now() > deadline) throw new Error('Motion capture timed out.')
    await new Promise((r) => setTimeout(r, 3000))
    const status = (await fal.queue.status(endpoint, { requestId, logs: false })) as { status: string }
    if (status.status === 'COMPLETED') break
    if (status.status === 'FAILED') throw new Error('Motion capture failed.')
  }
  const result = (await fal.queue.result(endpoint, { requestId })) as { data: unknown }
  return result.data
}

async function submitAndPoll(endpoint: string, input: Record<string, unknown>): Promise<unknown> {
  const submitted = (await fal.queue.submit(endpoint, { input })) as { request_id: string }
  return pollFal(endpoint, submitted.request_id)
}

export async function extractPoseVideo(motionVideoUrl: string, drawMode: MocapDrawMode): Promise<string> {
  const data = await submitAndPoll(DWPOSE_ENDPOINT, {
    video_url: motionVideoUrl,
    draw_mode: drawMode,
  })
  const poseUrl = extractVideoUrl(data)
  if (!poseUrl) throw new Error('DWPose returned no pose video.')
  return poseUrl
}

export async function animatePortraitWithMotion(
  portraitUrl: string,
  motionVideoUrl: string,
  opts: {
    drawMode?: MocapDrawMode
    resolution?: MocapResolution
    strength?: number
    prompt?: string
    portraitLabel?: string
  } = {},
): Promise<string> {
  const drawMode: MocapDrawMode = opts.drawMode ?? 'body-pose'
  const resolution: MocapResolution = opts.resolution ?? '720p'
  const strength = clampMocapStrength(opts.strength)
  const prompt = buildMocapPrompt(opts.portraitLabel ?? 'character', opts.prompt)

  const poseVideoUrl = await extractPoseVideo(motionVideoUrl, drawMode)
  const animData = await submitAndPoll(HUNYUAN_V2V_ENDPOINT, {
    prompt,
    video_url: poseVideoUrl,
    resolution,
    strength,
    enable_safety_checker: true,
    image_url: portraitUrl,
  })

  const outUrl = extractVideoUrl(animData)
  if (!outUrl) throw new Error('Hunyuan motion transfer returned no video.')
  return outUrl
}
