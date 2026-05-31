// Edge Runtime-compatible auth config (no Prisma adapter, no db import)
import type { NextAuthConfig } from 'next-auth'

export const authConfig = {
  secret:  process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt' as const },
  pages:   { signIn: '/login' },
  trustHost: true,
  providers: [],   // providers not needed for middleware JWT reading
  callbacks: {
    authorized({ auth }) {
      // Allow all requests; individual routes enforce their own auth
      return true
    },
  },
} satisfies NextAuthConfig
