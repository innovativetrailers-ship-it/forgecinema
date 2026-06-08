import { type NextRequest, NextResponse } from 'next/server'

/** Validates Forge Desktop → Cloud relay requests (x-user-id + optional bearer). */
export function validateDesktopCloudRequest(request: NextRequest): string | NextResponse {
  const userId = request.headers.get('x-user-id')?.trim()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (request.headers.get('x-forge-desktop') !== '1') {
    return NextResponse.json({ error: 'Desktop client required' }, { status: 403 })
  }

  const expected = process.env.FORGE_CLOUD_TOKEN?.trim()
  if (expected) {
    const auth = request.headers.get('authorization')?.trim()
    if (auth !== `Bearer ${expected}`) {
      return NextResponse.json({ error: 'Invalid cloud token' }, { status: 403 })
    }
  }

  return userId
}
