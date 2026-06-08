import { type NextRequest, NextResponse } from 'next/server'
import { think, type CreativeBrief } from '@/lib/cognition'
import { validateDesktopCloudRequest } from '@/lib/desktop/cloudAuth'
import type { CharacterDirectorContext } from '@/lib/cognition/director'

export const maxDuration = 120

export async function POST(request: NextRequest): Promise<NextResponse> {
  const userId = validateDesktopCloudRequest(request)
  if (userId instanceof NextResponse) return userId

  const body = (await request.json()) as {
    prompt?: string
    durationSec?: number
    characterContext?: CharacterDirectorContext | null
  }

  if (!body.prompt?.trim()) {
    return NextResponse.json({ error: 'prompt required' }, { status: 400 })
  }

  try {
    const brief: CreativeBrief = await think({
      userId,
      prompt: body.prompt.trim(),
      durationSec: Number(body.durationSec ?? 10),
      characterContext: body.characterContext ?? null,
    })
    return NextResponse.json(brief)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Cognition failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
