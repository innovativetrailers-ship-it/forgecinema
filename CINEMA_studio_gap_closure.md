# CINÉMA — STUDIO GAP CLOSURE
## Cursor Implementation Prompt: The Four Gaps to Full Hollywood Pipeline Parity

> This prompt closes the 4 gaps identified in the studio readiness audit. After implementing every item here, CINÉMA participates in the complete Hollywood post-production pipeline — AAF handoffs, Pro Tools audio sessions, IMF streaming delivery, ShotGrid production tracking, and deep compositing. Build everything. No stubs.

---

## GAP 1 — INTERCHANGE & PIPELINE HANDOFF (PRIORITY: CRITICAL)

### Install dependencies

```bash
pip install opentimelineio opentimelineio-contrib
npm install xml2js archiver uuid
```

Create a Python microservice that runs alongside the Next.js app:

```bash
# src/services/otio_service.py
# Runs on port 7432 — called by Node.js via HTTP
pip install flask opentimelineio
```

### `src/services/otio_service.py`

```python
from flask import Flask, request, jsonify, send_file
import opentimelineio as otio
import json, os, tempfile

app = Flask(__name__)

@app.route('/convert', methods=['POST'])
def convert():
    data = request.json
    timeline_json = data['timeline']       # CINÉMA TimelineRecipe JSON
    output_format = data['format']         # 'edl' | 'fcpxml' | 'aaf' | 'resolve_xml' | 'otioz'
    
    # Build OTIO timeline from CINÉMA recipe
    timeline = build_otio_from_cinema(timeline_json)
    
    # Export to requested format
    tmp = tempfile.NamedTemporaryFile(suffix=get_extension(output_format), delete=False)
    otio.adapters.write_to_file(timeline, tmp.name, format=output_format)
    return send_file(tmp.name, as_attachment=True, download_name=f"export.{get_extension(output_format)}")

@app.route('/import', methods=['POST'])
def import_timeline():
    file = request.files['file']
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1])
    file.save(tmp.name)
    timeline = otio.adapters.read_from_file(tmp.name)
    return jsonify(otio_to_cinema(timeline))

def build_otio_from_cinema(recipe):
    timeline = otio.schema.Timeline(name=recipe.get('title', 'CINÉMA Export'))
    timeline.global_start_time = otio.opentime.RationalTime(0, recipe.get('fps', 24))
    
    for track in recipe.get('tracks', []):
        track_kind = otio.schema.TrackKind.Video if track['type'] == 'video' else otio.schema.TrackKind.Audio
        otio_track = otio.schema.Track(name=track['label'], kind=track_kind)
        
        for clip in sorted(track.get('clips', []), key=lambda c: c['startTime']):
            rate = recipe.get('fps', 24)
            start = otio.opentime.RationalTime(clip['startTime'] * rate, rate)
            duration = otio.opentime.RationalTime((clip['endTime'] - clip['startTime']) * rate, rate)
            
            media_ref = otio.schema.ExternalReference(
                target_url=clip.get('sourceUrl', ''),
                available_range=otio.opentime.TimeRange(
                    otio.opentime.RationalTime(0, rate),
                    duration
                )
            )
            otio_clip = otio.schema.Clip(
                name=clip.get('prompt', 'clip')[:40],
                media_reference=media_ref,
                source_range=otio.opentime.TimeRange(
                    otio.opentime.RationalTime(0, rate),
                    duration
                )
            )
            # Add gaps between clips for timeline accuracy
            if otio_track.children:
                last_end = otio_track.children[-1].trimmed_range().end_time_exclusive()
                if start > last_end:
                    gap = otio.schema.Gap(
                        source_range=otio.opentime.TimeRange(
                            otio.opentime.RationalTime(0, rate),
                            start - last_end
                        )
                    )
                    otio_track.append(gap)
            otio_track.append(otio_clip)
        timeline.tracks.append(otio_track)
    return timeline

def otio_to_cinema(otio_timeline):
    """Convert imported OTIO timeline back to CINÉMA TimelineRecipe JSON"""
    tracks = []
    fps = 24
    if otio_timeline.global_start_time:
        fps = otio_timeline.global_start_time.rate
    
    for i, track in enumerate(otio_timeline.tracks):
        clips = []
        for item in track.children:
            if isinstance(item, otio.schema.Clip):
                range_in_parent = item.range_in_parent()
                clip = {
                    'id': f'imported_{i}_{len(clips)}',
                    'trackId': f'track_{i}',
                    'startTime': range_in_parent.start_time.value / fps,
                    'endTime': range_in_parent.end_time_exclusive().value / fps,
                    'sourceUrl': item.media_reference.target_url if hasattr(item.media_reference, 'target_url') else '',
                    'prompt': item.name,
                }
                clips.append(clip)
        tracks.append({
            'id': f'track_{i}',
            'type': 'video' if track.kind == otio.schema.TrackKind.Video else 'audio',
            'label': track.name or f'Track {i+1}',
            'clips': clips
        })
    return {'fps': int(fps), 'tracks': tracks}

def get_extension(fmt):
    return {'edl': 'edl', 'fcpxml': 'xml', 'aaf': 'aaf', 'resolve_xml': 'xml', 'otioz': 'otioz'}.get(fmt, 'xml')

if __name__ == '__main__':
    app.run(port=7432, debug=False)
```

### `src/lib/interchange/OTIOClient.ts`

