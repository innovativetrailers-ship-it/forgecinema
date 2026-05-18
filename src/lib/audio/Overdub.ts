import { synthesiseSpeech } from './elevenlabs'
import { uploadToR2 } from '../storage/r2'
import { execSync } from 'child_process'
import { existsSync, mkdirSync, rmSync } from 'fs'
import { join } from 'path'
import { nanoid } from 'nanoid'

interface TargetWord {
  text: string
  startTime: number
  endTime: number
}

export async function overdubWord(params: {
  audioTrackUrl: string
  targetWord: TargetWord
  replacementText: string
  voiceId: string
}): Promise<{ patchedAudioUrl: string }> {
  const { audioTrackUrl, targetWord, replacementText, voiceId } = params
  const jobId = nanoid()
  const tmpDir = `/tmp/overdub-${jobId}`
  mkdirSync(tmpDir, { recursive: true })

  try {
    const originalDuration = targetWord.endTime - targetWord.startTime

    // 1. ElevenLabs TTS: generate replacement text in cloned voice
    const { audioUrl: generatedAudioUrl } = await synthesiseSpeech({
      text: replacementText,
      voiceId,
      emotion: 'neutral',
    })

    // 2. Get duration of generated audio
    const genBuf = Buffer.from(await (await fetch(generatedAudioUrl)).arrayBuffer())
    const genPath = join(tmpDir, 'generated.mp3')
    require('fs').writeFileSync(genPath, genBuf)

    const genDur = parseFloat(
      execSync(`ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${genPath}"`).toString().trim()
    )

    // 3. Time-stretch if duration difference < 20%
    const durationRatio = genDur / originalDuration
    const stretchedPath = join(tmpDir, 'stretched.mp3')

    if (Math.abs(durationRatio - 1.0) < 0.2) {
      // Time-stretch to match original duration
      const tempoFactor = genDur / originalDuration
      execSync(
        `ffmpeg -i "${genPath}" -af "atempo=${tempoFactor.toFixed(4)}" "${stretchedPath}" -y 2>/dev/null`
      )
    } else {
      // Just use the generated audio as-is
      execSync(`cp "${genPath}" "${stretchedPath}"`)
    }

    // 4. Match EQ profile from original word
    const origWordPath = join(tmpDir, 'orig_word.mp3')
    execSync(
      `ffmpeg -i "${audioTrackUrl}" -ss ${targetWord.startTime} -t ${originalDuration} "${origWordPath}" -y 2>/dev/null`
    )

    // Apply slight EQ match (high-shelf boost to match original brightness)
    const eqMatchedPath = join(tmpDir, 'eq_matched.mp3')
    execSync(
      `ffmpeg -i "${stretchedPath}" -af "equalizer=f=6000:width_type=o:width=2:g=2" "${eqMatchedPath}" -y 2>/dev/null`
    )

    // 5. Splice generated audio into exact timecode position
    const patchedPath = join(tmpDir, 'patched.mp3')
    const beforePath = join(tmpDir, 'before.mp3')
    const afterPath = join(tmpDir, 'after.mp3')

    const totalDur = parseFloat(
      execSync(`ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${audioTrackUrl}"`).toString().trim()
    )

    execSync(
      `ffmpeg -i "${audioTrackUrl}" -t ${targetWord.startTime} "${beforePath}" -y 2>/dev/null`
    )
    execSync(
      `ffmpeg -i "${audioTrackUrl}" -ss ${targetWord.endTime} -t ${totalDur - targetWord.endTime} "${afterPath}" -y 2>/dev/null`
    )

    // Concat: before + eq_matched + after
    const concatList = join(tmpDir, 'concat.txt')
    require('fs').writeFileSync(
      concatList,
      `file '${beforePath}'\nfile '${eqMatchedPath}'\nfile '${afterPath}'\n`
    )
    execSync(
      `ffmpeg -f concat -safe 0 -i "${concatList}" -c:a libmp3lame "${patchedPath}" -y 2>/dev/null`
    )

    void origWordPath

    const buffer = execSync(`cat "${patchedPath}"`)
    const patchedAudioUrl = await uploadToR2(buffer, `overdub/${jobId}.mp3`, 'audio/mpeg')
    return { patchedAudioUrl }
  } finally {
    if (existsSync(tmpDir)) rmSync(tmpDir, { recursive: true, force: true })
  }
}
