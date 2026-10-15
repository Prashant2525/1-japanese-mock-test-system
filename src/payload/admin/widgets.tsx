import type { PayloadRequest, Where } from 'payload'

import { can, type Permission } from '@/server/auth/permissions'
import { JLPT_CODE } from '@/server/catalogue/rules'
import { getEnv } from '@/server/env'

/**
 * Admin dashboard widgets (Phase 9). Server components rendered by Payload's dashboard: every
 * number comes from the database at view time, and each widget checks the viewer's permission
 * itself (an admin may keep a saved layout after losing a permission).
 */
type WidgetProps = { req: PayloadRequest }

type Text = { en: string; ja: string }
const pick = (req: PayloadRequest, text: Text) => (req.i18n?.language === 'ja' ? text.ja : text.en)

const T = {
  noAccess: {
    en: 'You do not have access to this information.',
    ja: 'この情報を表示する権限がありません。',
  },
  students: { en: 'Students', ja: '受講者' },
  total: { en: 'Total', ja: '合計' },
  confirmed: { en: 'Email confirmed', ja: 'メール確認済み' },
  newThisWeek: { en: 'Joined in the last 7 days', ja: '過去7日間の新規登録' },
  viaGoogle: { en: 'Linked to Google', ja: 'Google 連携' },
  levelCheck: { en: 'Level check', ja: 'レベルチェック' },
  notStarted: { en: 'Not started', ja: '未実施' },
  inProgress: { en: 'In progress', ja: '実施中' },
  completed: { en: 'Completed', ja: '完了' },
  suspended: { en: 'Suspended', ja: '停止中' },
  viewAll: { en: 'View all', ja: 'すべて表示' },
  catalogue: { en: 'Exam catalogue', ja: '試験カタログ' },
  ladder: { en: 'Level check route', ja: 'レベルチェックの順路' },
  study: { en: 'Study library levels', ja: '学習教材のレベル' },
  mockLevels: { en: 'mock-test levels', ja: '模擬試験レベル' },
  disabled: { en: 'Disabled', ja: '無効' },
  none: { en: 'None', ja: 'なし' },
  activity: { en: 'Recent activity', ja: '最近の操作' },
  noActivity: { en: 'Nothing recorded yet.', ja: 'まだ記録はありません。' },
  system: { en: 'System', ja: 'システム' },
  student: { en: 'Student', ja: '受講者' },
  removedAdmin: { en: 'Removed admin', ja: '削除済みの管理者' },
  setup: { en: 'Setup checklist', ja: 'セットアップ確認' },
  email: { en: 'Email delivery', ja: 'メール送信' },
  emailConsole: {
    en: 'Not sent: emails are printed in the server log (development).',
    ja: '送信されません：メールはサーバーログに表示されます（開発用）。',
  },
  emailMemory: {
    en: 'Test mode: emails are kept in memory.',
    ja: 'テストモード：メールはメモリに保持されます。',
  },
  emailNoDomain: {
    en: 'Sent through Resend, but the sender is a placeholder address. Verify your domain in Resend.',
    ja: 'Resend で送信しますが、送信元が仮のアドレスです。Resend でドメインを認証してください。',
  },
  emailReady: { en: 'Sent through Resend from', ja: 'Resend で送信：送信元' },
  google: { en: 'Continue with Google', ja: 'Google で続ける' },
  googleNoKeys: {
    en: 'Hidden: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are not set on the server.',
    ja: '非表示：サーバーに GOOGLE_CLIENT_ID と GOOGLE_CLIENT_SECRET が設定されていません。',
  },
  googleOff: {
    en: 'Hidden: switched off in Settings → Sign-in options.',
    ja: '非表示：設定 → ログイン方法 でオフになっています。',
  },
  googleOn: {
    en: 'Shown on the login and sign-up pages.',
    ja: 'ログイン・登録ページに表示されています。',
  },
  mfa: { en: 'Admin two-factor login', ja: '管理者の2段階認証' },
  mfaOn: { en: 'Required for every admin.', ja: 'すべての管理者に必須です。' },
  address: { en: 'Site address', ja: 'サイトのアドレス' },
  addressLocal: {
    en: 'not https yet (fine for local development).',
    ja: 'まだ https ではありません（ローカル開発では問題ありません）。',
  },
} satisfies Record<string, Text>

function Card({
  title,
  href,
  req,
  children,
}: {
  title: string
  href?: string
  req: PayloadRequest
  children: React.ReactNode
}) {
  return (
    <section className="nm-widget" aria-label={title}>
      <header className="nm-widget__head">
        <h2 className="nm-widget__title">{title}</h2>
        {href ? (
          <a className="nm-widget__link" href={href}>
            {pick(req, T.viewAll)}
          </a>
        ) : null}
      </header>
      {children}
    </section>
  )
}

