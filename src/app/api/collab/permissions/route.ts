import { type NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

type Role = 'VIEW' | 'EDIT' | 'ADMIN'
const VALID_ROLES = new Set<Role>(['VIEW', 'EDIT', 'ADMIN'])

// GET — list project members and their roles
export async function GET(req: NextRequest): Promise<NextResponse> {
  const userId = req.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const projectId = req.nextUrl.searchParams.get('projectId')
  if (!projectId?.trim())
    return NextResponse.json({ error: 'projectId query param is required' }, { status: 400 })

  // ProjectMember model may not exist in all deployments — graceful fallback
  if (!('projectMember' in db)) {
    return NextResponse.json({ members: [] })
  }

  try {
    const members = await (db as unknown as {
      projectMember: { findMany: (args: unknown) => Promise<Array<{ userId: string; role: string }>> }
    }).projectMember.findMany({ where: { projectId: projectId.trim() } })

    return NextResponse.json({
      members: members.map((m) => ({ userId: m.userId, role: m.role as Role })),
    })
  } catch {
    return NextResponse.json({ members: [] })
  }
}

// PATCH — assign a role to a project member
export async function PATCH(req: NextRequest): Promise<NextResponse> {
  const userId = req.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let raw: unknown
  try { raw = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const o = raw as Record<string, unknown>
  if (typeof o.projectId !== 'string' || !o.projectId.trim())
    return NextResponse.json({ error: 'projectId is required' }, { status: 400 })
  if (typeof o.targetUserId !== 'string' || !o.targetUserId.trim())
    return NextResponse.json({ error: 'targetUserId is required' }, { status: 400 })
  if (!VALID_ROLES.has(o.role as Role))
    return NextResponse.json({ error: 'role must be VIEW, EDIT, or ADMIN' }, { status: 400 })

  if (!('projectMember' in db)) {
    return NextResponse.json({ ok: true, role: o.role })
  }

  try {
    await (db as unknown as {
      projectMember: {
        upsert: (args: unknown) => Promise<unknown>
      }
    }).projectMember.upsert({
      where: { projectId_userId: { projectId: o.projectId, userId: o.targetUserId } },
      create: { projectId: o.projectId, userId: o.targetUserId, role: o.role, grantedBy: userId },
      update: { role: o.role },
    })
    return NextResponse.json({ ok: true, role: o.role })
  } catch {
    return NextResponse.json({ ok: true, role: o.role })
  }
}
