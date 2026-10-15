/**
 * Learning-media file rules (D-041, rule 10): which files may be uploaded, how big, and a check that
 * the file content matches its type (so a renamed file cannot pass as something else).
 */
export type MediaKind = 'image' | 'audio' | 'pdf'

const MB = 1024 * 1024

export const LEARNING_MEDIA_TYPES: Record<string, { kind: MediaKind; maxBytes: number }> = {
  'image/jpeg': { kind: 'image', maxBytes: 5 * MB },
  'image/png': { kind: 'image', maxBytes: 5 * MB },
  'image/webp': { kind: 'image', maxBytes: 5 * MB },
  'audio/mpeg': { kind: 'audio', maxBytes: 30 * MB },
  'audio/mp4': { kind: 'audio', maxBytes: 30 * MB },
  'audio/x-m4a': { kind: 'audio', maxBytes: 30 * MB },
  'audio/wav': { kind: 'audio', maxBytes: 30 * MB },
  'audio/x-wav': { kind: 'audio', maxBytes: 30 * MB },
  'audio/ogg': { kind: 'audio', maxBytes: 30 * MB },
  'application/pdf': { kind: 'pdf', maxBytes: 20 * MB },
}

export const MAX_LEARNING_MEDIA_BYTES = 30 * MB

const starts = (b: Uint8Array, bytes: number[], offset = 0) =>
  bytes.every((v, i) => b[offset + i] === v)
const ascii = (s: string) => [...s].map((c) => c.charCodeAt(0))

/** True when the first bytes of the file match the declared type. */
export function contentMatchesType(data: Uint8Array, mimeType: string): boolean {
  switch (mimeType) {
    case 'image/jpeg':
      return starts(data, [0xff, 0xd8, 0xff])
    case 'image/png':
      return starts(data, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    case 'image/webp':
      return starts(data, ascii('RIFF')) && starts(data, ascii('WEBP'), 8)
    case 'application/pdf':
      return starts(data, ascii('%PDF-'))
    case 'audio/wav':
    case 'audio/x-wav':
      return starts(data, ascii('RIFF')) && starts(data, ascii('WAVE'), 8)
    case 'audio/ogg':
      return starts(data, ascii('OggS'))
    case 'audio/mpeg':
      // An ID3 tag, or an MPEG frame sync (11 set bits).
      return starts(data, ascii('ID3')) || (data[0] === 0xff && ((data[1] ?? 0) & 0xe0) === 0xe0)
    case 'audio/mp4':
    case 'audio/x-m4a':
      return starts(data, ascii('ftyp'), 4)
    default:
      return false
  }
}

export type FileProblem =
  | { reason: 'type'; mimeType: string }
  | { reason: 'size'; maxBytes: number }
  | { reason: 'content' }

export function checkLearningFile(file: {
  mimetype: string
  size: number
  data?: Uint8Array
}): FileProblem | null {
  const rule = LEARNING_MEDIA_TYPES[file.mimetype]
  if (!rule) return { reason: 'type', mimeType: file.mimetype }
  if (file.size > rule.maxBytes) return { reason: 'size', maxBytes: rule.maxBytes }
  if (file.data && !contentMatchesType(file.data, file.mimetype)) return { reason: 'content' }
  return null
}
