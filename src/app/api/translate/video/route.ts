import { NextRequest, NextResponse } from 'next/server'
import { checkAndDeductCredits, refundCredits, OPERATION_COSTS } from '../../../../lib/credits'
import { fal } from '../../../../lib/fal/client'
import { synthesiseSpeech } from '../../../../lib/audio/elevenlabs'
import { uploadToR2 } from '../../../../lib/storage/r2'
import Anthropic from '@anthropic-ai/sdk'
import { execSync } from 'child_process'
import { mkdirSync, rmSync, existsSync } from 'fs'
import { join } from 'path'
import { nanoid } from 'nanoid'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

interface TranslationJob {
  sourceVideoUrl: string
  targetLanguage: string
  translateCaptions: boolean
  dubAudio: boolean
  resyncLips: boolean
  preserveOriginalAudio: boolean
  characterId?: string
  voiceId?: string
}

export async function POST(req: NextRequest) {
  const userId = req.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: TranslationJob
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { sourceVideoUrl, targetLanguage, dubAudio, resyncLips, voiceId } = body

  try {
    await checkAndDeductCredits(userId, 'video_translate')
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 402 })
  }

  const jobId = nanoid()
  const tmpDir = `/tmp/translate-${jobId}`
  mkdirSync(tmpDir, { recursive: true })

  try {
    // 1. Whisper transcription with word timestamps
    const transcriptResult = await fal.subscribe('fal-ai/whisper', {
      input: { audio_url: sourceVideoUrl, task: 'transcribe', return_timestamps: 'word' },
    }) as unknown as { text: string; chunks: Array<{ text: string; timestamp: [number, number] }> }

    const sourceText = transcriptResult.text

    // 2. Claude translation
    const translationResp = await anthropic.messages.create({
      model: 'claude-haiku-4-20250514',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: `Translate the following text to ${targetLanguage}. Preserve proper nouns and brand names. Maintain natural spoken rhythm. Return ONLY the translated text, no explanation:\n\n${sourceText}`,
        },
      ],
    })
    const translatedText = translationResp.content[0].type === 'text' ? translationResp.content[0].text : sourceText

    // 3. ElevenLabs multilingual TTS
    let dubbedAudioUrl: string | null = null
    if (dubAudio) {
      const targetVoiceId = voiceId ?? 'EXAVITQu4vr4xnSDxMaL'
      const ttsResult = await synthesiseSpeech({
        text: translatedText,
        voiceId: targetVoiceId,
      })
      dubbedAudioUrl = ttsResult.audioUrl
    }

    // 4. Generate SRT captions
    const srtLines: string[] = []
    const words = transcriptResult.chunks
    let segIdx = 1
    for (let i = 0; i < words.length; i += 8) {
      const seg = words.slice(i, i + 8)
      const start = seg[0].timestamp[0]
      const end = seg[seg.length - 1].timestamp[1]
      const text = seg.map((w) => w.text).join(' ')
      srtLines.push(`${segIdx}\n${formatSRTTime(start)} --> ${formatSRTTime(end)}\n${text}\n`)
      segIdx++
    }
    const srtContent = srtLines.join('\n')
    const srtBuffer = Buffer.from(srtContent)
    const srtUrl = await uploadToR2(srtBuffer, `captions/${jobId}_${targetLanguage}.srt`, 'text/srt')

    // 5. Lip resync if dubbing
    let finalVideoUrl = sourceVideoUrl
    if (dubAudio && dubbedAudioUrl && resyncLips) {
      const lipResult = await fal.subscribe('fal-ai/sadtalker', {
        input: {
          source_image_url: sourceVideoUrl,
          driven_audio_url: dubbedAudioUrl,
          expression_scale: 1.0,
        },
      }) as unknown as { video: { url: string } }
      finalVideoUrl = lipResult.video.url
    } else if (dubAudio && dubbedAudioUrl) {
      // Overlay dubbed audio
      const outputPath = join(tmpDir, 'dubbed.mp4')
      const audioBuf = Buffer.from(await (await fetch(dubbedAudioUrl)).arrayBuffer())
      const audioPath = join(tmpDir, 'dubbed.mp3')
      require('fs').writeFileSync(audioPath, audioBuf)

      const mixArg = body.preserveOriginalAudio
        ? `[0:a][1:a]amix=inputs=2:duration=shortest`
        : `[1:a]anull`

      execSync(
        `ffmpeg -i "${sourceVideoUrl}" -i "${audioPath}" -filter_complex "${mixArg}" -c:v copy "${outputPath}" -y 2>/dev/null`
      )
      const outBuf = execSync(`cat "${outputPath}"`)
      finalVideoUrl = await uploadToR2(outBuf, `translated/${jobId}.mp4`, 'video/mp4')
    }

    return NextResponse.json({
      videoUrl: finalVideoUrl,
      srtUrl,
      targetLanguage,
      dubbedAudioUrl,
    })
  } catch (e) {
    await refundCredits(userId, OPERATION_COSTS['video_translate'] ?? 15, 'Video translation failed')
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  } finally {
    if (existsSync(tmpDir)) rmSync(tmpDir, { recursive: true, force: true })
  }
}

function formatSRTTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  const ms = Math.round((seconds % 1) * 1000)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`
}
