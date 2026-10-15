import Link from 'next/link'

export function NarrowEditorNotice({ mode }: { mode: 'Ultimate' | 'Advanced' }) {
  return (
    <div className="flex flex-1 items-center justify-center px-6 py-16 text-center">
      <div className="max-w-sm">
        <p className="text-sm text-[var(--text-primary)]">{mode} needs a wider screen.</p>
        <Link href="/simple" className="mt-3 inline-block text-sm text-[var(--teal-bright)] underline">
          Open Simple mode
        </Link>
      </div>
    </div>
  )
}
