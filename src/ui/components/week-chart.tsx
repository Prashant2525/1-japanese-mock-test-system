import { getFormatter } from 'next-intl/server'

/**
 * Seven-day study activity (D-110, DASH-2): one column per Nepal day, height = study actions.
 * One series, so no legend — the card title names it. Columns ≤ 24 px with 4 px rounded tops on a
 * hairline baseline; only today's and the busiest day's values are written on the cap; every
 * column shows its value on hover and keyboard focus; a visually hidden table carries all values.
 */
export async function WeekChart({
  week,
  today,
  labels,
}: {
  week: { date: string; count: number }[]
  today: string
  labels: { day: string; actions: string; tooltip: string; today: string }
}) {
  const format = await getFormatter()
  const max = Math.max(1, ...week.map((d) => d.count))
  const busiest = week.reduce((a, b) => (b.count > a.count ? b : a), week[0]!)
  const dayName = (date: string, style: 'short' | 'long') =>
    format.dateTime(new Date(`${date}T00:00:00Z`), {
      weekday: style,
      ...(style === 'long' ? { month: 'short', day: 'numeric' } : {}),
      timeZone: 'UTC',
    })
  const tip = (d: { date: string; count: number }) =>
    labels.tooltip.replace('{day}', dayName(d.date, 'long')).replace('{count}', String(d.count))

  return (
    <div>
      <div className="flex h-36 items-end gap-2 border-b border-line">
        {week.map((d, i) => {
          const showValue = d.count > 0 && (d.date === today || d.date === busiest.date)
          return (
            <div
              key={d.date}
              role="img"
              tabIndex={0}
              aria-label={tip(d)}
              className="group relative flex h-full flex-1 flex-col items-center justify-end outline-none"
            >
              <span
                className={`pointer-events-none absolute -top-2 z-10 hidden -translate-y-full rounded-input bg-night px-2 py-1 text-xs font-bold whitespace-nowrap text-white shadow-card group-hover:block group-focus-visible:block ${i >= 4 ? 'right-0' : 'left-0'}`}
              >
                {tip(d)}
              </span>
              {showValue ? (
                <span className="mb-1 text-xs font-bold text-ink tabular-nums">{d.count}</span>
              ) : null}
              <span
                className="block w-full max-w-6 rounded-t-[4px] bg-signal transition-[height] duration-700 ease-standard group-focus-visible:ring-2 group-focus-visible:ring-focus motion-reduce:transition-none"
                style={{
                  height: d.count ? `${(d.count / max) * 85}%` : '2px',
                  opacity: d.count ? 1 : 0.35,
                }}
              />
            </div>
          )
        })}
      </div>
      <div className="mt-2 flex gap-2" aria-hidden="true">
        {week.map((d) => (
          <span
            key={d.date}
            className={
              d.date === today
                ? 'flex-1 text-center text-xs font-bold text-ink'
                : 'flex-1 text-center text-xs text-muted'
            }
          >
            {d.date === today ? labels.today : dayName(d.date, 'short')}
          </span>
        ))}
      </div>
      <table className="sr-only">
        <thead>
          <tr>
            <th scope="col">{labels.day}</th>
            <th scope="col">{labels.actions}</th>
          </tr>
        </thead>
        <tbody>
          {week.map((d) => (
            <tr key={d.date}>
              <th scope="row">{dayName(d.date, 'long')}</th>
              <td>{d.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
