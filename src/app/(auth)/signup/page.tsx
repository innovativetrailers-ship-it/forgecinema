'use client'

import { Suspense } from 'react'
import { SignupFlow } from '@/components/auth/SignupFlow'

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-[#0d1117] flex items-center justify-center px-4 py-12">
      <Suspense>
        <SignupFlow />
      </Suspense>
    </div>
  )
}
