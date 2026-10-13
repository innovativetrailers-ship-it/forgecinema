import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUser } from '@/lib/auth/requireUser'

const schema = z.object({
  assetUrls: z.array(z.string().url()).min(1).max(30),
  projectId: z.string(),
  targetPlatform: z.enum(['tiktok', 'instagram', 'youtube', 'general']).default('general'),
})

export async function POST(request: NextRequest) {
  const userId = (await requireUser(request))?.id ?? null
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const parsed = schema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  return NextResponse.json(
    { error: 'Drop & Direct has no credit price yet, so it stays off.' },
    { status: 503 },
  )
}
