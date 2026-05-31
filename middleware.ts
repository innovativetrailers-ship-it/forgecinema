import { auth }         from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const session = req.auth
  const headers = new Headers(req.headers)

  if (session?.user?.id) {
    headers.set('x-user-id',   session.user.id)
    headers.set('x-user-role', (session.user as { role?: string }).role ?? 'USER')
    headers.set('x-user-tier', (session.user as { subscriptionStatus?: string }).subscriptionStatus ?? 'free')
  }

  return NextResponse.next({ request: { headers } })
})

export const config = {
  matcher: [
    // Protect all API routes
    '/api/:path*',
    // Protect editor routes
    '/(editor)/:path*',
    '/simple/:path*',
    '/ultimate/:path*',
  ],
}
