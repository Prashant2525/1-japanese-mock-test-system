import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import path from 'node:path'
import { Readable } from 'node:stream'

import { LEARNING_MEDIA_DIR } from '@/payload/collections/LearningMedia'

/**
 * Where learning-media files are read from (D-041). Development and tests: local disk under
 * `media/learning`. Production: Cloudflare R2, added once the owner's account exists (KI-37);
 * until then a deployment must not rely on local disk (release gate).
 */
export type FileSlice = {
  body: ReadableStream<Uint8Array>
  size: number
  start: number
  end: number
  partial: boolean
}

/** Parses one `bytes=start-end` range; null for none or an unsupported/invalid range. */
export function parseRange(
  header: string | null,
  size: number,
): { start: number; end: number } | null {
  const match = header?.match(/^bytes=(\d*)-(\d*)$/)
  if (!match || size === 0) return null
  const [, from, to] = match
  if (from === '' && to === '') return null
  let start: number
  let end: number
  if (from === '') {
    start = Math.max(0, size - Number(to))
    end = size - 1
  } else {
    start = Number(from)
    end = to === '' ? size - 1 : Math.min(Number(to), size - 1)
  }
  return start <= end && start < size ? { start, end } : null
}

export async function openLearningFile(
  filename: string,
  rangeHeader: string | null,
): Promise<FileSlice | null> {
  // Only a plain file name inside the media folder (no path tricks).
  const file = path.join(LEARNING_MEDIA_DIR, path.basename(filename))
  const info = await stat(file).catch(() => null)
  if (!info?.isFile()) return null
  const range = parseRange(rangeHeader, info.size)
  const start = range?.start ?? 0
  const end = range?.end ?? info.size - 1
  const stream = createReadStream(file, { start, end })
  return {
    body: Readable.toWeb(stream) as ReadableStream<Uint8Array>,
    size: info.size,
    start,
    end,
    partial: range !== null,
  }
}
