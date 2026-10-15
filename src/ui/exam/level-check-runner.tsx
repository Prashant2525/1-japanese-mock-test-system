'use client'

import * as Dialog from '@radix-ui/react-dialog'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { Alert } from '../components/alert'
import { Button } from '../components/button'
import { RubyText } from '../components/ruby-text'
import { Spinner } from '../components/spinner'
import { apiRequest } from '../lib/api'
import { cn } from '../lib/cn'

/**
 * The level-check stage screen (UI_SCREEN_INVENTORY §3, "calm screen"). The server is the clock and
 * the judge: the timer shows the server deadline, answers are saved one by one, and scoring and the
 * next stage are decided by the server after submit. Phase 16 reuses this for mock tests.
 */
type Question = { key: string; stem: string; options: { key: string; text: string }[] }
type Attempt = {
  id: number
  status: 'in_progress' | 'submitted'
  levelCode: string
  deadlineAt: string
  serverNow: string
  questions: Question[]
  answers: Record<string, { o: string | null; f?: boolean }>
}
type StageInfo = { levelCode: string; durationMinutes: number; questionCount: number }
type State = {
  status: 'not_started' | 'in_progress' | 'completed'
  stages: StageInfo[]
  currentStageIndex: number | null
  currentAttempt: { id: number; status: string } | null
  outcomes: { levelCode: string; passed: boolean }[]
}
type Answer = { o: string | null; f: boolean }

type Phase =
  | { kind: 'loading' }
  | { kind: 'error' }
  | { kind: 'stale' }
  | { kind: 'between'; passed: string; next: StageInfo; timedOut: boolean }
  | { kind: 'running' }

