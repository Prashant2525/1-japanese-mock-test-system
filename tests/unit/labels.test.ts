import { describe, expect, it } from 'vitest'

import { LABEL_GROUPS, MAX_LABELS_PER_GLOBAL } from '@/i18n/label-groups'
import { flattenKeys, mergeOverrides, type Messages, valueAt } from '@/i18n/labels'
import en from '@/i18n/messages/en.json'
import ja from '@/i18n/messages/ja.json'
import { readFileSync } from 'node:fs'
import path from 'node:path'

const EN = en as Messages
const JA = ja as Messages
const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort()

describe('message catalogues', () => {
  it('English and Japanese have exactly the same keys', () => {
    expect(flattenKeys(JA).sort()).toEqual(flattenKeys(EN).sort())
  })

  it('no label is empty in either language', () => {
    for (const key of flattenKeys(EN)) {
      expect(valueAt(EN, key.split('.')), key).toBeTruthy()
      expect(valueAt(JA, key.split('.')), key).toBeTruthy()
    }
  })

  it('every {placeholder} appears in both languages', () => {
    for (const key of flattenKeys(EN)) {
      const e = valueAt(EN, key.split('.'))!
      const j = valueAt(JA, key.split('.'))!
      expect(placeholders(j), key).toEqual(placeholders(e))
    }
  })

  it('every validation message used by the shared schemas exists', () => {
    const source = readFileSync(path.resolve(__dirname, '../../src/shared/auth-schemas.ts'), 'utf8')
    const keys = [...new Set(source.match(/validation\.[a-zA-Z]+/g) ?? [])]
    expect(keys.length).toBeGreaterThan(0)
    for (const k of keys) expect(valueAt(EN, k.split('.')), k).toBeTruthy()
  })
})

describe('CMS label globals', () => {
  it('cover every namespace exactly once', () => {
    const assigned = LABEL_GROUPS.flatMap((g) => g.namespaces as readonly string[])
    expect([...assigned].sort()).toEqual(Object.keys(EN).sort())
    expect(new Set(assigned).size).toBe(assigned.length)
  })

  it(`each stays under ${MAX_LABELS_PER_GLOBAL} labels (PostgreSQL 100-argument limit)`, () => {
    for (const g of LABEL_GROUPS) {
      const count = g.namespaces.reduce((n, ns) => n + flattenKeys(EN[ns] as Messages).length, 0)
      expect(count, g.slug).toBeLessThanOrEqual(MAX_LABELS_PER_GLOBAL)
    }
  })
})

describe('mergeOverrides', () => {
  const defaults: Messages = { a: 'A', nested: { b: 'B', c: 'C' } }

  it('replaces only non-empty strings at known paths', () => {
    const merged = mergeOverrides(defaults, {
      a: '',
      nested: { b: 'New B', c: null, x: 'ignored' },
      y: 'z',
    })
    expect(merged).toEqual({ a: 'A', nested: { b: 'New B', c: 'C' } })
  })

  it('returns the defaults when the CMS has nothing', () => {
    expect(mergeOverrides(defaults, null)).toBe(defaults)
    expect(mergeOverrides(defaults, {})).toEqual(defaults)
  })
})
