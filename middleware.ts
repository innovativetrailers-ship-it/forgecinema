import { type NextRequest, NextResponse } from 'next/server'

// Inject x-user-id / x-user-role headers forwarded from client or session cookie.
// Full session parsing is done per-route via auth() to stay Node.js-runtime compatible.
export function middleware(req: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: ['/api/:path*'],
}