export function LevelCheckRunner({ locale }: { locale: string }) {
  const t = useTranslations('exam')
  const [phase, setPhase] = useState<Phase>({ kind: 'loading' })
  const [attempt, setAttempt] = useState<Attempt | null>(null)
  const [answers, setAnswers] = useState<Record<string, Answer>>({})
  const [index, setIndex] = useState(0)
  const [now, setNow] = useState(() => Date.now())
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'retrying'>('idle')
  const [reviewOpen, setReviewOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const stages = useRef<StageInfo[]>([])
  const session = useRef('')
  const [offsetMs, setOffsetMs] = useState(0)
  const loadRef = useRef<(startNext?: boolean) => Promise<void>>(async () => {})
  const flushRef = useRef<() => Promise<unknown>>(async () => 'ok')
  const seq = useRef(0)
  const pending = useRef(new Map<string, Answer>())
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const finishing = useRef(false)

  const go = useCallback(
    // Full page loads between the runner and the rest of the student area (fresh server render).
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- intentional
    (path: string) => window.location.assign(`/${locale}${path}`),
    [locale],
  )

  /** Loads the current stage (creating its attempt if needed) and takes over this tab. */
  const load = useCallback(
    async (startNext = false) => {
      finishing.current = false
      const st = await apiRequest<State>('/api/v1/determination')
      if (!st.ok) return setPhase({ kind: 'error' })
      stages.current = st.data.stages
      if (st.data.status === 'completed') return go('/app/your-level')
      if (st.data.status === 'not_started') return go('/app/level-check')
      let attemptId = st.data.currentAttempt?.id
      const last = st.data.outcomes[st.data.outcomes.length - 1]
      // Between stages: show "passed" until the student chooses to start the next stage.
      if (!attemptId && !startNext && last?.passed && st.data.currentStageIndex !== null) {
        const next = st.data.stages[st.data.currentStageIndex]
        if (next)
          return setPhase({ kind: 'between', passed: last.levelCode, next, timedOut: false })
      }
      if (!attemptId) {
        const created = await apiRequest<{ attemptId: number }>(
          '/api/v1/determination/stages/current/attempt',
          { body: {} },
        )
        if (!created.ok) return setPhase({ kind: 'error' })
        attemptId = created.data.attemptId
      }
      const resumed = await apiRequest<{ sessionId: string }>(
        `/api/v1/attempts/${attemptId}/resume`,
        {
          body: {},
        },
      )
      if (!resumed.ok && resumed.error.code !== 'ATTEMPT_CLOSED') return setPhase({ kind: 'error' })
      const a = await apiRequest<Attempt>(`/api/v1/attempts/${attemptId}`)
      if (!a.ok) return setPhase({ kind: 'error' })
      if (a.data.status === 'submitted') {
        // Finished meanwhile (e.g. the time ran out): ask the server what comes next.
        return void loadRef.current()
      }
      session.current = resumed.ok ? resumed.data.sessionId : ''
      setOffsetMs(new Date(a.data.serverNow).getTime() - Date.now())
      seq.current = Date.now()
      pending.current.clear()
      setAttempt(a.data)
      setAnswers(
        Object.fromEntries(
          Object.entries(a.data.answers).map(([k, v]) => [k, { o: v.o ?? null, f: v.f === true }]),
        ),
      )
      const firstOpen = a.data.questions.findIndex((q) => !a.data.answers[q.key]?.o)
      setIndex(firstOpen === -1 ? 0 : firstOpen)
      setPhase({ kind: 'running' })
    },
    [go],
  )

  useEffect(() => {
    loadRef.current = load
    const id = setTimeout(() => void load(), 0)
    return () => clearTimeout(id)
  }, [load])

  /** Buttons that reload (retry, continue here, start the next stage) show the loading state. */
  const reload = (startNext = false) => {
    setPhase({ kind: 'loading' })
    void load(startNext)
  }

  /** Sends unsaved answers; retries every 2 s on network trouble. */
  const flush = useCallback(async (): Promise<'ok' | 'stale' | 'closed' | 'retry'> => {
    if (!attempt) return 'ok'
    if (retryTimer.current) clearTimeout(retryTimer.current)
    for (const [key, value] of [...pending.current.entries()]) {
      setSaveState('saving')
      seq.current = Math.max(Date.now(), seq.current + 1)
      const res = await apiRequest<{ saved: boolean }>(
        `/api/v1/attempts/${attempt.id}/answers/${encodeURIComponent(key)}`,
        {
          method: 'PUT',
          body: {
            optionKey: value.o,
            flagged: value.f,
            seq: seq.current,
            sessionId: session.current,
          },
        },
      )
      if (res.ok) {
        if (pending.current.get(key) === value) pending.current.delete(key)
        continue
      }
      if (res.error.code === 'STALE_SESSION') return 'stale'
      if (res.error.code === 'ATTEMPT_CLOSED') return 'closed'
      setSaveState('retrying')
      retryTimer.current = setTimeout(() => void flushRef.current(), 2000)
      return 'retry'
    }
    setSaveState('idle')
    return 'ok'
  }, [attempt])

  useEffect(() => {
    flushRef.current = flush
  }, [flush])

  const handleFlushResult = useCallback(
    (result: Awaited<ReturnType<typeof flush>>) => {
      if (result === 'stale') setPhase({ kind: 'stale' })
      if (result === 'closed') void load()
    },
    [load],
  )

  const record = (key: string, change: Partial<Answer>) => {
    const value = { o: answers[key]?.o ?? null, f: answers[key]?.f ?? false, ...change }
    setAnswers((prev) => ({ ...prev, [key]: value }))
    pending.current.set(key, value)
    void flush().then(handleFlushResult)
  }

  /** Submits (manually or when the time is up) and moves on as the server decides. */
  const submit = useCallback(
    async (timedOut: boolean) => {
      if (!attempt || finishing.current) return
      finishing.current = true
      setSubmitting(true)
      setReviewOpen(false)
      const flushed = await flush()
      if (flushed === 'stale') {
        finishing.current = false
        setSubmitting(false)
        return setPhase({ kind: 'stale' })
      }
      const res = await apiRequest<{
        passed: boolean
        next: { kind: 'next'; stageIndex: number } | { kind: 'done'; levelCode: string } | null
      }>(`/api/v1/attempts/${attempt.id}/submit`, { body: {} })
      setSubmitting(false)
      if (!res.ok) {
        finishing.current = false
        return setPhase({ kind: 'error' })
      }
      const next = res.data.next
      if (next?.kind === 'next' && stages.current[next.stageIndex]) {
        setAttempt(null)
        return setPhase({
          kind: 'between',
          passed: attempt.levelCode,
          next: stages.current[next.stageIndex]!,
          timedOut,
        })
      }
      go(timedOut ? '/app/your-level?timeUp=1' : '/app/your-level')
    },
    [attempt, flush, go],
  )

  // The clock: display only, synced to the server time; at zero the stage is submitted.
  useEffect(() => {
    if (phase.kind !== 'running' || !attempt) return
    const timer = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(timer)
  }, [phase.kind, attempt])

  const remainingMs = attempt ? new Date(attempt.deadlineAt).getTime() - (now + offsetMs) : 0

  useEffect(() => {
    if (phase.kind !== 'running' || !attempt || remainingMs > 0) return
    // Time is up: submit on the next tick (the server also enforces the deadline).
    const id = setTimeout(() => void submit(true), 0)
    return () => clearTimeout(id)
  }, [remainingMs, phase.kind, attempt, submit])

  // Spoken once each when 5 and 1 minutes remain (the live region announces text changes).
  const announcement =
    remainingMs > 0 && remainingMs <= 60_000
      ? t('timeLeftAria', { minutes: 1, seconds: 0 })
      : remainingMs > 0 && remainingMs <= 5 * 60_000
        ? t('timeLeftAria', { minutes: 5, seconds: 0 })
        : ''

  const counts = useMemo(() => {
    const qs = attempt?.questions ?? []
    const answered = qs.filter((q) => answers[q.key]?.o).length
    const flagged = qs.filter((q) => answers[q.key]?.f).length
    return { total: qs.length, answered, unanswered: qs.length - answered, flagged }
  }, [attempt, answers])

  if (phase.kind === 'loading') {
    return (
      <Centered>
        <Spinner />
        <p className="text-muted">{t('loading')}</p>
      </Centered>
    )
  }
  if (phase.kind === 'error') {
    return (
      <Centered>
        <Alert tone="danger">{t('loadError')}</Alert>
        <Button onClick={() => reload()}>{t('retry')}</Button>
      </Centered>
    )
  }
  if (phase.kind === 'stale') {
    return (
      <Centered>
        <h1 className="text-2xl font-bold">{t('staleTitle')}</h1>
        <p className="max-w-md text-center text-muted">{t('staleBody')}</p>
        <Button onClick={() => reload()}>{t('continueHere')}</Button>
      </Centered>
    )
  }
  if (phase.kind === 'between') {
    return (
      <Centered>
        {phase.timedOut ? <Alert tone="info">{t('timeUp')}</Alert> : null}
        <p className="font-sign text-sm font-bold tracking-widest text-success uppercase">✓</p>
        <h1 className="text-center text-3xl font-black">
          {t('stagePassedTitle', { level: phase.passed })}
        </h1>
        <p className="max-w-md text-center text-muted">
          {t('stagePassedBody', { next: phase.next.levelCode })}
        </p>
        <p className="text-sm text-muted">
          {t('stageInfo', {
            questions: phase.next.questionCount,
            minutes: phase.next.durationMinutes,
          })}
        </p>
        <Button size="lg" onClick={() => reload(true)}>
          {t('startNext', { level: phase.next.levelCode })}
        </Button>
      </Centered>
    )
  }

  if (!attempt) return null
  const question = attempt.questions[index]!
  const current = answers[question.key] ?? { o: null, f: false }
  const minutes = Math.max(0, Math.floor(remainingMs / 60_000))
  const seconds = Math.max(0, Math.floor((remainingMs % 60_000) / 1000))
  const lowTime = remainingMs < 60_000

  return (
    <div className="mx-auto grid min-h-dvh max-w-5xl grid-rows-[auto_1fr] gap-4 px-4 py-4">
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-card bg-surface px-4 py-3 shadow-card">
        <p className="font-bold">{t('stageLabel', { level: attempt.levelCode })}</p>
        <p className="text-sm text-muted" aria-live="polite">
          {saveState === 'saving'
            ? t('saving')
            : saveState === 'retrying'
              ? t('notSaved')
              : t('saved')}
        </p>
        <p
          role="timer"
          aria-label={t('timeLeftAria', { minutes, seconds })}
          className={cn(
            'rounded-full px-3 py-1 font-mono text-lg font-bold tabular-nums',
            lowTime ? 'bg-danger/10 text-danger' : 'bg-day text-ink',
          )}
        >
          <span className="sr-only">{t('timeLeft')} </span>
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </p>
        <p className="sr-only" aria-live="assertive">
          {announcement}
        </p>
      </header>

      <div className="grid items-start gap-4 lg:grid-cols-[1fr_16rem]">
        <main
          id="main"
          className="grid content-start gap-5 rounded-card bg-surface p-5 shadow-card sm:p-8"
        >
          <p className="text-sm font-bold text-muted">
            {t('questionOf', { current: index + 1, total: attempt.questions.length })}
          </p>
          <fieldset className="grid gap-4">
            <legend className="mb-4 text-xl leading-relaxed font-medium sm:text-2xl" lang="ja">
              <RubyText text={question.stem} />
            </legend>
            {question.options.map((option) => {
              const id = `q-${question.key}-${option.key}`
              const selected = current.o === option.key
              return (
                <label
                  key={option.key}
                  htmlFor={id}
                  className={cn(
                    'flex min-h-14 cursor-pointer items-center gap-4 rounded-card border-2 px-4 py-3 transition-colors',
                    selected ? 'border-signal bg-signal/5' : 'border-line hover:border-ink/40',
                  )}
                >
                  <input
                    id={id}
                    type="radio"
                    name={`q-${question.key}`}
                    className="size-5 accent-[var(--signal)]"
                    checked={selected}
                    onChange={() => record(question.key, { o: option.key })}
                    aria-label={`${t('answerOption', { key: option.key })}: ${option.text}`}
                  />
                  <span className="font-sign text-lg font-bold" aria-hidden="true">
                    {option.key}
                  </span>
                  <span className="text-lg" lang="ja">
                    <RubyText text={option.text} />
                  </span>
                </label>
              )
            })}
          </fieldset>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button
              variant="ghost"
              onClick={() => record(question.key, { f: !current.f })}
              aria-pressed={current.f}
            >
              {current.f ? `⚑ ${t('unflag')}` : `⚐ ${t('flag')}`}
            </Button>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                disabled={index === 0}
                onClick={() => setIndex(index - 1)}
              >
                {t('previous')}
              </Button>
              {index < attempt.questions.length - 1 ? (
                <Button onClick={() => setIndex(index + 1)}>{t('next')}</Button>
              ) : (
                <Button onClick={() => setReviewOpen(true)}>{t('review')}</Button>
              )}
            </div>
          </div>
        </main>

        <aside className="grid content-start gap-3 rounded-card bg-surface p-4 shadow-card">
          <h2 className="text-sm font-bold">{t('palette')}</h2>
          <ol className="grid grid-cols-5 gap-2">
            {attempt.questions.map((q, i) => {
              const a = answers[q.key]
              const state = [
                a?.o ? t('answered') : t('unanswered'),
                a?.f ? t('flaggedState') : null,
              ]
                .filter(Boolean)
                .join(', ')
              return (
                <li key={q.key}>
                  <button
                    type="button"
                    onClick={() => setIndex(i)}
                    aria-current={i === index ? 'step' : undefined}
                    aria-label={`${t('paletteItem', { number: i + 1 })}, ${state}`}
                    className={cn(
                      'relative grid size-10 place-items-center rounded-input border-2 text-sm font-bold',
                      a?.o ? 'border-night bg-night text-white' : 'border-line bg-surface',
                      i === index && 'ring-2 ring-signal ring-offset-2',
                    )}
                  >
                    {i + 1}
                    {a?.f ? (
                      <span
                        aria-hidden="true"
                        className="absolute -top-1.5 -right-1.5 text-xs text-warning"
                      >
                        ⚑
                      </span>
                    ) : null}
                  </button>
                </li>
              )
            })}
          </ol>
          <Button onClick={() => setReviewOpen(true)} loading={submitting}>
            {t('review')}
          </Button>
        </aside>
      </div>

      <Dialog.Root open={reviewOpen} onOpenChange={setReviewOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-night/60" />
          <Dialog.Content className="fixed top-1/2 left-1/2 z-50 grid w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-card bg-surface p-6 shadow-card">
            <Dialog.Title className="text-xl font-bold">{t('reviewTitle')}</Dialog.Title>
            <Dialog.Description className="text-muted">
              {t('reviewBody', { answered: counts.answered, total: counts.total })}
            </Dialog.Description>
            <ul className="grid gap-1 text-sm">
              <li>{t('reviewUnanswered', { count: counts.unanswered })}</li>
              <li>{t('reviewFlagged', { count: counts.flagged })}</li>
            </ul>
            <div className="flex flex-wrap justify-end gap-2">
              <Dialog.Close asChild>
                <Button variant="secondary">{t('keepWorking')}</Button>
              </Dialog.Close>
              <Button onClick={() => void submit(false)} loading={submitting}>
                {t('submit')}
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <main
      id="main"
      className="mx-auto grid min-h-dvh max-w-xl content-center justify-items-center gap-4 px-4 py-12"
    >
      {children}
    </main>
  )
}