```typescript
// Node.js client that calls the Python OTIO microservice

export type InterchangeFormat = 'edl' | 'fcpxml' | 'aaf' | 'resolve_xml' | 'otioz'

const OTIO_SERVICE = process.env.OTIO_SERVICE_URL || 'http://localhost:7432'

export async function exportTimeline(params: {
  recipe: TimelineRecipe
  format: InterchangeFormat
  filename: string
}): Promise<Buffer> {
  const response = await fetch(`${OTIO_SERVICE}/convert`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      timeline: params.recipe,
      format: params.format,
    }),
  })
  if (!response.ok) throw new Error(`OTIO export failed: ${response.statusText}`)
  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

export async function importTimeline(file: File): Promise<TimelineRecipe> {
  const formData = new FormData()
  formData.append('file', file)
  const response = await fetch(`${OTIO_SERVICE}/import`, {
    method: 'POST',
    body: formData,
  })
  if (!response.ok) throw new Error(`OTIO import failed: ${response.statusText}`)
  return response.json()
}
```

### `src/lib/interchange/NativeFormats.ts`

Implement EDL and FCP XML natively in Node.js for speed (no Python call needed for these):

```typescript
import { TimelineRecipe, Shot } from '../swarm/types'

// ── CMX 3600 EDL Export ────────────────────────────────────
// The most universal exchange format — accepted by Avid, Premiere, Final Cut, DaVinci
export function exportEDL(recipe: TimelineRecipe): string {
  const fps = recipe.fps
  const videoTrack = recipe.tracks.find(t => t.type === 'video')
  if (!videoTrack) throw new Error('No video track')

  const lines: string[] = [
    `TITLE: ${recipe.project_id}`,
    `FCM: NON-DROP FRAME`,
    '',
  ]

  let eventNum = 1
  videoTrack.clips.forEach(clip => {
    const srcStart = formatTimecode(0, fps)
    const srcEnd = formatTimecode(clip.endTime - clip.startTime, fps)
    const recStart = formatTimecode(clip.startTime, fps)
    const recEnd = formatTimecode(clip.endTime, fps)

    lines.push(`${String(eventNum).padStart(3, '0')}  ${clipName(clip)}  V  C  ${srcStart} ${srcEnd} ${recStart} ${recEnd}`)
    if (clip.prompt) {
      lines.push(`* FROM CLIP NAME: ${clip.prompt.substring(0, 60)}`)
      lines.push(`* CINEMA MODEL: ${clip.modelUsed ?? 'unknown'}`)
    }
    lines.push('')
    eventNum++
  })

  return lines.join('\n')
}

// ── Final Cut Pro XML (FCPXML 1.10) ────────────────────────
// Accepted by Final Cut Pro, DaVinci Resolve, and many others
export function exportFCPXML(recipe: TimelineRecipe): string {
  const fps = recipe.fps
  const frameDuration = `${Math.round(1000/fps * 100) / 100}s`

  const clipElements = recipe.tracks
    .flatMap(track =>
      track.clips.map(clip => {
        const start = `${Math.round(clip.startTime * fps)}/${fps}s`
        const dur = `${Math.round((clip.endTime - clip.startTime) * fps)}/${fps}s`
        return `
          <asset-clip name="${escapeXML(clip.prompt?.substring(0, 40) ?? 'clip')}"
            ref="r${clip.id}" offset="${start}" duration="${dur}"
            start="${start}">
            <note>${escapeXML(clip.modelUsed ?? '')}</note>
          </asset-clip>`
      })
    ).join('')

  const assetElements = recipe.tracks
    .flatMap(t => t.clips)
    .map(clip => `
      <asset id="r${clip.id}" name="${escapeXML(clip.prompt?.substring(0, 40) ?? 'clip')}"
        src="${escapeXML(clip.sourceUrl)}" start="0s" duration="3600s"
        hasVideo="1" hasAudio="1" />`)
    .join('')

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE fcpxml>
<fcpxml version="1.10">
<resources>
  <format id="r0" name="FFVideoFormat${recipe.resolution?.width ?? 1920}x${recipe.resolution?.height ?? 1080}" frameDuration="${frameDuration}" width="${recipe.resolution?.width ?? 1920}" height="${recipe.resolution?.height ?? 1080}" colorSpace="${recipe.colorSpace ?? 'Rec. 709'}"/>
  ${assetElements}
</resources>
<library>
  <event name="CINÉMA Export">
    <project name="Export">
      <sequence format="r0" duration="${recipe.durationSeconds}s" tcStart="0s" tcFormat="NDF" audioLayout="stereo">
        <spine>${clipElements}</spine>
      </sequence>
    </project>
  </event>
</library>
</fcpxml>`
}

