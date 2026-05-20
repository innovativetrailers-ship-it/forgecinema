import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { executeTimelineEdit } from '@/lib/routing/TimelineEditor'
import { checkAndDeductCredits } from '@/lib/credits'
import { z } from 'zod'

const schema = z.object({
  project_id: z.string(),
  clip_id: z.string(),
  clip_url: z.string().url(),
  start_time: z.number().min(0),
  end_time: z.number().min(0),
  user_instruction: z.string().min(5).max(2000),
  tier: z.enum(['Draft', 'Studio', 'Blockbuster']),
  character_ids: z.array(z.string()).optional(),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 })

  const editCost = Math.ceil((parsed.data.end_time - parsed.data.start_time) * 3) + 2
  await checkAndDeductCredits(session.user.id, 'repaint_segment', editCost)

  const result = await executeTimelineEdit(parsed.data)
  return NextResponse.json(result)
}
