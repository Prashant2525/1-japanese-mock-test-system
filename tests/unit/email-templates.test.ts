import type { Payload } from 'payload'
import { describe, expect, it } from 'vitest'

import { fillTemplate, renderEmail, renderLayout } from '@/server/email/templates'

describe('fillTemplate', () => {
  it('fills allowed variables and removes any other placeholder', () => {
    const out = fillTemplate('Hi {{name}} {{secret}} {{ appName }}', ['name', 'appName'], {
      name: 'Mina',
      appName: 'NM',
    })
    expect(out).toBe('Hi Mina  NM')
  })
})

describe('renderLayout', () => {
  it('escapes every inserted value, including the link', () => {
    const html = renderLayout({
      locale: 'en',
      appName: 'Nihongo Mock',
      body: '<script>x</script>',
      buttonLabel: 'Go "now"',
      link: 'https://example.com/?a=1&b="2"',
      footer: '<b>f</b>',
    })
    expect(html).not.toContain('<script>x</script>')
    expect(html).toContain('&lt;script&gt;x&lt;/script&gt;')
    expect(html).toContain('href="https://example.com/?a=1&amp;b=&quot;2&quot;"')
    expect(html).toContain('lang="en"')
  })
})

describe('renderEmail', () => {
  const failingPayload = {
    find: async () => Promise.reject(new Error('db down')),
  } as unknown as Payload
  const emptyPayload = { find: async () => ({ docs: [] }) } as unknown as Payload

  it('falls back to the code default when the CMS has no template', async () => {
    const mail = await renderEmail(
      emptyPayload,
      'reset_password',
      'ja',
      { name: '太郎', expiresInMinutes: 60 },
      'https://x/r',
    )
    expect(mail.subject).toBe('【Nihongo Mock】パスワードの再設定')
    expect(mail.html).toContain('60分間')
  })

  it('still renders if the template lookup fails', async () => {
    const mail = await renderEmail(
      failingPayload,
      'verify_email',
      'en',
      { name: 'A' },
      'https://x/v',
    )
    expect(mail.subject).toBe('Confirm your email for Nihongo Mock')
  })

  it('uses CMS copy when present and strips newlines from subjects', async () => {
    const cms = {
      find: async () => ({
        docs: [
          {
            subject: 'Hello\r\nBcc: x@y {{name}}',
            body: 'Body {{name}}',
            buttonLabel: 'Open',
            footer: '',
          },
        ],
      }),
    } as unknown as Payload
    const mail = await renderEmail(cms, 'verify_email', 'en', { name: 'Ken' }, 'https://x/v')
    expect(mail.subject).toBe('Hello Bcc: x@y Ken')
    expect(mail.html).toContain('Body Ken')
  })
})