// ── DaVinci Resolve XML ─────────────────────────────────────
export function exportDaVinciXML(recipe: TimelineRecipe): string {
  const fps = recipe.fps
  return `<?xml version="1.0" encoding="UTF-8"?>
<xmeml version="5">
  <sequence>
    <name>CINÉMA Export</name>
    <duration>${Math.round(recipe.durationSeconds * fps)}</duration>
    <rate><timebase>${fps}</timebase><ntsc>FALSE</ntsc></rate>
    <media>
      <video>
        <format>
          <samplecharacteristics>
            <width>${recipe.resolution?.width ?? 1920}</width>
            <height>${recipe.resolution?.height ?? 1080}</height>
          </samplecharacteristics>
        </format>
        ${recipe.tracks.filter(t => t.type === 'video').map(track => `
        <track>
          ${track.clips.map(clip => `
          <clipitem>
            <name>${escapeXML(clip.prompt?.substring(0, 40) ?? 'clip')}</name>
            <start>${Math.round(clip.startTime * fps)}</start>
            <end>${Math.round(clip.endTime * fps)}</end>
            <in>0</in>
            <out>${Math.round((clip.endTime - clip.startTime) * fps)}</out>
            <file><pathurl>${escapeXML(clip.sourceUrl)}</pathurl></file>
          </clipitem>`).join('')}
        </track>`).join('')}
      </video>
    </media>
  </sequence>
</xmeml>`
}