function Denied({ req, title }: { req: PayloadRequest; title: Text }) {
  return (
    <Card title={pick(req, title)} req={req}>
      <p className="nm-widget__muted">{pick(req, T.noAccess)}</p>
    </Card>
  )
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="nm-stat">
      <span className="nm-stat__value">{value}</span>
      <span className="nm-stat__label">{label}</span>
    </div>
  )
}

/** ISO timestamp n days ago (server components render once per request, so this is stable). */
const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString()

const allowed = (req: PayloadRequest, permission: Permission) => can(req.user, permission)

async function countStudents(req: PayloadRequest, where?: Where): Promise<number> {
  const { totalDocs } = await req.payload.count({
    collection: 'students',
    where,
    overrideAccess: true,
  })
  return totalDocs
}

export async function StudentsWidget({ req }: WidgetProps) {
  if (!allowed(req, 'students.read')) return <Denied req={req} title={T.students} />
  const weekAgo = daysAgo(7)
  const [total, confirmed, recent, google, notStarted, inProgress, completed, suspended] =
    await Promise.all([
      countStudents(req),
      countStudents(req, { _verified: { equals: true } }),
      countStudents(req, { createdAt: { greater_than_equal: weekAgo } }),
      countStudents(req, { googleSub: { exists: true } }),
      countStudents(req, { determinationStatus: { equals: 'not_started' } }),
      countStudents(req, { determinationStatus: { equals: 'in_progress' } }),
      countStudents(req, { determinationStatus: { equals: 'completed' } }),
      countStudents(req, { status: { equals: 'suspended' } }),
    ])
  return (
    <Card title={pick(req, T.students)} href="/admin/collections/students" req={req}>
      <div className="nm-stats">
        <Stat label={pick(req, T.total)} value={total} />
        <Stat label={pick(req, T.confirmed)} value={confirmed} />
        <Stat label={pick(req, T.newThisWeek)} value={recent} />
        <Stat label={pick(req, T.viaGoogle)} value={google} />
        <Stat label={pick(req, T.suspended)} value={suspended} />
      </div>
      <h3 className="nm-widget__subtitle">{pick(req, T.levelCheck)}</h3>
      <div className="nm-stats">
        <Stat label={pick(req, T.notStarted)} value={notStarted} />
        <Stat label={pick(req, T.inProgress)} value={inProgress} />
        <Stat label={pick(req, T.completed)} value={completed} />
      </div>
    </Card>
  )
}

type LevelDoc = {
  id: number
  code: string
  name: string
  order: number
  lineColor: string
  examType: { id: number; code: string } | number
  enabledForMockTests?: boolean | null
  enabledForDetermination?: boolean | null
  enabledForStudy?: boolean | null
}

export async function CatalogueWidget({ req }: WidgetProps) {
  if (!allowed(req, 'catalogue.manage')) return <Denied req={req} title={T.catalogue} />
  const locale = req.i18n?.language === 'ja' ? 'ja' : 'en'
  const [types, levels] = await Promise.all([
    req.payload.find({
      collection: 'exam-types',
      sort: 'order',
      limit: 50,
      depth: 0,
      locale,
      overrideAccess: true,
    }),
    req.payload.find({
      collection: 'levels',
      sort: 'order',
      pagination: false,
      depth: 1,
      locale,
      overrideAccess: true,
    }),
  ])
  const all = levels.docs as unknown as LevelDoc[]
  const typeCode = (l: LevelDoc) => (typeof l.examType === 'object' ? l.examType.code : '')
  const jlpt = all.filter((l) => typeCode(l) === JLPT_CODE)
  const ladder = jlpt.filter((l) => l.enabledForDetermination)
  const study = jlpt.filter((l) => l.enabledForStudy)
  return (
    <Card title={pick(req, T.catalogue)} href="/admin/collections/levels" req={req}>
      <ul className="nm-list">
        {types.docs.map((type) => {
          const mock = all.filter(
            (l) =>
              typeof l.examType === 'object' && l.examType.id === type.id && l.enabledForMockTests,
          ).length
          return (
            <li key={type.id} className="nm-list__row">
              <span>
                <strong>{type.code}</strong> · {type.name}
              </span>
              <span className={type.enabled ? '' : 'nm-widget__muted'}>
                {type.enabled ? `${mock} ${pick(req, T.mockLevels)}` : pick(req, T.disabled)}
              </span>
            </li>
          )
        })}
      </ul>
      <h3 className="nm-widget__subtitle">{pick(req, T.ladder)}</h3>
      {ladder.length ? (
        <ol className="nm-route" aria-label={pick(req, T.ladder)}>
          {ladder.map((l) => (
            <li
              key={l.id}
              className="nm-route__stop"
              style={{ ['--nm-stop' as string]: l.lineColor }}
            >
              <span className="nm-route__dot" aria-hidden="true" />
              {l.code}
            </li>
          ))}
        </ol>
      ) : (
        <p className="nm-widget__muted">{pick(req, T.none)}</p>
      )}
      <h3 className="nm-widget__subtitle">{pick(req, T.study)}</h3>
      <p>{study.length ? study.map((l) => l.code).join(' · ') : pick(req, T.none)}</p>
    </Card>
  )
}

