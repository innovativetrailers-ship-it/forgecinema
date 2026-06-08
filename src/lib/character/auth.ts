import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export function requireUserId(request: NextRequest): string | NextResponse {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return userId
}

export async function requireVaultCharacter(characterId: string, userId: string) {
  const character = await db.vaultCharacter.findUnique({
    where: { id: characterId },
    include: { project: { select: { userId: true } } },
  })
  if (!character || character.project.userId !== userId) return null
  return character
}
