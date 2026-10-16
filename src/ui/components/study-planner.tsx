'use client'

import { useState, type FormEvent } from 'react'

import { useRouter } from '@/i18n/navigation'

import { cn } from '../lib/cn'

type Plan = { id: number; date: string; note: string; done: boolean }

async function send(url: string, method: string, body?: unknown): Promise<boolean> {
  const res = await fetch(url, {
    method,
    credentials: 'same-origin',
    headers: body === undefined ? undefined : { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  return res.ok
}

/**
 * The selected day's study plans (D-111): add a short note, tick it off, remove it. The server
 * stores them for the signed-in student only; the page then refreshes its server data.
 */
export function PlanEditor({
  date,
  plans,
  canAdd,
  labels,
}: {
  date: string
  plans: Plan[]
  canAdd: boolean
  labels: {
    add: string
    placeholder: string
    noteLabel: string
    done: string
    remove: string
    empty: string
    failed: string
    full: string
  }
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  // Ticks show at once; they revert if the server refuses.
  const [ticked, setTicked] = useState<Record<number, boolean>>({})

  async function run(action: () => Promise<boolean>) {
    setBusy(true)
    setError('')
    const ok = await action().catch(() => false)
    setBusy(false)
    if (!ok) setError(labels.failed)
    else router.refresh()
    return ok
  }

  async function add(e: FormEvent) {
    e.preventDefault()
    // Read from the form itself, so text typed before the page finished loading still counts.
    const form = e.currentTarget as HTMLFormElement
    const field = form.elements.namedItem('note') as HTMLInputElement
    const note = field.value.trim()
    if (!note) return
    if (await run(() => send('/api/v1/me/plans', 'POST', { date, note }))) form.reset()
  }

  const full = plans.length >= 5
  return (
    <div className="grid gap-3">
      {plans.length ? (
        <ul className="grid gap-2">
          {plans.map((p) => (
            <li
              key={p.id}
              className="flex items-center gap-3 rounded-input border border-line px-3 py-2"
            >
              <input
                type="checkbox"
                checked={ticked[p.id] ?? p.done}
                disabled={busy}
                onChange={async () => {
                  const next = !(ticked[p.id] ?? p.done)
                  setTicked((t) => ({ ...t, [p.id]: next }))
                  const ok = await run(() =>
                    send(`/api/v1/me/plans/${p.id}`, 'PATCH', { done: next }),
                  )
                  if (!ok) setTicked((t) => ({ ...t, [p.id]: !next }))
                }}
                aria-label={`${labels.done}: ${p.note}`}
                className="size-5 accent-[var(--signal)]"
              />
              <span
                className={cn(
                  'flex-1 text-sm',
                  (ticked[p.id] ?? p.done) && 'text-muted line-through',
                )}
              >
                {p.note}
              </span>
              <button
                type="button"
                disabled={busy}
                onClick={() => run(() => send(`/api/v1/me/plans/${p.id}`, 'DELETE'))}
                className="min-h-9 rounded-input px-2 text-xs font-bold text-muted underline underline-offset-4 hover:text-ink"
              >
                {labels.remove}
                <span className="sr-only">: {p.note}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">{labels.empty}</p>
      )}
      {canAdd ? (
        full ? (
          <p className="text-sm text-muted">{labels.full}</p>
        ) : (
          <form onSubmit={add} className="flex flex-wrap gap-2">
            <label className="sr-only" htmlFor="plan-note">
              {labels.noteLabel}
            </label>
            <input
              id="plan-note"
              name="note"
              required
              maxLength={80}
              placeholder={labels.placeholder}
              className="min-h-11 flex-1 basis-48 rounded-input border border-line bg-surface px-3 text-sm"
            />
            <button
              type="submit"
              disabled={busy}
              className="min-h-11 rounded-full bg-night px-5 text-sm font-bold text-white disabled:opacity-50"
            >
              {labels.add}
            </button>
          </form>
        )
      ) : null}
      <p role="status" className="text-sm text-danger">
        {error}
      </p>
    </div>
  )
}

/** The daily goal in materials (D-110, DASH-3): 1–5, saved for the signed-in student. */
export function GoalPicker({ goal, label }: { goal: number; label: string }) {
  const router = useRouter()
  const [value, setValue] = useState(goal)
  const [busy, setBusy] = useState(false)
  return (
    <label className="inline-flex items-center gap-2 text-xs text-muted">
      {label}
      <select
        value={value}
        disabled={busy}
        onChange={async (e) => {
          const next = Number(e.target.value)
          setValue(next)
          setBusy(true)
          const ok = await send('/api/v1/me/goal', 'PUT', { dailyGoal: next }).catch(() => false)
          setBusy(false)
          if (ok) router.refresh()
          else setValue(goal)
        }}
        className="min-h-9 rounded-input border border-line bg-surface px-2 text-sm font-bold text-ink"
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
    </label>
  )
}
