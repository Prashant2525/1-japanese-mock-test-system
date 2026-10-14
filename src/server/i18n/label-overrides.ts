import config from '@payload-config'
import { getPayload } from 'payload'

import { LABEL_GROUPS } from '@/i18n/label-groups'

import { logger } from '../logger'

type CacheEntry = { at: number; value: Record<string, unknown> }

const TTL_MS = 60_000
const globalCache = globalThis as unknown as { __nmLabelCache?: Map<string, CacheEntry> }
const cache = (globalCache.__nmLabelCache ??= new Map())

/**
 * CMS overrides for UI labels in one locale (all label globals merged), cached for 60 s per
 * server instance. Saving a label global clears this instance's cache at once; other instances
 * refresh within 60 s. If the CMS can't be read, pages use the code defaults (never break).
 */
export async function getLabelOverrides(locale: 'en' | 'ja'): Promise<Record<string, unknown>> {
  const hit = cache.get(locale)
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value
  try {
    const payload = await getPayload({ config })
    const docs = await Promise.all(
      LABEL_GROUPS.map((g) =>
        payload.findGlobal({
          slug: g.slug,
          locale,
          fallbackLocale: false,
          depth: 0,
          overrideAccess: true,
        }),
      ),
    )
    const value = Object.assign({}, ...docs) as Record<string, unknown>
    cache.set(locale, { at: Date.now(), value })
    return value
  } catch (err) {
    logger.warn({ err }, 'UI label overrides unavailable; using defaults')
    return {}
  }
}

export function invalidateLabelOverrides(): void {
  cache.clear()
}
