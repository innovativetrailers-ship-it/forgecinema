import { NextRequest, NextResponse } from 'next/server'
import { updateAppearance } from '@/lib/character/fccManager'
import { validateAppearancePatch, type CharacterAppearance } from '@/lib/character/fccSchema'
import { requireUserId } from '@/lib/character/auth'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = requireUserId(request)
  if (userId instanceof NextResponse) return userId

  const { id } = await params
  const body = (await request.json()) as Partial<CharacterAppearance>
  const err = validateAppearancePatch(body)
  if (err) return NextResponse.json({ error: err }, { status: 400 })

  try {
    const view = await updateAppearance(id, userId, body)
    return NextResponse.json(view)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Update failed'
    return NextResponse.json({ error: message }, { status: 404 })
  }
}
