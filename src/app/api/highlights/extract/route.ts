import { NextRequest, NextResponse } from 'next/server'
import { checkAndDeductCredits, refundCredits, OPERATION_COSTS } from '../../../../lib/credits'
import { fal } from '../../../../lib/fal/client'
import { uploadToR2 } from '../../../../lib/storage/r2'
import Anthropic from '@anthropic-ai/sdk'
import { execSync } from 'child_process'
import { mkdirSync, rmSync, existsSync } from 'fs'
import { join } from 'path'
import { nanoid } from 'nanoid'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

interface HighlightClip {
  rank: number
  startTime: number
  endTime: number
  transcript: string
  viralityScore: number
  reason: string
  clipUrl: string
  captionedUrl?: string
  verticalUrl?: string
}

export async function POST(req: NextRequest) {
  const userId = req.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { videoUrl: string; targetCount?: number; maxDuration?: number; platform?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { videoUrl, targetCount = 5, maxDuration = 90, platform = 'tiktok' } = body

  try {
    await checkAndDeductCredits(userId, 'highlight_extract')
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 402 })
  }

  const jobId = nanoid()
  const tmpDir = `/tmp/highlights-${jobId}`
  mkdirSync(tmpDir, { recursive: true })

  try {
    // 1. Whisper transcription
    const transcriptResult = await fal.subscribe('fal-ai/whisper', {
      input: { audio_url: videoUrl, task: 'transcribe' },
    }) as unknown as {
      text: string
      chunks: Array<{ text: string; timestamp: [number, number] }>
    }

    // Get video duration
    const totalDur = parseFloat(
      execSync(`ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${videoUrl}"`).toString().trim()
    )

    // Group chunks into 30-90s segments
    const segmentLength = Math.min(maxDuration, 60)
    const segments: Array<{ start: number; end: number; text: string }> = []

    let segStart = 0
    let segText = ''

    for (const chunk of transcriptResult.chunks) {
      if (chunk.timestamp[1] - segStart >= segmentLength) {
        segments.push({ start: segStart, end: chunk.timestamp[1], text: segText.trim() })
        segStart = chunk.timestamp[1]
        segText = ''
      }
      segText += ' ' + chunk.text
    }
    if (segText.trim()) {
      segments.push({ start: segStart, end: totalDur, text: segText.trim() })
    }

    if (segments.length === 0) {
      return NextResponse.json({ highlights: [] })
    }

    // 2. Model 1 scores every segment
    const scoringResp = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: `You are a viral content strategist. Score each of these video segments for virality potential on ${platform}.

Segments:
${segments.map((s, i) => `[${i}] ${s.start.toFixed(1)}s-${s.end.toFixed(1)}s: "${s.text}"`).join('\n')}

Score each segment 0-100 on:
- Hook strength (does it start compellingly?)
- Quotability (shareable statement?)
- Emotional intensity
- Topic clarity (standalone without context?)

Return ONLY valid JSON array:
[{ "segmentIndex": 0, "viralityScore": 85, "reason": "why this is viral", "hookStrength": 90, "quotability": 80 }]`,
        },
      ],
    })

    const scoreText = scoringResp.content[0].type === 'text' ? scoringResp.content[0].text : '[]'
    const jsonMatch = scoreText.match(/\[[\s\S]*\]/)
    const scores = jsonMatch ? (JSON.parse(jsonMatch[0]) as Array<{
      segmentIndex: number
      viralityScore: number
      reason: string
    }>) : []

    // 3. Sort by score and take top N
    const ranked = scores
      .sort((a, b) => b.viralityScore - a.viralityScore)
      .slice(0, targetCount)

    // 4. Extract clips
    const highlights: HighlightClip[] = []
    for (let rank = 0; rank < ranked.length; rank++) {
      const score = ranked[rank]
      const seg = segments[score.segmentIndex]
      if (!seg) continue

      const clipPath = join(tmpDir, `highlight_${rank}.mp4`)
      try {
        execSync(
          `ffmpeg -i "${videoUrl}" -ss ${seg.start} -t ${seg.end - seg.start} -c copy "${clipPath}" -y 2>/dev/null`
        )
        const buffer = execSync(`cat "${clipPath}"`)
        const clipUrl = await uploadToR2(buffer, `highlights/${jobId}_${rank}.mp4`, 'video/mp4')

        highlights.push({
          rank: rank + 1,
          startTime: seg.start,
          endTime: seg.end,
          transcript: seg.text,
          viralityScore: score.viralityScore,
          reason: score.reason,
          clipUrl,
        })
      } catch {
        // Skip clips that fail to extract
      }
    }

    return NextResponse.json({ highlights })
  } catch (e) {
    await refundCredits(userId, OPERATION_COSTS['highlight_extract'] ?? 5, 'Highlight extraction failed')
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  } finally {
    if (existsSync(tmpDir)) rmSync(tmpDir, { recursive: true, force: true })
  }
}
