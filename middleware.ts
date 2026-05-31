import { getToken } from 'next-auth/jwt'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Uses JWT cookie directly — no DB access required (Edge Runtime compatible)
export async function middleware(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  })

  const headers = new Headers(req.headers)

  if (token) {
    if (token.id)   headers.set('x-user-id',   String(token.id))
    if (token.role) headers.set('x-user-role',  String(token.role))
    if (token.subscriptionStatus) {
      headers.set('x-user-tier', String(token.subscriptionStatus))
    }
  }

  return NextResponse.next({ request: { headers } })
}

export const config = {
  matcher: [
    '/api/:path*',
    '/(editor)/:path*',
  ],
}
