/**
 * How UI-label namespaces (top-level keys of messages/en.json) are split into CMS globals.
 * PostgreSQL limits a function to 100 arguments and Payload reads all localized columns of a
 * global in one json_build_array call, so each global must stay well under 100 labels
 * (enforced by tests/unit/labels.test.ts, MAX_LABELS_PER_GLOBAL).
 * Every namespace must appear in exactly one group.
 */
export const MAX_LABELS_PER_GLOBAL = 80

export const LABEL_GROUPS = [
  {
    slug: 'labels-site',
    label: { en: 'UI labels: site & navigation', ja: 'UIラベル：サイト・ナビゲーション' },
    namespaces: ['meta', 'a11y', 'nav', 'footer', 'home', 'authPanel', 'notFound'],
  },
  {
    slug: 'labels-accounts',
    label: { en: 'UI labels: accounts', ja: 'UIラベル：アカウント' },
    namespaces: ['auth', 'app'],
  },
  {
    slug: 'labels-student',
    label: { en: 'UI labels: student area', ja: 'UIラベル：受講者エリア' },
    namespaces: ['student'],
  },
  {
    slug: 'labels-dashboard',
    label: { en: 'UI labels: home & profile', ja: 'UIラベル：ホーム・プロフィール' },
    namespaces: ['dashboard', 'profile'],
  },
  {
    slug: 'labels-progress',
    label: {
      en: 'UI labels: streaks, calendar & milestones',
      ja: 'UIラベル：連続学習・カレンダー・マイルストーン',
    },
    namespaces: ['progress'],
  },
  {
    slug: 'labels-exam',
    label: { en: 'UI labels: test screen', ja: 'UIラベル：試験画面' },
    namespaces: ['exam'],
  },
  {
    slug: 'labels-messages',
    label: { en: 'UI labels: messages', ja: 'UIラベル：メッセージ' },
    namespaces: ['validation', 'errors'],
  },
] as const

export type LabelGlobalSlug = (typeof LABEL_GROUPS)[number]['slug']
