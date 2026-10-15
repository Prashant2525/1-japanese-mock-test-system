/**
 * Optional furigana in question text (D-024): `{漢字|かんじ}` is shown as 漢字 with かんじ above it.
 * Splits text into plain and ruby parts; renderers turn ruby parts into <ruby> elements.
 */
export type RubyPart = { text: string; reading?: string }

const RUBY = /\{([^{}|]+)\|([^{}|]+)\}/g

export function parseRuby(source: string): RubyPart[] {
  const parts: RubyPart[] = []
  let last = 0
  for (const match of source.matchAll(RUBY)) {
    if (match.index > last) parts.push({ text: source.slice(last, match.index) })
    parts.push({ text: match[1]!, reading: match[2]! })
    last = match.index + match[0].length
  }
  if (last < source.length) parts.push({ text: source.slice(last) })
  return parts
}

/** The text without readings (for search, duplicate detection and screen-reader fallbacks). */
export function stripRuby(source: string): string {
  return source.replace(RUBY, '$1')
}
