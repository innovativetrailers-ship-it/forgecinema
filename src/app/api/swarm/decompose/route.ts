import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { SwarmRouter } from '@/lib/swarm/SwarmRouter'
import { z } from 'zod'

const schema = z.object({
  userInput: z.string().min(10).max(5000),
  tier: z.enum(['Draft', 'Studio', 'Blockbuster']),
  targetDuration: z.number().optional(),
  characterIds: z.array(z.string()).optional(),
  projectId: z.string(),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 })

  const swarm = new SwarmRouter()
  const shotList = await swarm.decompose({
    ...parsed.data,
    userId: session.user.id,
  })

  return NextResponse.json({
    shot_list: shotList,
    estimated_credits: shotList.estimated_total_credits,
    model_distribution: shotList.model_distribution,
    cost_breakdown: shotList.cost_breakdown,
  })
}
