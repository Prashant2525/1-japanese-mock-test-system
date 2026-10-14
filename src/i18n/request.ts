import { getRequestConfig } from 'next-intl/server'

import { getLabelOverrides } from '@/server/i18n/label-overrides'

import { mergeOverrides, type Messages } from './labels'
import en from './messages/en.json'
import ja from './messages/ja.json'
import { DEFAULT_LOCALE, isLocale } from './routing'

const DEFAULTS: Record<'en' | 'ja', Messages> = { en: en as Messages, ja: ja as Messages }

/** Messages for a request: code defaults merged with CMS overrides (D-030). */
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale
  const locale = isLocale(requested) ? requested : DEFAULT_LOCALE
  const messages = mergeOverrides(DEFAULTS[locale], await getLabelOverrides(locale))
  return { locale, messages, timeZone: 'Asia/Kathmandu' }
})
