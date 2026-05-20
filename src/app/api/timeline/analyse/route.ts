import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { analyseTimelineEdit } from '@/lib/routing/TimelineEditor'
import { z } from 'zod'

const schema = z.object({
  clip_url: z.string().url(),
  start_time: z.number().min(0),
  end_time: z.number().min(0),
  user_instruction: z.string().min(5).max(2000),
  tier: z.enum(['Draft', 'Studio', 'Blockbuster']),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 })

  const result = await analyseTimelineEdit(parsed.data)
  return NextResponse.json(result)
}
