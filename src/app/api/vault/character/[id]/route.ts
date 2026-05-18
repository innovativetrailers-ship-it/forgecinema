import { NextRequest, NextResponse } from 'next/server'
import { getCharacter, deleteCharacter } from '@/lib/vault/character'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const character = await getCharacter(id)
  if (!character) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json(character)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  await deleteCharacter(id)
  return NextResponse.json({ deleted: true })
}
