/**
 * Starting catalogue (D-014, D-008, D-015), seeded once by migration. Everything here is
 * editable in the admin panel afterwards (Exam catalogue). The Japanese text and the
 * non-affiliation notices are drafts for the owner to review (PA-6).
 */
type Localized = { en: string; ja: string }

export type SeedExamType = {
  code: string
  order: number
  name: Localized
  description: Localized
  nonAffiliationNotice: Localized
}

export type SeedLevel = {
  examType: string
  code: string
  order: number
  name: Localized
  /** Code of the JLPT level it corresponds to (NAT, JFT). */
  equivalentJlpt?: string
  lineColor: string
  badgeColor: string
  enabledForMockTests: boolean
  enabledForDetermination: boolean
  enabledForStudy: boolean
}

const notice = (exam: string, examJa: string): Localized => ({
  en: `Nihongo Mock is an independent practice service. It is not affiliated with, endorsed by or connected to the organisers of the ${exam}.`,
  ja: `Nihongo Mock は独立した練習サービスであり、${examJa}の主催者とは提携・承認・関係はありません。`,
})

export const SEED_EXAM_TYPES: SeedExamType[] = [
  {
    code: 'JLPT',
    order: 1,
    name: { en: 'JLPT (Japanese-Language Proficiency Test)', ja: '日本語能力試験（JLPT）' },
    description: {
      en: 'Five levels, from N5 (basic) to N1 (advanced).',
      ja: 'N5（基礎）から N1（上級）までの5つのレベルがあります。',
    },
    nonAffiliationNotice: notice('JLPT', '日本語能力試験'),
  },
  {
    code: 'NAT',
    order: 2,
    name: { en: 'NAT-TEST', ja: '日本語NAT-TEST' },
    description: {
      en: 'Five levels, from 5Q to 1Q. Each one corresponds to a JLPT level (5Q ≈ N5 … 1Q ≈ N1).',
      ja: '5級から1級までの5つのレベルがあり、それぞれ JLPT のレベルに相当します（5級 ≈ N5 … 1級 ≈ N1）。',
    },
    nonAffiliationNotice: notice('NAT-TEST', '日本語NAT-TEST'),
  },
  {
    code: 'JFT',
    order: 3,
    name: {
      en: 'JFT-Basic (Japan Foundation Test for Basic Japanese)',
      ja: '国際交流基金日本語基礎テスト（JFT-Basic）',
    },
    description: {
      en: 'Measures the Japanese needed for everyday life and work.',
      ja: '生活や仕事に必要な日本語力を測定します。',
    },
    nonAffiliationNotice: notice('JFT-Basic', '国際交流基金日本語基礎テスト'),
  },
]

/** Level colours from the design system (DESIGN_SYSTEM §3, tokens --line-n* / --badge-n*). */
const COLOURS = {
  N5: { lineColor: '#1E9E5A', badgeColor: '#13703F' },
  N4: { lineColor: '#E59A00', badgeColor: '#8A5B00' },
  N3: { lineColor: '#2B6BD8', badgeColor: '#1F56B8' },
  N2: { lineColor: '#8F64DA', badgeColor: '#6A42B5' },
  N1: { lineColor: '#D04A86', badgeColor: '#962858' },
} as const

const JLPT = ['N5', 'N4', 'N3', 'N2', 'N1'] as const
/** Launch: the level check and study library cover N5–N3 (D-008); mock tests cover every level. */
const LAUNCH = new Set(['N5', 'N4', 'N3'])

export const SEED_LEVELS: SeedLevel[] = [
  ...JLPT.map((code, i) => ({
    examType: 'JLPT',
    code,
    order: i + 1,
    name: { en: code, ja: code },
    ...COLOURS[code],
    enabledForMockTests: true,
    enabledForDetermination: LAUNCH.has(code),
    enabledForStudy: LAUNCH.has(code),
  })),
  ...JLPT.map((jlpt, i) => ({
    examType: 'NAT',
    code: `${5 - i}Q`,
    order: i + 1,
    name: { en: `${5 - i}Q`, ja: `${5 - i}級` },
    equivalentJlpt: jlpt,
    ...COLOURS[jlpt],
    enabledForMockTests: true,
    enabledForDetermination: false,
    enabledForStudy: false,
  })),
  ...(['A1', 'A2.1', 'A2.2', 'A2'] as const).map((code, i) => ({
    examType: 'JFT',
    code,
    order: i + 1,
    name: { en: code, ja: code },
    ...COLOURS[JLPT[i]!],
    enabledForMockTests: true,
    enabledForDetermination: false,
    enabledForStudy: false,
  })),
]
