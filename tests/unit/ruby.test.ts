import { describe, expect, it } from 'vitest'

import { parseRuby, stripRuby } from '@/shared/ruby'

describe('furigana markup (D-024)', () => {
  it('splits text into plain and ruby parts', () => {
    expect(parseRuby('{日本|にほん}の{漢字|かんじ}です')).toEqual([
      { text: '日本', reading: 'にほん' },
      { text: 'の' },
      { text: '漢字', reading: 'かんじ' },
      { text: 'です' },
    ])
  })

  it('leaves text without markup alone, including lone braces', () => {
    expect(parseRuby('ふつうの文')).toEqual([{ text: 'ふつうの文' }])
    expect(parseRuby('a {b} c')).toEqual([{ text: 'a {b} c' }])
  })

  it('strips readings for plain-text uses', () => {
    expect(stripRuby('{漢字|かんじ}を{読|よ}む')).toBe('漢字を読む')
  })
})
