/**
 * Local trial content for the level check: `pnpm seed:sample-level-check`.
 *
 * Creates 5 clearly marked sample questions (【サンプル】) for each of N5, N4 and N3 and publishes
 * the level check (60% pass mark, 10 minutes per stage), so the owner can try the full flow before
 * adding real questions. D-024: real questions come from the owner; these are for local trial only.
 * Refuses to run when APP_ENV=production. Running it again does not duplicate anything.
 */
import 'dotenv/config'

import { SAMPLE_LEVEL_CHECK as SAMPLES } from './sample-level-check-data'

async function main() {
  if (process.env.APP_ENV === 'production') {
    throw new Error(
      'Sample questions are for local trial only; refusing to run with APP_ENV=production.',
    )
  }
  const { getPayload } = await import('payload')
  const { default: config } = await import('../src/payload.config')
  const payload = await getPayload({ config })

  // Run as a real Super Admin: Payload checks relationship filters with the caller's access.
  const admins = await payload.find({
    collection: 'admins',
    depth: 1,
    limit: 50,
    where: { status: { equals: 'active' } },
  })
  const superAdmin = admins.docs.find((a) =>
    (a.roles ?? []).some((r) => typeof r === 'object' && r.isSystem && r.name === 'Super Admin'),
  )
  if (!superAdmin)
    throw new Error('Create a Super Admin first: pnpm admin:create --email … --name …')
  const user = { ...superAdmin, collection: 'admins' as const, _strategy: 'totp' }

  const jlpt = (
    await payload.find({ collection: 'exam-types', where: { code: { equals: 'JLPT' } } })
  ).docs[0]
  if (!jlpt) throw new Error('The exam catalogue is missing (run pnpm migrate).')
  const stages = []
  for (const code of ['N5', 'N4', 'N3'] as const) {
    const level = (
      await payload.find({
        collection: 'levels',
        where: { and: [{ code: { equals: code } }, { examType: { equals: jlpt.id } }] },
      })
    ).docs[0]
    if (!level) throw new Error(`Level ${code} is missing.`)
    const ids: number[] = []
    for (const sample of SAMPLES[code]) {
      const stem = `【サンプル】${sample.stem}`
      const existing = await payload.find({
        collection: 'questions',
        where: { stem: { equals: stem } },
        limit: 1,
      })
      if (existing.docs[0]) {
        ids.push(existing.docs[0].id)
        continue
      }
      const q = await payload.create({
        collection: 'questions',
        locale: 'en',
        data: {
          examType: jlpt.id,
          level: level.id,
          stem,
          options: sample.options.map((text, i) => ({
            key: (['A', 'B', 'C', 'D'] as const)[i]!,
            text,
          })),
          correctOptionKey: sample.correct,
          explanation: `${sample.en} (Sample question for trying the level check locally; replace with your own.)`,
          marks: 1,
          rightsConfirmed: true,
          _status: 'published',
        },
      })
      await payload.update({
        collection: 'questions',
        id: q.id,
        locale: 'ja',
        data: {
          explanation: `${sample.ja}（ローカル確認用のサンプル問題です。実際の問題に置き換えてください。）`,
        },
      })
      ids.push(q.id)
    }
    stages.push({ level: level.id, thresholdPercent: 60, durationMinutes: 10, questions: ids })
  }
  await payload.updateGlobal({
    slug: 'level-check-settings',
    data: { stages, _status: 'published' },
    user,
    overrideAccess: false,
  })
  console.log(
    'Sample level check published: N5 → N4 → N3, 5 questions each, 60% to pass, 10 minutes per stage.',
  )
}

// Payload keeps its database pool open, so end the process explicitly.
main().then(
  () => process.exit(0),
  (err) => {
    console.error(err instanceof Error ? err.message : err)
    process.exit(1)
  },
)