// ── Helpers ─────────────────────────────────────────────────
function formatTimecode(seconds: number, fps: number): string {
  const totalFrames = Math.round(seconds * fps)
  const f = totalFrames % fps
  const s = Math.floor(totalFrames / fps) % 60
  const m = Math.floor(totalFrames / fps / 60) % 60
  const h = Math.floor(totalFrames / fps / 3600)
  return `${pad(h)}:${pad(m)}:${pad(s)}:${pad(f)}`
}
function pad(n: number): string { return String(n).padStart(2, '0') }
function escapeXML(s: string): string { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;') }
function clipName(clip: any): string { return (clip.id || 'clip').toUpperCase().replace(/[^A-Z0-9]/g, '_').substring(0, 8).padEnd(8) }
```

### API endpoints

**`src/app/api/interchange/export/route.ts`**
```typescript
// POST { projectId, format: 'edl'|'fcpxml'|'aaf'|'resolve_xml'|'otioz' }
// Returns file download
// For edl, fcpxml, resolve_xml: use NativeFormats (fast, no Python)
// For aaf, otioz: call OTIO microservice
```

**`src/app/api/interchange/import/route.ts`**
```typescript
// POST multipart: file (.edl, .xml, .fcpxml, .aaf, .otioz)
// Returns TimelineRecipe JSON
// Detect format by extension, route accordingly
// For edl/xml: parse natively; for aaf/otioz: call OTIO microservice
```

### UI — Export Dialog additions

Add to the existing Export Dialog, a new "Professional handoff" section:

```tsx
<ExportSection title="Professional interchange">
  <InterchangeFormatGrid>
    <FormatCard
      format="edl"
      label="EDL (CMX 3600)"
      note="Avid, Premiere, Final Cut, DaVinci"
      icon="edl"
      onClick={() => exportInterchange('edl')}
    />
    <FormatCard
      format="fcpxml"
      label="FCP XML"
      note="Final Cut Pro, DaVinci Resolve"
      icon="fcp"
      onClick={() => exportInterchange('fcpxml')}
    />
    <FormatCard
      format="resolve_xml"
      label="DaVinci XML"
      note="DaVinci Resolve native"
      icon="davinci"
      onClick={() => exportInterchange('resolve_xml')}
    />
    <FormatCard
      format="aaf"
      label="AAF"
      note="Avid Media Composer, Pro Tools"
      icon="avid"
      badge="Studio+"
      onClick={() => exportInterchange('aaf')}
    />
    <FormatCard
      format="otioz"
      label="OTIOZ Bundle"
      note="OpenTimelineIO portable archive"
      icon="otio"
      onClick={() => exportInterchange('otioz')}
    />
  </InterchangeFormatGrid>
</ExportSection>

// Also add: Import from timeline
<ImportSection title="Import timeline">
  <FileDropzone
    accept=".edl,.xml,.fcpxml,.aaf,.otioz"
    label="Drop an EDL, FCP XML, AAF, or OTIOZ to import into CINÉMA"
    onDrop={handleInterchangeImport}
  />
</ImportSection>
```

---

## GAP 2 — PRO TOOLS AUDIO COMPATIBILITY

### Install dependencies

```bash
npm install wav node-wav
pip install soundfile  # for BWF metadata writing
```

### `src/lib/audio/ProToolsExport.ts`

```typescript
import fs from 'fs/promises'
import path from 'path'
import { execSync } from 'child_process'
import { r2 } from '../storage/r2'
import type { TimelineRecipe } from '../swarm/types'

// ── BWF (Broadcast Wave Format) with SMPTE timecode ─────────
// Pro Tools, Avid, and all professional DAWs natively read BWF
export async function exportBWF(params: {
  audioUrl: string
  timecodeStart: number    // seconds from timeline start
  fps: number
  sampleRate: 48000 | 96000
  bitDepth: 16 | 24 | 32
  description?: string
  originatorRef?: string
}): Promise<string> {  // returns R2 URL of BWF file
  const tmp = await import('os').then(os => os.tmpdir())
  const inputPath = path.join(tmp, `bwf_input_${Date.now()}.wav`)
  const outputPath = path.join(tmp, `bwf_output_${Date.now()}.wav`)

  // Download source audio
  const resp = await fetch(params.audioUrl)
  await fs.writeFile(inputPath, Buffer.from(await resp.arrayBuffer()))

  // Convert to BWF with SMPTE timecode embedding
  // BWF adds a bext chunk with timecode, description, and originator info
  const timecodeFrames = Math.round(params.timecodeStart * params.fps)
  const timeRef = Math.round(params.timecodeStart * params.sampleRate)

  execSync([
    'ffmpeg', '-y', '-i', `"${inputPath}"`,
    '-ar', params.sampleRate.toString(),
    `-sample_fmt`, params.bitDepth === 16 ? 's16' : params.bitDepth === 24 ? 's32' : 'flt',
    '-c:a', 'pcm_s24le',
    // Embed BWF bext chunk
    '-metadata', `description="${params.description ?? 'CINÉMA Export'}"`,
    '-metadata', `originator="CINEMA"`,
    '-metadata', `originator_reference="${params.originatorRef ?? Date.now()}"`,
    '-metadata', `time_reference=${timeRef}`,
    '-rf64', 'auto',  // RF64 for files > 4GB
    `"${outputPath}"`,
  ].join(' '))

  const url = await r2.uploadFile(outputPath, `pro_tools/bwf_${Date.now()}.wav`)
  await fs.unlink(inputPath).catch(() => {})
  await fs.unlink(outputPath).catch(() => {})
  return url
}

// ── Stem delivery package ────────────────────────────────────
// The professional standard for delivering a finished mix
// Each bus rendered as a separate stereo/5.1 file
export interface StemPackage {
  dialogue: string        // BWF URL
  music: string           // BWF URL
  sfx: string             // BWF URL
  atmos?: string          // Dolby Atmos ADM BWF (if enabled)
  mx?: string             // M&E (Music & Effects) — no dialogue
  full_mix: string        // Full mix BWF
}

export async function renderStemPackage(params: {
  recipe: TimelineRecipe
  fps: number
  sampleRate: 48000 | 96000
  bitDepth: 16 | 24 | 32
  deliveryFormat: 'stereo' | '5.1' | '7.1' | 'atmos'
}): Promise<StemPackage>
// For each stem type: mix only the relevant tracks via FFmpeg
// then export as BWF with correct timecode offset
// Dialogue bus = all VOICE tracks
// Music bus = all MUSIC tracks
// SFX bus = all SFX tracks
// M&E = Music + SFX (no Dialogue) — required for international versioning
// Full mix = all tracks summed

// ── OMF Export (for Pro Tools import) ───────────────────────
// OMF is the legacy format but still widely used for Pro Tools handoff
export async function exportOMF(params: {
  recipe: TimelineRecipe
  embedMedia: boolean      // if true, audio is embedded in OMF; if false, just references
  handleLength: number     // seconds of media handles on each side of edit
}): Promise<string> {  // R2 URL of .omf file
  // Use FFmpeg with OMF muxer (limited but functional)
  // For full OMF with embedded media: use the avcodec omf muxer
  // Returns download URL
}

// ── Pro Tools session XML ────────────────────────────────────
// Some workflows use Pro Tools Session XML for handoff
export function exportProToolsSessionXML(recipe: TimelineRecipe): string {
  const audioTracks = recipe.tracks.filter(t => t.type === 'audio' || t.type === 'voice' || t.type === 'music' || t.type === 'sfx')
  return `<?xml version="1.0" encoding="UTF-8"?>
<ProToolsSession version="11">
  <SessionInfo>
    <Name>CINÉMA Export</Name>
    <SampleRate>${48000}</SampleRate>
    <BitDepth>24</BitDepth>
    <TimeCodeRate>${recipe.fps}</TimeCodeRate>
  </SessionInfo>
  <AudioFiles>
    ${audioTracks.flatMap(t => t.clips).map(clip => `
    <AudioFile>
      <Name>${clip.id}.wav</Name>
      <Path>${clip.sourceUrl}</Path>
    </AudioFile>`).join('')}
  </AudioFiles>
  <Tracks>
    ${audioTracks.map((track, i) => `
    <Track number="${i + 1}" name="${track.label}" type="Audio">
      ${track.clips.map(clip => `
      <Region start="${Math.round(clip.startTime * 48000)}" end="${Math.round(clip.endTime * 48000)}" file="${clip.id}.wav" />`).join('')}
    </Track>`).join('')}
  </Tracks>
</ProToolsSession>`
}
```

### API + UI

**`src/app/api/audio/stems/route.ts`** — POST to trigger stem render, returns SSE progress

In the Export Dialog, add:

```tsx
<ExportSection title="Audio delivery">
  <StemExportPanel>
    <SampleRateSelector options={[48000, 96000]} />
    <BitDepthSelector options={[16, 24, 32]} />
    <DeliveryFormatSelector options={['Stereo', '5.1', '7.1', 'Dolby Atmos']} />
    <HandleLength label="Media handles" unit="seconds" min={0} max={10} default={2} />
    <StemGrid>
      <StemToggle id="dialogue" label="Dialogue stem" default={true} />
      <StemToggle id="music" label="Music stem" default={true} />
      <StemToggle id="sfx" label="SFX stem" default={true} />
      <StemToggle id="mx" label="M&E (Music & Effects)" default={true} />
      <StemToggle id="atmos" label="Dolby Atmos ADM" badge="Studio+" default={false} />
      <StemToggle id="full_mix" label="Full mix" default={true} />
    </StemGrid>
    <Button onClick={renderStems} variant="teal">Render stems  ·  <StemCost /></Button>
  </StemExportPanel>

  <Separator />

  <ProToolsHandoff>
    <Button onClick={exportOMF}>Export OMF for Pro Tools</Button>
    <Button onClick={exportBWFPackage}>Export BWF package</Button>
    <Button onClick={exportPTSessionXML}>Export Pro Tools XML</Button>
  </ProToolsHandoff>
</ExportSection>
```

---

## GAP 3 — IMF PACKAGING (Netflix / Amazon / Apple delivery)

IMF (Interoperable Master Format) is the SMPTE standard that major streaming platforms require for content delivery. Netflix, Amazon Prime, Disney+, and Apple TV all mandate IMF for original content.

### Install dependencies

```bash
pip install imf-tools  # Python IMF library
npm install js-md5 uuid
```

### `src/lib/delivery/IMFPackager.ts`

```typescript
// IMF packaging via Python microservice
// An IMF package consists of:
// 1. MXF-wrapped video (JPEG 2000 or H.264 per profile)
// 2. MXF-wrapped audio (PCM 24-bit, 48kHz)
// 3. IMSC1 subtitles (if captions present)
// 4. AssetMap.xml — index of all files
// 5. PackingList.xml — integrity checksums
// 6. CompositionPlaylist.xml (CPL) — the timeline structure

export interface IMFPackageSpec {
  recipe: TimelineRecipe
  profile: 'APP2' | 'APP2E' | 'APP4DI'  // Netflix=APP2E, cinema=APP4DI
  videoProfile: 'j2k_2014' | 'h264_level4'
  frameRate: number
  resolution: { width: number, height: number }
  colourSpace: 'Rec.709' | 'DCI-P3' | 'Rec.2020'
  audioBitDepth: 16 | 24
  audioSampleRate: 48000 | 96000
  captions?: { language: string, url: string }[]
  dolbyVision?: boolean
  hdr10?: boolean
}

export async function packageIMF(spec: IMFPackageSpec): Promise<{
  downloadUrl: string
  assetMapUrl: string
  cplId: string
  totalSizeBytes: number
}>
// Calls Python IMF service at port 7433
// Python service handles MXF wrapping and XML generation
// Returns pre-signed ZIP download URL from R2
```

### Python IMF service outline (`src/services/imf_service.py`)

```python
from flask import Flask, request, jsonify
import subprocess, uuid, os, hashlib, json, tempfile

app = Flask(__name__)

@app.route('/package', methods=['POST'])
def package():
    spec = request.json
    package_id = str(uuid.uuid4())
    output_dir = f"/tmp/imf_{package_id}"
    os.makedirs(output_dir)
    
    # 1. Wrap video in MXF (using ffmpeg with mxf muxer)
    video_mxf = wrap_video_mxf(spec['videoUrl'], spec, output_dir)
    
    # 2. Wrap audio in MXF
    audio_mxfs = wrap_audio_mxf(spec['audioTracks'], spec, output_dir)
    
    # 3. Generate IMSC subtitles if captions provided
    subtitle_xml = generate_imsc(spec.get('captions', []), spec, output_dir)
    
    # 4. Generate CPL (Composition Playlist)
    cpl_id = str(uuid.uuid4())
    cpl_xml = generate_cpl(package_id, cpl_id, video_mxf, audio_mxfs, subtitle_xml, spec)
    
    # 5. Generate PKL (Packing List) with SHA-256 hashes
    pkl_xml = generate_pkl(package_id, [video_mxf, *audio_mxfs, cpl_xml])
    
    # 6. Generate AssetMap.xml
    asset_map = generate_asset_map(package_id, [video_mxf, *audio_mxfs, cpl_xml, pkl_xml])
    
    # 7. ZIP the package
    zip_path = f"/tmp/imf_{package_id}.zip"
    subprocess.run(['zip', '-r', zip_path, output_dir])
    
    return jsonify({'zip_path': zip_path, 'cpl_id': cpl_id, 'package_id': package_id})

def wrap_video_mxf(video_url, spec, output_dir):
    output = f"{output_dir}/video_{uuid.uuid4().hex[:8]}.mxf"
    # Download video, wrap in MXF with JPEG 2000 or H.264
    subprocess.run([
        'ffmpeg', '-i', video_url,
        '-c:v', 'libopenjpeg' if spec['videoProfile'] == 'j2k_2014' else 'libx264',
        '-pix_fmt', 'yuv422p10le',
        '-f', 'mxf',
        output
    ], check=True)
    return output

if __name__ == '__main__':
    app.run(port=7433, debug=False)
```

### UI — Delivery section in Export Dialog

```tsx
<ExportSection title="Streaming delivery (IMF)" badge="Studio+">
  <IMFProfileSelector>
    <Profile value="APP2E" label="Netflix / Amazon" note="APP2E profile — H.264 or JPEG 2000" />
    <Profile value="APP2" label="General streaming" note="APP2 profile" />
    <Profile value="APP4DI" label="Cinema / theatrical" note="JPEG 2000, DCI-P3, 4K DCI" />
  </IMFProfileSelector>
  <VideoFormatSelector options={['H.264 High', 'JPEG 2000']} />
  <ColourSpaceSelector options={['Rec.709', 'DCI-P3', 'Rec.2020 PQ (HDR10)', 'Dolby Vision']} />
  <AudioConfigSelector options={['Stereo', '5.1', '7.1', 'Dolby Atmos']} />
  <CaptionLanguages />
  <IMFCostEstimate />
  <Button onClick={packageIMF} variant="teal">Generate IMF package  ·  40 credits</Button>
  <p style={{fontSize:10,color:'var(--text-tertiary)'}}>Produces a standards-compliant IMF package accepted by Netflix, Amazon, Apple TV, and theatrical distributors.</p>
</ExportSection>
```

---

## GAP 4 — SHOTGRID / PRODUCTION MANAGEMENT INTEGRATION

ShotGrid (now Autodesk Flow Production Tracking) is used by virtually every major VFX house and studio for production management.

### Install

```bash
pip install shotgun_api3  # Official ShotGrid Python SDK
```

### `src/lib/production/ShotGridClient.ts`

```typescript
// ShotGrid integration via Python microservice (port 7434)
// Connects CINÉMA's Film Mode with ShotGrid production tracking

export interface ShotGridConfig {
  serverUrl: string      // e.g. https://yoursite.shotgrid.autodesk.com
  scriptName: string     // API script name from ShotGrid admin
  apiKey: string         // Script API key
  projectId: number      // ShotGrid project ID
}

// Core operations:

export async function syncShotListToShotGrid(params: {
  config: ShotGridConfig
  filmProjectId: string
  shots: FilmScene[]
}): Promise<{ syncedCount: number; shotGridIds: Record<string, number> }>
// Creates Shot entities in ShotGrid for each FilmScene
// Sets: shot_code, description, sg_status_list='wtg' (waiting to start)
// Stores ShotGrid shot ID back in FilmScene for future syncing

export async function updateShotStatus(params: {
  config: ShotGridConfig
  shotGridId: number
  status: 'wtg' | 'ip' | 'fin' | 'hld' | 'omt'
  outputVideoUrl?: string
  versionNote?: string
}): Promise<void>
// Updates shot status in ShotGrid
// If outputVideoUrl: creates a Version entity with the generated video for review
// This triggers email notifications to supervisors in ShotGrid

export async function createShotGridVersion(params: {
  config: ShotGridConfig
  shotGridShotId: number
  videoUrl: string
  versionName: string
  frameRange: string      // e.g. "1001-1096"
  taskName: string        // e.g. "Lighting", "Comp"
  note?: string
}): Promise<number>  // returns Version entity ID
// Creates a ShotGrid Version (reviewable media) linked to the Shot
// Version appears in ShotGrid's review system for client/supervisor approval

export async function importShotsFromShotGrid(params: {
  config: ShotGridConfig
  projectId: number
}): Promise<FilmScene[]>
// Pull existing shots from ShotGrid into CINÉMA
// Useful for taking over VFX work from an existing production
```

### `src/lib/production/FrameIOClient.ts`

Frame.io review integration (in addition to our built-in review portal):

```typescript
// Frame.io v4 API
export async function createFrameIOProject(params: {
  name: string
  teamId: string
}): Promise<string>  // Frame.io project ID

export async function uploadToFrameIO(params: {
  videoUrl: string
  projectId: string
  name: string
  description?: string
  frameRate: number
}): Promise<{ assetId: string, reviewLink: string }>
// Uploads video to Frame.io for client review
// Returns review link that can be shared without a Frame.io account

export async function syncFrameIOComments(params: {
  assetId: string
  projectId: string
}): Promise<ReviewComment[]>
// Pull comments from Frame.io and import into CINÉMA's review system
```

### UI — Production panel in Ultimate mode

Add a "Production" tab to the top film toolbar that opens:

```tsx
<ProductionPanel>
  <Tabs>
    <Tab label="ShotGrid">
      <ShotGridConnect>
        <input placeholder="Your ShotGrid URL" />
        <input placeholder="Script name" />
        <input placeholder="API key" type="password" />
        <Button onClick={testConnection}>Connect</Button>
      </ShotGridConnect>
      {connected && (
        <>
          <ProjectSelector projects={shotGridProjects} />
          <SyncPanel>
            <Button onClick={syncToShotGrid}>Push shots to ShotGrid</Button>
            <Button onClick={importFromShotGrid}>Import shots from ShotGrid</Button>
            <Button onClick={syncVersions}>Upload renders as versions</Button>
          </SyncPanel>
          <ShotStatusGrid shots={shotGridShots} onStatusChange={updateStatus} />
        </>
      )}
    </Tab>
    <Tab label="Frame.io">
      <FrameIOConnect />
      <ProjectSelector />
      <Button onClick={uploadToFrameIO}>Upload for review</Button>
      <FrameIOComments />
    </Tab>
    <Tab label="IMF Delivery">
      <IMFDeliveryPanel />
    </Tab>
    <Tab label="Shot tracker">
      <BuiltInShotTracker shots={filmProject.shots} />
    </Tab>
  </Tabs>
</ProductionPanel>
```

---

## GAP 5 — EXPANDED NODE COMPOSITOR (Toward Nuke parity)

Add 25 additional nodes to the existing node compositor, with OpenEXR deep compositing support.

### Install

```bash
npm install @loaders.gl/images openexr-js
pip install openexr Imath
```

### New node types to implement in `src/components/studio/NodeCompositor.tsx`

Add to the existing `NodeType` enum:

```typescript
// COLOUR NODES
| 'ColorCorrect'    // Full colour correction: Lift/Gamma/Gain + curves
| 'Grade'          // DaVinci-style grade node
| 'LUTNode'        // Apply a .cube LUT file
| 'Saturation'     // Saturation + vibrance
| 'Invert'         // Invert colours or alpha
| 'Clamp'          // Clamp values to 0-1

// FILTER NODES
| 'Blur'           // Gaussian, box, radial, directional
| 'Sharpen'        // Unsharp mask
| 'Defocus'        // Depth-of-field blur using depth map input
| 'Glow'           // Optical glow / bloom
| 'ChromaticAberration'
| 'FilmGrain'      // Procedural film grain
| 'MotionBlur'     // Vector motion blur

// COMPOSITE NODES
| 'Merge'          // Composite two inputs with blend mode
| 'LayerMerge'     // Merge with full layer stack
| 'Switch'         // Toggle between two inputs
| 'Dissolve'       // Cross-dissolve between inputs
| 'Premult'        // Pre-multiply / un-premultiply alpha

// MATTE NODES
| 'Keyer'          // Chroma keyer
| 'LumaKeyer'      // Luminance keyer
| 'DifferenceKey'  // Difference matte
| 'SpillSuppress'  // Green/blue spill suppression
| 'Roto'           // Bezier rotoscope mask

// TRANSFORM NODES
| 'Transform'      // 2D position, scale, rotate, skew
| 'Crop'           // Crop to region
| 'Flip'           // Flip horizontal/vertical
| 'Reformat'       // Change resolution/pixel aspect

// TRACKING NODES
| 'Tracker2D'      // 2D point tracker
| 'PlanarTracker'  // Planar / homography tracker
| 'CornerPin'      // Four-point corner pin

// DEEP COMPOSITING
| 'DeepMerge'      // Merge deep EXR streams
| 'DeepHold'       // Holdout from deep data
| 'Cryptomatte'    // Cryptomatte matte extraction

// UTILITY
| 'Dot'            // Pass-through dot for organisation
| 'NoOp'           // No-operation (for disabling branches)
| 'Shuffle'        // Rearrange RGBA channels
| 'MixChannels'    // Combine channels from multiple inputs
| 'TimeOffset'     // Frame delay
| 'Expression'     // Custom math expression per pixel
```

### OpenEXR input support

```typescript
// src/lib/compositor/EXRLoader.ts
export async function loadEXR(url: string): Promise<{
  width: number
  height: number
  channels: string[]          // ['R', 'G', 'B', 'A', 'Z', 'id.red', 'id.green', 'id.blue']
  hasDepth: boolean           // Z channel present
  hasCryptomatte: boolean     // id.* channels present
  pixelData: Float32Array     // raw pixel data
}>
// Use Python EXR service for parsing (port 7435)
// Returns channel data for node compositor to process
// Enables deep compositing when Z channel is present
```

---

## GAP 6 — HARDWARE CONTROL SURFACE SUPPORT

Professional studios use hardware control surfaces for colour grading (DaVinci panels) and mixing (SSL/Avid Artist Series).

### `src/lib/hardware/ControlSurface.ts`

```typescript
// MIDI CC mapping for colour panels (e.g. Behringer BCF2000)
// WebMIDI API — browser native
export async function initMIDIControlSurface(): Promise<void> {
  if (!navigator.requestMIDIAccess) return
  const midi = await navigator.requestMIDIAccess()
  midi.inputs.forEach(input => {
    input.onmidimessage = handleMIDIMessage
  })
}

function handleMIDIMessage(event: WebMidi.MIDIMessageEvent): void {
  const [status, cc, value] = event.data
  const normalised = value / 127  // 0-1
  // Map CC numbers to colour grade parameters:
  const CC_MAP: Record<number, string> = {
    1:  'lift_red',    2: 'lift_green',    3: 'lift_blue',
    4:  'gamma_red',   5: 'gamma_green',   6: 'gamma_blue',
    7:  'gain_red',    8: 'gain_green',    9: 'gain_blue',
    10: 'saturation',  11: 'contrast',     12: 'exposure',
    // JLCooper MCS-Panner / Behringer BCF layout compatible
  }
  const param = CC_MAP[cc]
  if (param) updateColourGradeParam(param, normalised)
}

// Also support OSC (Open Sound Control) for network-connected surfaces
export function initOSCControlSurface(port: number = 7436): void
// Listens for OSC messages from TouchOSC, Lemur, etc.
// Maps /colour/lift/r, /colour/gamma/g etc. to grade parameters
```

### UI — Control Surface panel in Settings

```tsx
<ControlSurfacePanel>
  <MIDIDeviceList devices={midiDevices} onConnect={connectMIDI} />
  <MIDIMapper mappings={midiMappings} onRemap={remapCC} />
  <OSCSettings port={oscPort} onPortChange={setOSCPort} />
  <TestButton onClick={testSurface} />
</ControlSurfacePanel>
```

---

## GAP 7 — AVID BIN-STYLE MEDIA MANAGEMENT

For large productions, add proper media bin management to handle hundreds of clips efficiently.

### `src/lib/media/BinManager.ts`

```typescript
export interface MediaBin {
  id: string
  name: string
  projectId: string
  parentBinId?: string    // for nested bins
  clips: BinClip[]
  colour?: string         // colour-coded bins like Avid
  createdAt: Date
}

export interface BinClip {
  id: string
  name: string
  duration: number
  frameRate: number
  resolution: string
  mediaUrl: string
  proxyUrl: string
  thumbnailUrl: string
  modelUsed?: string
  cameraAngle?: string
  scene?: string
  take?: number
  tags: string[]
  rating: 1 | 2 | 3 | 4 | 5 | null   // editorial rating
  colour?: string                      // colour marker
  inPoint?: number                     // subclip in-point
  outPoint?: number
}

// Bin operations:
export async function createBin(name: string, projectId: string): Promise<MediaBin>
export async function moveToBin(clipIds: string[], binId: string): Promise<void>
export async function findClips(query: string, projectId: string): Promise<BinClip[]>
// AI semantic search: "find all Maya close-ups"
export async function autoOrganiseBins(projectId: string): Promise<void>
// Uses Model 1 to analyse clips and auto-sort into bins by scene, character, angle
```

### Add to Prisma schema

```prisma
model MediaBin {
  id          String    @id @default(cuid())
  projectId   String
  name        String
  parentId    String?
  colour      String?
  createdAt   DateTime  @default(now())
  clips       BinClipEntry[]
  project     Project   @relation(fields: [projectId], references: [id])
}

model BinClipEntry {
  id          String    @id @default(cuid())
  binId       String
  clipUrl     String
  name        String
  duration    Float
  modelUsed   String?
  rating      Int?
  tags        String[]
  inPoint     Float?
  outPoint    Float?
  bin         MediaBin  @relation(fields: [binId], references: [id])
}
```

---

## ENV VARS TO ADD

```env
# OTIO Python microservice
OTIO_SERVICE_URL="http://localhost:7432"

# IMF packaging service
IMF_SERVICE_URL="http://localhost:7433"

# ShotGrid / Autodesk Flow
SHOTGRID_SERVICE_URL="http://localhost:7434"

# Frame.io
FRAMEIO_CLIENT_ID=""
FRAMEIO_CLIENT_SECRET=""
FRAMEIO_TOKEN=""

# OpenEXR service
EXR_SERVICE_URL="http://localhost:7435"

# Hardware (OSC)
OSC_LISTEN_PORT=7436
```

## START SCRIPT — `scripts/start_services.sh`

```bash
#!/bin/bash
# Starts all Python microservices alongside the Next.js app
echo "Starting CINÉMA Python services..."
python src/services/otio_service.py &
python src/services/imf_service.py &
python src/services/shotgrid_service.py &
python src/services/exr_service.py &
echo "All services started. Running Next.js..."
npm run dev
```

Add to `package.json`:
```json
{
  "scripts": {
    "dev": "concurrently \"next dev\" \"bash scripts/start_services.sh\"",
    "dev:next": "next dev"
  }
}
```

---

## SPRINT PLAN — STUDIO GAP CLOSURE

**Sprint 44 — Interchange (2 weeks):**
1. Set up Python OTIO microservice with Flask
2. Implement native EDL, FCP XML, DaVinci XML export in TypeScript
3. Build `/api/interchange/export` and `/api/interchange/import` endpoints
4. Add interchange section to Export Dialog
5. Test: export a 10-clip timeline as EDL → import into DaVinci Resolve → verify clips land correctly
6. Test: export FCP XML → import into Final Cut Pro → verify timing

**Sprint 45 — Pro Tools audio (1.5 weeks):**
1. Implement BWF export with SMPTE timecode embedding
2. Implement stem render pipeline (dialogue/music/SFX/MX buses)
3. Implement OMF export via ffmpeg
4. Add Pro Tools handoff section to Export Dialog
5. Test: render stems → open BWF files in Pro Tools → verify timecode alignment

**Sprint 46 — IMF packaging (2 weeks):**
1. Set up Python IMF microservice
2. Implement MXF video wrapping via ffmpeg
3. Implement AssetMap, PackingList, CPL XML generation
4. Build IMF delivery section in Export Dialog
5. Test: generate APP2E package → validate with Netflix IMF specification checker

**Sprint 47 — ShotGrid + Frame.io (1.5 weeks):**
1. Set up Python ShotGrid microservice
2. Implement push shots, update status, create versions
3. Implement Frame.io upload and comment sync
4. Build Production panel in Ultimate mode
5. Test: sync 5 shots to ShotGrid → update status → pull comments

**Sprint 48 — Node compositor expansion (2 weeks):**
1. Add 25 new node types to the compositor
2. Implement OpenEXR loader via Python service
3. Add deep compositing support (Z-channel, cryptomatte)
4. Test: load an EXR from a 3D render → apply Cryptomatte node → extract character matte → merge over new background

**Sprint 49 — Hardware + Media Management (1 week):**
1. WebMIDI control surface support
2. OSC listener for network-based hardware panels
3. Avid-style media bin system
4. AI auto-organise bins using Model 1
5. CC mapping configuration panel in Settings

---

## FINAL VALIDATION — After all sprints complete

Run this checklist to verify studio readiness:

- [ ] Export a 3-minute timeline as EDL → import into Avid Media Composer without errors
- [ ] Export FCP XML → import into DaVinci Resolve → all clips at correct timecodes
- [ ] Export AAF → import into Pro Tools → audio tracks at correct positions with BWF timecode
- [ ] Render dialogue/music/SFX stems as BWF → all timecodes align with session
- [ ] Generate IMF APP2E package → validate with Netflix Photon validator
- [ ] Push shot list to ShotGrid → versions appear in ShotGrid review
- [ ] Upload to Frame.io → comments appear in CINÉMA review portal
- [ ] Load an OpenEXR with Z-depth → use Defocus node driven by depth channel
- [ ] Hardware: MIDI CC 1-9 controls lift/gamma/gain in colour grade in real-time
- [ ] 50 clips in a bin → AI auto-organise → bins named correctly by scene/character
