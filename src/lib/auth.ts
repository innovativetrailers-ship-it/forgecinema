import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import Credentials from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import bcrypt from 'bcryptjs'
import { db } from './db'

const isBuildTime =
  process.env.NEXT_PHASE === 'phase-production-build' ||
  process.env.NEXT_PHASE === 'phase-export'

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  adapter: isBuildTime ? undefined : PrismaAdapter(db),
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  trustHost: true,
  logger: {
    error(code, ...message) {
      console.error('[Auth Error]', code, JSON.stringify(message))
    },
  },
  providers: [
    Google({
      clientId:     process.env.GOOGLE_CLIENT_ID     ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    }),
    Credentials({
      name: 'credentials',
      credentials: {
        email:    { label: 'Email',    type: 'email'    },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (process.env.NODE_ENV === 'development' && credentials?.email === 'dev@cinema.local') {
          return { id: 'dev-user-001', email: 'dev@cinema.local', name: 'Dev User', role: 'ADMIN', creditBalance: 9_999_999 }
        }

        if (!credentials?.email || !credentials?.password) return null

        const user = await db.user.findUnique({
          where:  { email: credentials.email as string },
          select: { id: true, email: true, name: true, avatarUrl: true, role: true, creditBalance: true, passwordHash: true, subscriptionStatus: true },
        })

        if (!user?.passwordHash) return null

        const isValid = await bcrypt.compare(credentials.password as string, user.passwordHash)
        if (!isValid) return null

        return {
          id:                 user.id,
          email:              user.email,
          name:               user.name,
          image:              user.avatarUrl,
          role:               user.role,
          creditBalance:      user.creditBalance,
          subscriptionStatus: user.subscriptionStatus,
        }
      },
    }),
  ],
  events: {
    async signIn({ user, isNewUser }) {
      console.log('[auth] signIn event:', { userId: user?.id, isNewUser })
    },
    async session({ session }) {
      console.log('[auth] session event: user', session?.user?.id)
    },
  },
  callbacks: {
    async jwt({ token, user, account, profile }) {
      console.log('[auth] jwt callback:', { hasUser: !!user, hasAccount: !!account })
      try {
        if (user) {
          token.id                 = user.id
          token.role               = (user as any).role
          token.creditBalance      = (user as any).creditBalance
          token.subscriptionStatus = (user as any).subscriptionStatus
        }
        return token
      } catch (err: any) {
        console.error('[auth] jwt callback error:', err.message)
        return token
      }
    },
    async session({ session, token }) {
      try {
        if (token && session.user) {
          session.user.id = (token.id ?? token.sub) as string
          ;(session.user as any).role               = token.role ?? 'FREE'
          ;(session.user as any).creditBalance      = token.creditBalance ?? 0
          ;(session.user as any).subscriptionStatus = token.subscriptionStatus ?? 'trial'
        }
        return session
      } catch (err: any) {
        console.error('[auth] session callback error:', err.message)
        return session
      }
    },
  },
})
