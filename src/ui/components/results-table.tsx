import { getFormatter, getTranslations } from 'next-intl/server'

import type { ResultListItem } from '@/server/student/areas'

/**
 * The student's results as a table (results page and dashboard). Level-check rows read "Level
 * check · {level} stage"; mock-test rows use their saved title (Phase 16+). Pass/fail is shown
 * only because each result stores its own outcome under a defined pass mark.
 */
export async function ResultsTable({
  results,
  locale,
  caption,
}: {
  results: ResultListItem[]
  locale: 'en' | 'ja'
  caption: string
}) {
  const t = await getTranslations('student.results')
  const format = await getFormatter()
  return (
    <div className="overflow-x-auto rounded-card bg-surface shadow-card">
      <table className="w-full min-w-[34rem] text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="border-b border-line text-xs tracking-wider text-muted uppercase">
          <tr>
            <th scope="col" className="px-5 py-3 font-bold">
              {t('colTest')}
            </th>
            <th scope="col" className="px-5 py-3 font-bold">
              {t('colScore')}
            </th>
            <th scope="col" className="px-5 py-3 font-bold">
              {t('colOutcome')}
            </th>
            <th scope="col" className="px-5 py-3 font-bold">
              {t('colDate')}
            </th>
          </tr>
        </thead>
        <tbody>
          {results.map((r) => {
            const level = r.title?.[locale] ?? r.levelCode ?? ''
            return (
              <tr key={r.id} className="border-b border-line last:border-0">
                <th scope="row" className="px-5 py-4 font-bold">
                  {r.kind === 'determination' ? t('levelCheckStage', { level }) : level}
                </th>
                <td className="px-5 py-4 font-bold tabular-nums">
                  {t('percent', { percent: Math.round(r.percent) })}
                </td>
                <td className="px-5 py-4">
                  <span
                    className={
                      r.passed
                        ? 'inline-flex rounded-full border border-success/40 bg-success/10 px-3 py-0.5 text-xs font-bold'
                        : 'inline-flex rounded-full border border-line bg-day px-3 py-0.5 text-xs font-bold'
                    }
                  >
                    {r.passed ? t('passed') : t('notPassed')}
                  </span>
                </td>
                <td className="px-5 py-4 whitespace-nowrap text-muted">
                  {format.dateTime(new Date(r.createdAt), { dateStyle: 'medium' })}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
