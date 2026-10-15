import { createHmac } from 'node:crypto'

import { safeEqual } from '../auth/google'

/**
 * Signed links to private learning media (D-041): bound to the media item, the student and an
 * expiry. The media route also re-checks the session and the student's access to the material, so
 * a leaked link is useless to anyone else and stops working after the expiry.
 * Long enough for an audio file to be played and seeked through in one sitting.
 */
export const MEDIA_LINK_TTL_SECONDS = 2 * 60 * 60

const sign = (secret: string, mediaId: number, studentId: number, exp: number) =>
  createHmac('sha256', secret)
    .update(`learning-media.${mediaId}.${studentId}.${exp}`)
    .digest('base64url')

export function signedMediaPath(
  secret: string,
  mediaId: number,
  studentId: number,
  nowSeconds = Math.floor(Date.now() / 1000),
): string {
  const exp = nowSeconds + MEDIA_LINK_TTL_SECONDS
  return `/api/v1/media/${mediaId}?exp=${exp}&sig=${sign(secret, mediaId, studentId, exp)}`
}

export function verifyMediaSignature(
  secret: string,
  mediaId: number,
  studentId: number,
  exp: number,
  sig: string,
  nowSeconds = Math.floor(Date.now() / 1000),
): boolean {
  if (!Number.isInteger(exp) || exp < nowSeconds) return false
  return safeEqual(sig, sign(secret, mediaId, studentId, exp))
}
