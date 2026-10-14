import type { Metadata } from 'next'
import React from 'react'

import './styles.css'

export const metadata: Metadata = {
  title: 'Nihongo Mock',
}

// Temporary shell. Phase 8 replaces it with the next-intl /[locale] layout and the approved design system.
export default function FrontendLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
