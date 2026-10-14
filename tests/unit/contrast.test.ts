import { readFileSync } from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

import { AA_LARGE_OR_UI, AA_TEXT, contrastRatio } from '@/ui/lib/contrast'

const css = readFileSync(path.resolve(__dirname, '../../src/ui/styles/globals.css'), 'utf8')
const root = css.slice(css.indexOf(':root {'), css.indexOf('}', css.indexOf(':root {')))
const token = (name: string): string => {
  const match = root.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{3,6})`))
  if (!match) throw new Error(`token --${name} not found`)
  return match[1]
}

describe('contrastRatio', () => {
  it('matches known WCAG values', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0)
    expect(contrastRatio('#ffffff', '#ffffff')).toBeCloseTo(1, 5)
  })
})

describe('default design tokens meet WCAG AA (DESIGN_SYSTEM §3)', () => {
  const textPairs: [string, string][] = [
    ['text', 'surface'],
    ['text', 'day'],
    ['text-muted', 'surface'],
    ['text-muted', 'day'],
    ['text-on-night', 'night'],
    ['muted-on-night', 'night'],
    ['danger', 'surface'],
    ['success', 'surface'],
    ['warning', 'surface'],
    ['info', 'surface'],
  ]
  for (const [fg, bg] of textPairs) {
    it(`${fg} on ${bg} ≥ ${AA_TEXT}:1`, () => {
      expect(contrastRatio(token(fg), token(bg))).toBeGreaterThanOrEqual(AA_TEXT)
    })
  }

  it('white text on the primary button ≥ 4.5:1', () => {
    expect(contrastRatio('#ffffff', token('signal'))).toBeGreaterThanOrEqual(AA_TEXT)
    expect(contrastRatio('#ffffff', token('signal-hover'))).toBeGreaterThanOrEqual(AA_TEXT)
  })

  for (const level of ['n5', 'n4', 'n3', 'n2', 'n1']) {
    it(`white text on the ${level.toUpperCase()} badge ≥ 4.5:1`, () => {
      expect(contrastRatio('#ffffff', token(`badge-${level}`))).toBeGreaterThanOrEqual(AA_TEXT)
    })
    it(`${level.toUpperCase()} route line is visible on night ≥ 3:1`, () => {
      expect(contrastRatio(token(`line-${level}`), token('night'))).toBeGreaterThanOrEqual(
        AA_LARGE_OR_UI,
      )
    })
  }

  it('the Google button text and outline are readable on white', () => {
    expect(contrastRatio(token('google-text'), token('surface'))).toBeGreaterThanOrEqual(AA_TEXT)
    expect(contrastRatio(token('google-stroke'), token('surface'))).toBeGreaterThanOrEqual(
      AA_LARGE_OR_UI,
    )
  })

  it('focus rings are visible (≥ 3:1)', () => {
    expect(contrastRatio(token('focus'), token('surface'))).toBeGreaterThanOrEqual(AA_LARGE_OR_UI)
    expect(contrastRatio(token('focus-on-night'), token('night'))).toBeGreaterThanOrEqual(
      AA_LARGE_OR_UI,
    )
  })
})
