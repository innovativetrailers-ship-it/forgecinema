import { type NextRequest, NextResponse } from 'next/server'

export const maxDuration = 30

/** Receives V3 desktop crash reports (JSON from crash.ts upload). */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const contentType = request.headers.get('content-type') ?? ''
  let payload: unknown

  if (contentType.includes('application/json')) {
    payload = await request.json()
  } else {
    payload = await request.text()
  }

  console.error('[V3 crash]', JSON.stringify(payload))

  return NextResponse.json({ received: true })
}
