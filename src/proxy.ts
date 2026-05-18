import { NextRequest, NextResponse } from 'next/server'

// We cannot import `auth` from `@/lib/auth` here because Prisma Client
// is not compatible with the Edge Runtime. Instead, we use next-auth's
// edge-compatible built-in middleware or handle auth in the route handlers.

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow auth routes through
  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next()
  }

  // NOTE: Due to Edge runtime constraints with Prisma, we've moved the
  // strict auth checks into the actual API route handlers and page layouts.
  // The middleware now only handles basic routing and headers.

  return NextResponse.next()
}

export const config = {
  matcher: ['/api/:path*', '/(editor)/:path*', '/simple/:path*', '/advanced/:path*', '/ultimate/:path*'],
}
