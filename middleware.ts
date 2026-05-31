import NextAuth         from 'next-auth'
import { NextResponse } from 'next/server'
import { authConfig }   from '@/lib/auth.config'

const { auth } = NextAuth(authConfig)

// Inject x-user-id / x-user-role / x-user-tier headers for all API + editor routes
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
  matcher: ['/api/:path*', '/(editor)/:path*'],
}
