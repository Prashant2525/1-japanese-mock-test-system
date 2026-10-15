'use client'

import { useTranslation } from '@payloadcms/ui'

import { stripRuby } from '@/shared/ruby'

/**
 * Yes/no column for checkbox fields in admin lists (instead of raw "true"/"false").
 * The mark is decorative; the word is read by screen readers in the admin's language.
 */
export function YesNoCell({ cellData }: { cellData?: unknown }) {
  const { i18n } = useTranslation()
  const ja = i18n.language === 'ja'
  const on = cellData === true
  return (
    <span className={on ? 'nm-yes' : 'nm-no'}>
      <span aria-hidden="true">{on ? '✓' : '–'}</span>
      <span className="nm-sr-only">{on ? (ja ? 'はい' : 'Yes') : ja ? 'いいえ' : 'No'}</span>
    </span>
  )
}

/** Question text in lists: furigana markup removed ({漢字|かんじ} → 漢字) and shortened. */
export function StemCell({ cellData }: { cellData?: unknown }) {
  const text = typeof cellData === 'string' ? stripRuby(cellData) : ''
  return <span lang="ja">{text.length > 90 ? `${text.slice(0, 90)}…` : text}</span>
}
