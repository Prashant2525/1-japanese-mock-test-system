/**
 * Pure helpers for UI labels (D-030): code defaults in messages/{en,ja}.json, overridable per key
 * from the CMS "UI labels" global. Shared by the Payload config, the request config and tests.
 */
export type Messages = { [key: string]: string | Messages }

export function flattenKeys(messages: Messages, prefix = ''): string[] {
  return Object.entries(messages).flatMap(([k, v]) =>
    typeof v === 'string' ? [`${prefix}${k}`] : flattenKeys(v, `${prefix}${k}.`),
  )
}

/**
 * Returns a copy of `defaults` where every non-empty string found at the same path in
 * `overrides` replaces the default. Unknown keys and non-string values are ignored.
 */
export function mergeOverrides(defaults: Messages, overrides: unknown): Messages {
  if (typeof overrides !== 'object' || overrides === null) return defaults
  const source = overrides as Record<string, unknown>
  const out: Messages = {}
  for (const [k, v] of Object.entries(defaults)) {
    const o = source[k]
    if (typeof v === 'string') {
      out[k] = typeof o === 'string' && o.trim() !== '' ? o : v
    } else {
      out[k] = mergeOverrides(v, o)
    }
  }
  return out
}

export function valueAt(messages: Messages, path: string[]): string | undefined {
  let node: string | Messages | undefined = messages
  for (const p of path) {
    if (typeof node !== 'object' || node === null) return undefined
    node = node[p]
  }
  return typeof node === 'string' ? node : undefined
}
