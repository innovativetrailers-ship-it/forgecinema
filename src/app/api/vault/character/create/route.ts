import { NextRequest, NextResponse } from 'next/server'
import { createCharacter } from '@/lib/vault/character'

export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await request.formData()
  const name = formData.get('name') as string
  const projectId = formData.get('projectId') as string

  if (!name || !projectId) {
    return NextResponse.json({ error: 'name and projectId required' }, { status: 400 })
  }

  const imageFiles = formData.getAll('images') as File[]

  if (imageFiles.length === 0) {
    return NextResponse.json({ error: 'At least one image required' }, { status: 400 })
  }

  const imageBuffers = await Promise.all(
    imageFiles.slice(0, 5).map(async (file) => ({
      buffer: Buffer.from(await file.arrayBuffer()),
      filename: file.name,
      contentType: file.type || 'image/jpeg',
    }))
  )

  const character = await createCharacter({ projectId, name, imageBuffers })
  return NextResponse.json(character, { status: 201 })
}
