import { fal } from '../fal/client'
import { uploadToR2 } from '../storage/r2'
import { db } from '../db'

type CaptureMode = 'face_only' | 'body_face' | 'full_body_hands'

export async function capturePerformance(params: {
  webcamVideoUrl: string
  targetCharacterId: string
  captureMode: CaptureMode
}): Promise<string> {
  const { webcamVideoUrl, targetCharacterId, captureMode } = params

  // 1. DWPose full skeleton extraction (133 keypoints)
  const dwposeResult = await fal.subscribe('fal-ai/dwpose', {
    input: {
      video_url: webcamVideoUrl,
      include_hands: captureMode === 'full_body_hands',
      include_face: captureMode !== 'face_only',
    },
  }) as unknown as { pose_video_url: string; keypoints: unknown[] }

  // 2. Get target character reference from vault
  const character = await db.vaultCharacter.findUnique({
    where: { id: targetCharacterId },
    select: { referenceUrls: true, loraModelId: true },
  })

  if (!character) throw new Error('Character not found in vault')

  const referenceImageUrl = character.referenceUrls[0]

  // 3. Apply pose to character via ControlNet
  const animResult = await fal.subscribe('fal-ai/controlnet', {
    input: {
      prompt: `Full body animated character, matching pose from reference`,
      image_url: referenceImageUrl,
      control_image_url: dwposeResult.pose_video_url,
      control_type: 'pose',
      lora_weights: character.loraModelId ?? undefined,
    },
  }) as unknown as { video: { url: string } }

  // 4. LivePortrait facial expression overlay
  let finalVideoUrl = animResult.video.url
  if (captureMode === 'body_face' || captureMode === 'full_body_hands') {
    const livePortraitResult = await fal.subscribe('fal-ai/live-portrait', {
      input: {
        source_image_url: referenceImageUrl,
        driving_video_url: webcamVideoUrl,
      },
    }) as unknown as { video: { url: string } }
    finalVideoUrl = livePortraitResult.video.url
  }

  return finalVideoUrl
}
