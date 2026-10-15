import { describe, expect, it } from 'vitest'

import { checkLearningFile, contentMatchesType } from '@/server/media/files'
import { signedMediaPath, verifyMediaSignature } from '@/server/media/signing'

const bytes = (...parts: (number[] | string)[]) =>
  new Uint8Array(
    parts.flatMap((p) => (typeof p === 'string' ? [...p].map((c) => c.charCodeAt(0)) : p)),
  )

describe('learning media files (D-041)', () => {
  it.each([
    ['image/png', bytes([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])],
    ['image/jpeg', bytes([0xff, 0xd8, 0xff, 0xe0])],
    ['image/webp', bytes('RIFF', [0, 0, 0, 0], 'WEBP')],
    ['application/pdf', bytes('%PDF-1.7')],
    ['audio/mpeg', bytes('ID3', [3, 0])],
    ['audio/mpeg', bytes([0xff, 0xfb, 0x90])],
    ['audio/wav', bytes('RIFF', [0, 0, 0, 0], 'WAVE')],
    ['audio/ogg', bytes('OggS')],
    ['audio/mp4', bytes([0, 0, 0, 0x20], 'ftypM4A ')],
  ])('accepts real %s content', (mime, data) => {
    expect(contentMatchesType(data, mime)).toBe(true)
  })

  it('refuses content that does not match its type (e.g. a renamed web page)', () => {
    expect(contentMatchesType(bytes('<html><script>'), 'application/pdf')).toBe(false)
    expect(contentMatchesType(bytes('%PDF-1.7'), 'image/png')).toBe(false)
    expect(checkLearningFile({ mimetype: 'image/png', size: 10, data: bytes('<svg') })).toEqual({
      reason: 'content',
    })
  })

  it('refuses types that are not allowed (SVG, HTML, video) and oversized files', () => {
    expect(checkLearningFile({ mimetype: 'image/svg+xml', size: 10 })).toMatchObject({
      reason: 'type',
    })
    expect(checkLearningFile({ mimetype: 'text/html', size: 10 })).toMatchObject({ reason: 'type' })
    expect(checkLearningFile({ mimetype: 'video/mp4', size: 10 })).toMatchObject({ reason: 'type' })
    expect(checkLearningFile({ mimetype: 'image/png', size: 6 * 1024 * 1024 })).toMatchObject({
      reason: 'size',
    })
    expect(
      checkLearningFile({ mimetype: 'application/pdf', size: 1000, data: bytes('%PDF-1.4') }),
    ).toBeNull()
  })
})

describe('signed media links', () => {
  const secret = 'x'.repeat(40)
  const params = (path: string) => new URL(path, 'http://x').searchParams

  it('verify for the same media, student and time window', () => {
    const now = 1_800_000_000
    const p = params(signedMediaPath(secret, 7, 42, now))
    const exp = Number(p.get('exp'))
    expect(verifyMediaSignature(secret, 7, 42, exp, p.get('sig')!, now + 60)).toBe(true)
  })

  it('fail for another student, another file, after expiry, or when tampered', () => {
    const now = 1_800_000_000
    const p = params(signedMediaPath(secret, 7, 42, now))
    const exp = Number(p.get('exp'))
    const sig = p.get('sig')!
    expect(verifyMediaSignature(secret, 7, 43, exp, sig, now)).toBe(false)
    expect(verifyMediaSignature(secret, 8, 42, exp, sig, now)).toBe(false)
    expect(verifyMediaSignature(secret, 7, 42, exp, sig, exp + 1)).toBe(false)
    expect(verifyMediaSignature(secret, 7, 42, exp + 3600, sig, now)).toBe(false)
    expect(verifyMediaSignature('y'.repeat(40), 7, 42, exp, sig, now)).toBe(false)
  })
})
