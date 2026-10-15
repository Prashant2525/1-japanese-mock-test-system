'use client'

import type { ReactNode } from 'react'

/**
 * Wraps media whose download the editor did not allow (D-097): no context menu ("Save image as")
 * and no dragging out. A deterrent only — screenshots and developer tools still work.
 */
export function NoSave({ on, children }: { on: boolean; children: ReactNode }) {
  if (!on) return <>{children}</>
  const block = (e: React.SyntheticEvent) => e.preventDefault()
  return (
    <div onContextMenu={block} onDragStart={block} className="select-none">
      {children}
    </div>
  )
}
