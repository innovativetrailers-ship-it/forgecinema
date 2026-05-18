import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { SwarmRouter } from '@/lib/swarm/SwarmRouter'
import { checkAndDeductCredits } from '@/lib/credits'
import { z } from 'zod'

const schema = z.object({
  shot_list: z.any(),
  projectId: z.string(),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 })

  const { shot_list, projectId } = parsed.data

  await checkAndDeductCredits(session.user.id, 'generate_standard', shot_list.estimated_total_credits)

  const swarm = new SwarmRouter()
  // Dispatch async — client polls via SSE on swarm:projectId channel
  swarm.dispatch({
    shotList: shot_list,
    userId: session.user.id,
    projectId,
  }).catch(console.error)

  return NextResponse.json({ status: 'dispatched', projectId })
}
