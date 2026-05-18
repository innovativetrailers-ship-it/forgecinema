import { detectFormat } from '@/lib/importers/ProjectImporter'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { filename, sampleBytes } = await req.json() as {
    filename: string
    sampleBytes: number[]
  }

  if (!filename) return NextResponse.json({ error: 'filename required' }, { status: 400 })

  const buffer = Buffer.from(sampleBytes ?? [])
  const format = await detectFormat(filename, buffer)
  return NextResponse.json({ format })
}
