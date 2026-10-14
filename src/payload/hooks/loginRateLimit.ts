import { APIError, type CollectionBeforeOperationHook } from 'payload'

import { clientIp } from '@/server/http/client'
import { AppError } from '@/server/http/errors'
import { enforce, RATE_LIMITS } from '@/server/rate-limit'

/**
 * Rate-limits login and forgot-password operations that reach Payload directly
 * (e.g. the admin panel). The domain API applies its own limits first and sets
 * `context.rateLimited` so requests are not counted twice.
 */
export const loginRateLimit: CollectionBeforeOperationHook = async ({
  args,
  operation,
  req,
  collection,
}) => {
  if (operation !== 'login' && operation !== 'forgotPassword') return args
  if (req.context?.rateLimited) return args
  const email = String((args as { data?: { email?: unknown } }).data?.email ?? '').toLowerCase()
  const ip = clientIp(req.headers)
  try {
    await enforce(req.payload, [
      { key: ip && `${collection.slug}:${operation}:ip:${ip}`, rule: RATE_LIMITS.loginPerIp },
      {
        key: email && `${collection.slug}:${operation}:acct:${email}`,
        rule: operation === 'login' ? RATE_LIMITS.loginPerAccount : RATE_LIMITS.emailPerAccount,
      },
    ])
  } catch (err) {
    if (err instanceof AppError) {
      throw new APIError('Too many attempts. Try again later.', 429, null, true)
    }
    throw err
  }
  return args
}
