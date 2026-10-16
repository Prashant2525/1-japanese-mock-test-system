'use client'

import { useState } from 'react'

import { cn } from '../lib/cn'

/**
 * "Mark as studied" (RV-12): the only thing that counts a material as studied — opening a page
 * does not. The server records it for the signed-in student and answers with the stored time.
 */
export function MarkStudied({
  slug,
  initialStudiedAt,
  labels,
}: {
  slug: string
  initialStudiedAt: string | null
  labels: { mark: string; done: string; undo: string; failed: string }
}) {
  const [studiedAt, setStudiedAt] = useState(initialStudiedAt)
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)

  async function toggle() {
    setBusy(true)
    setFailed(false)
    try {
      const res = await fetch(`/api/v1/study/materials/${encodeURIComponent(slug)}/progress`, {
        method: 'PUT',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ studied: !studiedAt }),
      })
      if (!res.ok) throw new Error(String(res.status))
      setStudiedAt(((await res.json()) as { studiedAt: string | null }).studiedAt)
    } catch {
      setFailed(true)
    } finally {
      setBusy(false)
    }
  }

  const done = Boolean(studiedAt)
  return (
    <div className="flex flex-wrap items-center gap-3">
      {done ? (
        <>
          <span className="inline-flex min-h-11 items-center gap-2 rounded-full border border-success bg-surface px-5 text-sm font-bold">
            <span aria-hidden="true" className="text-success">
              ✓
            </span>
            {labels.done}
          </span>
          <button
            type="button"
            onClick={toggle}
            disabled={busy}
            className="min-h-11 text-sm text-muted underline underline-offset-4 disabled:opacity-60"
          >
            {labels.undo}
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={toggle}
          disabled={busy}
          className={cn(
            'inline-flex min-h-11 items-center gap-2 rounded-full bg-signal px-5 text-sm font-bold text-white transition-colors hover:bg-signal-hover disabled:opacity-60',
          )}
        >
          {labels.mark}
        </button>
      )}
      <span role="status" className="text-sm text-danger">
        {failed ? labels.failed : ''}
      </span>
    </div>
  )
}
