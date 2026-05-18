/**
 * Native TypeScript implementations of professional interchange formats.
 * No Python microservice needed — runs in Node.js directly.
 * Covers: CMX 3600 EDL, FCP XML 1.10, DaVinci Resolve XML (xmeml v5)
 */

import type { TimelineRecipe, Clip } from '../timeline/schema'

// ── CMX 3600 EDL Export ─────────────────────────────────────────────────────
// Universal format accepted by Avid Media Composer, DaVinci Resolve, Premiere,
// Final Cut Pro. No dependencies required.

export function exportEDL(recipe: TimelineRecipe): string {
  const fps = recipe.fps
  const videoTrack = recipe.tracks.find(t => t.type === 'video')
  if (!videoTrack) throw new Error('No video track found in timeline')

  const lines: string[] = [
    `TITLE: ${recipe.projectId}`,
    `FCM: NON-DROP FRAME`,
    '',
  ]

  let eventNum = 1
  for (const clip of [...videoTrack.clips].sort((a, b) => a.startTime - b.startTime)) {
    const srcStart = formatTimecode(0, fps)
    const srcEnd = formatTimecode(clip.endTime - clip.startTime, fps)
    const recStart = formatTimecode(clip.startTime, fps)
    const recEnd = formatTimecode(clip.endTime, fps)

    lines.push(
      `${String(eventNum).padStart(3, '0')}  ${clipName(clip)}  V  C  ${srcStart} ${srcEnd} ${recStart} ${recEnd}`
    )
    if (clip.prompt) {
      lines.push(`* FROM CLIP NAME: ${clip.prompt.substring(0, 60)}`)
    }
    if (clip.modelUsed) {
      lines.push(`* CINEMA MODEL: ${clip.modelUsed}`)
    }
    lines.push('')
    eventNum++
  }

  return lines.join('\n')
}

// ── Final Cut Pro XML (FCPXML 1.10) ─────────────────────────────────────────
// Accepted by Final Cut Pro X, DaVinci Resolve, Compressor, and many others.

export function exportFCPXML(recipe: TimelineRecipe): string {
  const fps = recipe.fps
  const w = recipe.resolution?.width ?? 1920
  const h = recipe.resolution?.height ?? 1080
  const frameDuration = `${Math.round(1000 / fps)}/1000s`
  const colorSpace = recipe.colorSpace === 'dci-p3' ? 'DCI-P3 D65' : 'ITU-R BT.709'

  const allClips = recipe.tracks.flatMap(t => t.clips)

  const assetElements = allClips
    .map(
      clip => `    <asset id="r${clip.id}" name="${escapeXML(clip.prompt?.substring(0, 40) ?? clip.id)}" src="${escapeXML(clip.sourceUrl)}" start="0s" duration="${formatFCPDuration(clip.endTime - clip.startTime, fps)}" hasVideo="1" hasAudio="1" />`
    )
    .join('\n')

  const spineClips = recipe.tracks
    .flatMap(t =>
      [...t.clips]
        .sort((a, b) => a.startTime - b.startTime)
        .map(
          clip => `          <asset-clip name="${escapeXML(clip.prompt?.substring(0, 40) ?? clip.id)}" ref="r${clip.id}" offset="${formatFCPDuration(clip.startTime, fps)}" duration="${formatFCPDuration(clip.endTime - clip.startTime, fps)}" start="0s"><note>${escapeXML(clip.modelUsed ?? '')}</note></asset-clip>`
        )
    )
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE fcpxml>
<fcpxml version="1.10">
<resources>
  <format id="r0" name="FFVideoFormat${w}x${h}" frameDuration="${frameDuration}" width="${w}" height="${h}" colorSpace="${colorSpace}"/>
${assetElements}
</resources>
<library>
  <event name="CINÉMA Export">
    <project name="${escapeXML(recipe.projectId)}">
      <sequence format="r0" duration="${recipe.durationSeconds}s" tcStart="0s" tcFormat="NDF" audioLayout="stereo">
        <spine>
${spineClips}
        </spine>
      </sequence>
    </project>
  </event>
</library>
</fcpxml>`
}

// ── DaVinci Resolve XML (xmeml v5) ──────────────────────────────────────────
// Native import format for DaVinci Resolve Free and Studio.

export function exportDaVinciXML(recipe: TimelineRecipe): string {
  const fps = recipe.fps
  const w = recipe.resolution?.width ?? 1920
  const h = recipe.resolution?.height ?? 1080
  const totalFrames = Math.round(recipe.durationSeconds * fps)

  const videoTracks = recipe.tracks.filter(t => t.type === 'video')
  const audioTracks = recipe.tracks.filter(t => t.type !== 'video' && t.type !== 'vfx')

  const renderVideoTracks = videoTracks
    .map(track => `
        <track>
          ${[...track.clips]
            .sort((a, b) => a.startTime - b.startTime)
            .map(
              clip => `
          <clipitem id="${clip.id}">
            <name>${escapeXML(clip.prompt?.substring(0, 40) ?? clip.id)}</name>
            <start>${Math.round(clip.startTime * fps)}</start>
            <end>${Math.round(clip.endTime * fps)}</end>
            <in>0</in>
            <out>${Math.round((clip.endTime - clip.startTime) * fps)}</out>
            <file><pathurl>${escapeXML(clip.sourceUrl)}</pathurl></file>
          </clipitem>`
            )
            .join('')}
        </track>`)
    .join('')

  const renderAudioTracks = audioTracks
    .map(track => `
        <track>
          ${[...track.clips]
            .sort((a, b) => a.startTime - b.startTime)
            .map(
              clip => `
          <clipitem id="${clip.id}_a">
            <name>${escapeXML(clip.prompt?.substring(0, 40) ?? clip.id)}</name>
            <start>${Math.round(clip.startTime * fps)}</start>
            <end>${Math.round(clip.endTime * fps)}</end>
            <in>0</in>
            <out>${Math.round((clip.endTime - clip.startTime) * fps)}</out>
            <file><pathurl>${escapeXML(clip.sourceUrl)}</pathurl></file>
          </clipitem>`
            )
            .join('')}
        </track>`)
    .join('')

  return `<?xml version="1.0" encoding="UTF-8"?>
<xmeml version="5">
  <sequence>
    <name>CINÉMA Export</name>
    <duration>${totalFrames}</duration>
    <rate>
      <timebase>${fps}</timebase>
      <ntsc>FALSE</ntsc>
    </rate>
    <media>
      <video>
        <format>
          <samplecharacteristics>
            <width>${w}</width>
            <height>${h}</height>
          </samplecharacteristics>
        </format>
        ${renderVideoTracks}
      </video>
      <audio>
        ${renderAudioTracks}
      </audio>
    </media>
  </sequence>
</xmeml>`
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatTimecode(seconds: number, fps: number): string {
  const totalFrames = Math.round(seconds * fps)
  const f = totalFrames % fps
  const s = Math.floor(totalFrames / fps) % 60
  const m = Math.floor(totalFrames / fps / 60) % 60
  const hh = Math.floor(totalFrames / fps / 3600)
  return `${pad(hh)}:${pad(m)}:${pad(s)}:${pad(f)}`
}

function formatFCPDuration(seconds: number, fps: number): string {
  const frames = Math.round(seconds * fps)
  return `${frames}/${fps}s`
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function escapeXML(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function clipName(clip: Clip): string {
  return (clip.id || 'clip')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '_')
    .substring(0, 8)
    .padEnd(8)
}
