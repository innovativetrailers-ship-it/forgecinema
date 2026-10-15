import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface BrandLogoProps {
  size?: number
  showWordmark?: boolean
  wordmark?: string
  href?: string
  className?: string
}

export const BrandLogo = ({
  size = 36,
  showWordmark = true,
  wordmark = 'Cinematic Forge',
  href,
  className,
}: BrandLogoProps) => {
  const image = (
    <Image
      src="/brand/logo.png"
      alt="Cinematic Forge"
      width={size}
      height={size}
      className="object-contain h-auto w-full"
      style={{ maxWidth: size, height: 'auto' }}
      priority
    />
  )

  const content = (
    <div className={cn('flex items-center gap-2.5', className)}>
      {image}
      {showWordmark && (
        <span className="text-sm font-bold tracking-[0.12em] text-[var(--teal-bright,#00e5c8)]">
          {wordmark}
        </span>
      )}
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="hover:opacity-90 transition-opacity shrink-0">
        {content}
      </Link>
    )
  }

  return content
}
