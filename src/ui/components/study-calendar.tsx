import { getFormatter } from 'next-intl/server'

import { addDays, addMonths, monthGrid } from '@/domain/study-days'
import { Link } from '@/i18n/navigation'

import { cn } from '../lib/cn'
import { PlanEditor } from './study-planner'

type Plan = { id: number; date: string; note: string; done: boolean }

/**
 * The study calendar (D-111): a month with the student's study days (a dot; more actions → a
 * fuller dot) and their own plans, today ringed and the selected day highlighted. Months and days
 * are plain links (?month=YYYY-MM&day=YYYY-MM-DD), so it works without JavaScript; the day panel
 * below lists that day's plans and lets the student add, tick or remove them.
 */
export async function StudyCalendar({
  month,
  day,
  today,
  actionsPerDay,
  plans,
  canAddFrom,
  canAddTo,
  labels,
}: {
  month: string
  day: string
  today: string
  actionsPerDay: Record<string, number>
  plans: Plan[]
  canAddFrom: string
  canAddTo: string
  labels: {
    previous: string
    next: string
    today: string
    studied: string
    planned: string
    dayPlans: string
    legendStudied: string
    legendPlanned: string
    editor: Parameters<typeof PlanEditor>[0]['labels']
  }
}) {
  const format = await getFormatter()
  const utc = (d: string) => new Date(`${d}T00:00:00Z`)
  const monthTitle = format.dateTime(utc(`${month}-01`), {
    year: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  })
  const weekdays = monthGrid('2026-11')[1]!.map((d) =>
    format.dateTime(utc(d!), { weekday: 'narrow', timeZone: 'UTC' }),
  ) // 1–7 Nov 2026 is Sunday–Saturday
  const plansOn = (d: string) => plans.filter((p) => p.date === d)
  const href = (m: string, d?: string) => ({
    pathname: '/app',
    query: d ? { month: m, day: d } : { month: m },
    hash: 'calendar',
  })
  const dayLabel = (d: string) => {
    const n = actionsPerDay[d] ?? 0
    const p = plansOn(d).length
    return [
      format.dateTime(utc(d), { dateStyle: 'full', timeZone: 'UTC' }),
      d === today ? labels.today : null,
      n ? labels.studied.replace('{count}', String(n)) : null,
      p ? labels.planned.replace('{count}', String(p)) : null,
    ]
      .filter(Boolean)
      .join(', ')
  }
  const selectedPlans = plansOn(day)

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between gap-2">
        <Link
          href={href(addMonths(month, -1))}
          scroll={false}
          className="grid size-10 place-items-center rounded-full border border-line hover:border-ink/40"
          aria-label={labels.previous}
        >
          <span aria-hidden="true">‹</span>
        </Link>
        <p className="font-bold" aria-live="polite">
          {monthTitle}
        </p>
        <Link
          href={href(addMonths(month, 1))}
          scroll={false}
          className="grid size-10 place-items-center rounded-full border border-line hover:border-ink/40"
          aria-label={labels.next}
        >
          <span aria-hidden="true">›</span>
        </Link>
      </div>

      <table className="w-full table-fixed border-separate border-spacing-1 text-center">
        <caption className="sr-only">{monthTitle}</caption>
        <thead>
          <tr>
            {weekdays.map((w, i) => (
              <th key={i} scope="col" className="pb-1 text-xs font-bold text-muted">
                {w}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {monthGrid(month).map((week, wi) => (
            <tr key={wi}>
              {week.map((d, di) => {
                if (!d) return <td key={di} />
                const n = actionsPerDay[d] ?? 0
                const p = plansOn(d)
                const selected = d === day
                return (
                  <td key={di} className="p-0">
                    <Link
                      href={href(month, d)}
                      scroll={false}
                      aria-label={dayLabel(d)}
                      aria-current={selected ? 'date' : undefined}
                      className={cn(
                        'relative mx-auto flex aspect-square w-full max-w-12 flex-col items-center justify-center rounded-input text-sm tabular-nums transition-colors',
                        selected ? 'bg-night text-white' : 'hover:bg-day',
                        d === today && !selected && 'ring-2 ring-signal ring-inset',
                      )}
                    >
                      <span className={cn(d === today && 'font-black')}>{Number(d.slice(8))}</span>
                      <span aria-hidden="true" className="mt-0.5 flex h-1.5 items-center gap-0.5">
                        {n ? (
                          <span
                            className={cn(
                              'block rounded-full bg-signal',
                              n >= 3 ? 'size-1.5' : n === 2 ? 'size-[5px]' : 'size-1',
                            )}
                          />
                        ) : null}
                        {p.length ? (
                          <span
                            className={cn(
                              'block size-1.5 rounded-[2px]',
                              selected ? 'bg-white' : 'bg-night',
                              p.every((x) => x.done) && 'opacity-40',
                            )}
                          />
                        ) : null}
                      </span>
                    </Link>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <p className="flex flex-wrap gap-4 text-xs text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="block size-1.5 rounded-full bg-signal" />
          {labels.legendStudied}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="block size-1.5 rounded-[2px] bg-night" />
          {labels.legendPlanned}
        </span>
      </p>

      <section aria-labelledby="day-plans" className="grid gap-3 rounded-input bg-day p-4">
        <h3 id="day-plans" className="font-bold">
          {labels.dayPlans.replace(
            '{date}',
            format.dateTime(utc(day), {
              month: 'long',
              day: 'numeric',
              weekday: 'short',
              timeZone: 'UTC',
            }),
          )}
        </h3>
        <PlanEditor
          date={day}
          plans={selectedPlans}
          canAdd={day >= canAddFrom && day <= canAddTo}
          labels={labels.editor}
        />
      </section>
    </div>
  )
}

export const calendarRange = (today: string) => ({
  from: addDays(today, -31),
  to: addDays(today, 366),
})