export async function ActivityWidget({ req }: WidgetProps) {
  if (!allowed(req, 'audit.read')) return <Denied req={req} title={T.activity} />
  const events = await req.payload.find({
    collection: 'audit-events',
    sort: '-createdAt',
    limit: 8,
    depth: 0,
    overrideAccess: true,
  })
  const adminIds = [
    ...new Set(
      events.docs.filter((e) => e.actorType === 'admin' && e.actorId).map((e) => Number(e.actorId)),
    ),
  ]
  const admins = adminIds.length
    ? await req.payload.find({
        collection: 'admins',
        where: { id: { in: adminIds } },
        limit: adminIds.length,
        depth: 0,
        overrideAccess: true,
      })
    : { docs: [] }
  const nameOf = new Map(admins.docs.map((a) => [String(a.id), a.name]))
  const format = new Intl.DateTimeFormat(req.i18n?.language === 'ja' ? 'ja-JP' : 'en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Kathmandu',
  })
  return (
    <Card title={pick(req, T.activity)} href="/admin/collections/audit-events" req={req}>
      {events.docs.length ? (
        <ul className="nm-list">
          {events.docs.map((e) => (
            <li key={e.id} className="nm-list__row">
              <span>
                <code>{e.action}</code>
                {e.summary ? <span className="nm-widget__muted"> · {e.summary}</span> : null}
              </span>
              <span className="nm-widget__muted">
                {e.actorType === 'admin'
                  ? (nameOf.get(String(e.actorId)) ?? `${pick(req, T.removedAdmin)} #${e.actorId}`)
                  : pick(req, e.actorType === 'student' ? T.student : T.system)}{' '}
                · {format.format(new Date(e.createdAt))}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="nm-widget__muted">{pick(req, T.noActivity)}</p>
      )}
    </Card>
  )
}

function Check({ ok, title, detail }: { ok: boolean; title: string; detail: string }) {
  return (
    <li className="nm-check">
      <span
        className={ok ? 'nm-check__icon nm-check__icon--ok' : 'nm-check__icon nm-check__icon--todo'}
        aria-hidden="true"
      >
        {ok ? '✓' : '!'}
      </span>
      <span>
        <strong>{title}</strong>
        <span className="nm-check__detail">{detail}</span>
      </span>
    </li>
  )
}

/** What still needs the owner's attention before launch. Shows states, never secret values. */
export async function SetupWidget({ req }: WidgetProps) {
  if (!allowed(req, 'settings.manage')) return <Denied req={req} title={T.setup} />
  const env = getEnv()
  const settings = await req.payload.findGlobal({ slug: 'sign-in-settings', depth: 0 })
  const googleKeys = Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET)
  const googleOn = googleKeys && settings.googleEnabled !== false
  const emailReady =
    env.EMAIL_TRANSPORT === 'resend' && !env.EMAIL_FROM_ADDRESS.endsWith('.invalid')
  const emailDetail =
    env.EMAIL_TRANSPORT === 'console'
      ? pick(req, T.emailConsole)
      : env.EMAIL_TRANSPORT === 'memory'
        ? pick(req, T.emailMemory)
        : emailReady
          ? `${pick(req, T.emailReady)} ${env.EMAIL_FROM_ADDRESS}`
          : pick(req, T.emailNoDomain)
  const https = env.APP_URL.startsWith('https://')
  return (
    <Card title={pick(req, T.setup)} req={req}>
      <ul className="nm-checks">
        <Check ok={emailReady} title={pick(req, T.email)} detail={emailDetail} />
        <Check
          ok={googleOn}
          title={pick(req, T.google)}
          detail={pick(req, googleOn ? T.googleOn : googleKeys ? T.googleOff : T.googleNoKeys)}
        />
        <Check ok title={pick(req, T.mfa)} detail={pick(req, T.mfaOn)} />
        <Check
          ok={https}
          title={pick(req, T.address)}
          detail={https ? env.APP_URL : `${env.APP_URL} — ${pick(req, T.addressLocal)}`}
        />
      </ul>
    </Card>
  )
}
