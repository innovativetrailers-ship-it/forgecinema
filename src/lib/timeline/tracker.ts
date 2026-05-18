import { fal } from '../fal/client'
import { uploadToR2 } from '../storage/r2'
import { execSync } from 'child_process'
import { existsSync, mkdirSync, rmSync } from 'fs'
import { join } from 'path'
import { nanoid } from 'nanoid'

interface Point {
  x: number
  y: number
}

export interface TrackFrame {
  frame: number
  corners: [Point, Point, Point, Point]
  confidence: number
}

export type TrackData = TrackFrame[]

export async function trackPlanarRegion(params: {
  videoUrl: string
  regionOfInterest: { x: number; y: number; width: number; height: number }
  trackingMethod: 'translation' | 'affine' | 'perspective'
}): Promise<{ trackData: TrackData }> {
  const { videoUrl, regionOfInterest: roi, trackingMethod } = params

  // Use fal.ai CoTracker for robust point tracking
  const result = await fal.subscribe('fal-ai/cotracker', {
    input: {
      video_url: videoUrl,
      points: [
        [roi.x, roi.y],
        [roi.x + roi.width, roi.y],
        [roi.x + roi.width, roi.y + roi.height],
        [roi.x, roi.y + roi.height],
      ],
      tracking_method: trackingMethod,
    },
  }) as unknown as {
    tracks: Array<{
      frame: number
      points: Array<[number, number]>
      confidences: number[]
    }>
  }

  const trackData: TrackData = result.tracks.map((t) => ({
    frame: t.frame,
    corners: t.points.map((p, i) => ({
      x: p[0],
      y: p[1],
    })) as [Point, Point, Point, Point],
    confidence: Math.min(...t.confidences),
  }))

  return { trackData }
}

export async function replaceTrackedSurface(params: {
  videoUrl: string
  trackData: TrackData
  replacementImageUrl: string
  blendMode: string
}): Promise<{ compositedUrl: string }> {
  const { videoUrl, trackData, replacementImageUrl, blendMode } = params
  const jobId = nanoid()
  const tmpDir = `/tmp/surface-replace-${jobId}`
  const framesDir = join(tmpDir, 'frames')
  const outputDir = join(tmpDir, 'composited')
  mkdirSync(framesDir, { recursive: true })
  mkdirSync(outputDir, { recursive: true })

  try {
    // Extract frames
    execSync(`ffmpeg -i "${videoUrl}" "${framesDir}/frame%06d.png" -y 2>/dev/null`)

    // Download replacement image
    const replBuf = Buffer.from(await (await fetch(replacementImageUrl)).arrayBuffer())
    const replPath = join(tmpDir, 'replacement.png')
    require('fs').writeFileSync(replPath, replBuf)

    // Apply perspective transform per frame using FFmpeg
    for (const track of trackData) {
      const frameFile = `frame${String(track.frame + 1).padStart(6, '0')}.png`
      const framePath = join(framesDir, frameFile)
      const outFramePath = join(outputDir, frameFile)

      if (!existsSync(framePath)) continue

      const [tl, tr, br, bl] = track.corners
      // Compute perspective transform coefficients
      const srcPoints = `0:0:100:0:100:100:0:100`
      const dstPoints = `${tl.x}:${tl.y}:${tr.x}:${tr.y}:${br.x}:${br.y}:${bl.x}:${bl.y}`

      execSync(
        `ffmpeg -i "${framePath}" -i "${replPath}" -filter_complex "[1:v]perspective=x0=${tl.x}:y0=${tl.y}:x1=${tr.x}:y1=${tr.y}:x2=${bl.x}:y2=${bl.y}:x3=${br.x}:y3=${br.y}[warped];[0:v][warped]overlay=x=0:y=0" "${outFramePath}" -y 2>/dev/null`
      )

      void srcPoints
      void dstPoints
      void blendMode
    }

    // Copy any frames not in trackData
    execSync(`cp "${framesDir}"/*.png "${outputDir}"/ 2>/dev/null || true`)

    // Reassemble video
    const outputPath = join(tmpDir, 'composited.mp4')
    execSync(
      `ffmpeg -framerate 24 -i "${outputDir}/frame%06d.png" -i "${videoUrl}" -map 0:v -map 1:a? -c:v libx264 -crf 18 -c:a copy "${outputPath}" -y 2>/dev/null`
    )

    const buffer = execSync(`cat "${outputPath}"`)
    const compositedUrl = await uploadToR2(buffer, `surface-replace/${jobId}.mp4`, 'video/mp4')
    return { compositedUrl }
  } finally {
    if (existsSync(tmpDir)) rmSync(tmpDir, { recursive: true, force: true })
  }
}
