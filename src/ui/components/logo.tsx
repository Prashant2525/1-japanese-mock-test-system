import Image from 'next/image'

import { cn } from '../lib/cn'

const FILES = {
  'wordmark-day': { src: '/brand/nihongo-mock-wordmark.svg', w: 742, h: 220 },
  'wordmark-night': { src: '/brand/nihongo-mock-wordmark-reversed.svg', w: 742, h: 220 },
  'lockup-day': { src: '/brand/nihongo-mock-logo.svg', w: 900, h: 220 },
  'lockup-night': { src: '/brand/nihongo-mock-logo-reversed.svg', w: 900, h: 220 },
} as const

/**
 * Brand logo (outlined variants from public/brand, D-048). The alt text is the brand name.
 * Logo files become CMS-uploadable in Phase 18 (site settings); these are the defaults.
 */
export function Logo({
  variant = 'wordmark',
  tone = 'day',
  className,
  alt = 'Nihongo Mock',
}: {
  variant?: 'wordmark' | 'lockup'
  tone?: 'day' | 'night'
  className?: string
  alt?: string
}) {
  const file = FILES[`${variant}-${tone}`]
  return (
    <Image
      src={file.src}
      width={file.w}
      height={file.h}
      alt={alt}
      unoptimized
      priority
      className={cn('h-10 w-auto', className)}
    />
  )
}
