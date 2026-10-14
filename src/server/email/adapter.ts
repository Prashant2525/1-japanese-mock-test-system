import { resendAdapter } from '@payloadcms/email-resend'
import type { EmailAdapter, SendEmailOptions } from 'payload'

import { getEnv } from '../env'
import { logger } from '../logger'

export type SentEmail = { to: string; subject: string; html: string; sentAt: Date }

const globalForOutbox = globalThis as unknown as { __nihongoMockOutbox?: SentEmail[] }

/** In-memory outbox used when EMAIL_TRANSPORT=memory (tests). */
export function memoryOutbox(): SentEmail[] {
  globalForOutbox.__nihongoMockOutbox ??= []
  return globalForOutbox.__nihongoMockOutbox
}

function recipient(message: SendEmailOptions): string {
  const to = Array.isArray(message.to) ? message.to[0] : message.to
  if (!to) return ''
  return typeof to === 'string' ? to : to.address
}

function maskEmail(email: string): string {
  const [user, domain] = email.split('@')
  return domain ? `${user?.slice(0, 1) ?? ''}***@${domain}` : '***'
}

/**
 * Chooses the email transport (D-042): Resend in production; console (development) prints
 * the subject and links so developers can follow verification/reset links; memory for tests.
 */
export function emailAdapter(): EmailAdapter {
  const env = getEnv()
  if (env.EMAIL_TRANSPORT === 'resend') {
    return resendAdapter({
      apiKey: env.RESEND_API_KEY!,
      defaultFromAddress: env.EMAIL_FROM_ADDRESS,
      defaultFromName: env.EMAIL_FROM_NAME,
    })
  }
  return () => ({
    name: env.EMAIL_TRANSPORT,
    defaultFromAddress: env.EMAIL_FROM_ADDRESS,
    defaultFromName: env.EMAIL_FROM_NAME,
    sendEmail: async (message: SendEmailOptions) => {
      const to = recipient(message)
      const subject = String(message.subject ?? '')
      const html = String(message.html ?? '')
      if (env.EMAIL_TRANSPORT === 'memory') {
        memoryOutbox().push({ to, subject, html, sentAt: new Date() })
        return { id: `memory-${memoryOutbox().length}` }
      }
      const links = [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1].replace(/&amp;/g, '&'))
      logger.info({ to: maskEmail(to), subject, links }, 'email (console transport, not sent)')
      return { id: 'console' }
    },
  })
}
