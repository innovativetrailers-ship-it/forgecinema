import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '404 — Page Not Found',
  description: 'This page does not exist.',
  robots: { index: false },
}

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center text-center px-6">
      {/* Film frame decoration */}
      <div className="flex gap-2 mb-12 opacity-40">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="w-5 h-5 bg-purple-600 rounded-sm" />
        ))}
      </div>

      <p className="text-purple-400 text-sm font-mono tracking-[0.3em] uppercase mb-4">
        404 — Frame Not Found
      </p>

      <h1 className="text-6xl sm:text-8xl font-bold text-white tracking-tight mb-6">
        Cut.
      </h1>

      <p className="text-zinc-400 text-lg max-w-md mb-12">
        This scene doesn&apos;t exist in the archive. The page may have been moved,
        deleted, or never existed.
      </p>

      <div className="flex gap-4">
        <Link
          href="/simple"
          className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium transition-colors"
        >
          Back to Studio
        </Link>
        <Link
          href="/"
          className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition-colors"
        >
          Go Home
        </Link>
      </div>

      {/* Bottom strip */}
      <div className="flex gap-2 mt-12 opacity-40">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="w-5 h-5 bg-purple-600 rounded-sm" />
        ))}
      </div>
    </div>
  )
}
