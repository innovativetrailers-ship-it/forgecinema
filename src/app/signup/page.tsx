import { Suspense } from 'react'
import { SignupFlow } from '@/components/auth/SignupFlow'

export const metadata = {
  title: 'Sign Up — Cinematic Forge',
  description: 'Create your Cinematic Forge account and start generating film-quality video.',
}

export default function SignupPage() {
  return (
    <main className="min-h-screen bg-[#0d1117] flex items-center justify-center px-4 py-16">
      <Suspense fallback={
        <div className="w-8 h-8 border border-[#00e5c8]/30 border-t-[#00e5c8] rounded-full animate-spin" />
      }>
        <SignupFlow />
      </Suspense>
    </main>
  )
}
