type WithLanguage = { i18n?: { language?: string } } | null | undefined

/** Picks the English or Japanese text for messages shown in the admin panel (its UI language). */
export function say(req: WithLanguage, en: string, ja: string): string {
  return req?.i18n?.language === 'ja' ? ja : en
}
