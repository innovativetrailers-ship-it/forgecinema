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
  callbacks: {
    async jwt({ token, user, account }) {
      // Persist extra fields into JWT on first sign-in
      if (user) {
        token.id                = user.id
        token.role              = (user as Record<string, unknown>).role              as string | undefined
        token.creditBalance     = (user as Record<string, unknown>).creditBalance     as number | undefined
        token.subscriptionStatus = (user as Record<string, unknown>).subscriptionStatus as string | undefined
      }
      // For Google OAuth (account present), look up the DB user to get role/credits
      if (account?.provider === 'google' && token.sub) {
        try {
          const dbUser = await db.user.findUnique({
            where:  { id: token.sub },
            select: { id: true, role: true, creditBalance: true, subscriptionStatus: true },
          })
          if (dbUser) {
            token.id                = dbUser.id
            token.role              = dbUser.role
            token.creditBalance     = dbUser.creditBalance
            token.subscriptionStatus = dbUser.subscriptionStatus
          }
        } catch {
          // DB lookup failed — proceed with defaults
        }
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = (token.id ?? token.sub) as string
        ;(session.user as Record<string, unknown>).role              = (token.role              as string)  ?? 'FREE'
        ;(session.user as Record<string, unknown>).creditBalance     = (token.creditBalance     as number)  ?? 0
        ;(session.user as Record<string, unknown>).subscriptionStatus = (token.subscriptionStatus as string) ?? null
      }
      return session
    },
  },
})
