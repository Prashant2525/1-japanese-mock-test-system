import type { Payload } from 'payload'

export type Locale = 'en' | 'ja'

export const EMAIL_TEMPLATE_KEYS = [
  'verify_email',
  'reset_password',
  'admin_reset_password',
  'contact_notification',
  'order_receipt',
] as const
export type EmailTemplateKey = (typeof EMAIL_TEMPLATE_KEYS)[number]

/** Variables each template may use. Anything else in {{…}} is removed when rendering. */
export const TEMPLATE_VARIABLES: Record<EmailTemplateKey, readonly string[]> = {
  verify_email: ['appName', 'name'],
  reset_password: ['appName', 'name', 'expiresInMinutes'],
  admin_reset_password: ['appName', 'name', 'expiresInMinutes'],
  contact_notification: ['appName', 'name', 'email', 'message'],
  order_receipt: ['appName', 'name', 'orderNo', 'amount'],
}

export type TemplateContent = { subject: string; body: string; buttonLabel: string; footer: string }

/**
 * Code defaults (D-030: code defaults + CMS override). Seeded into the CMS by migration;
 * used as a fallback if a CMS template is missing. JA copy is a draft for review (PA-6).
 */
export const DEFAULT_TEMPLATES: Partial<Record<EmailTemplateKey, Record<Locale, TemplateContent>>> =
  {
    verify_email: {
      en: {
        subject: 'Confirm your email for {{appName}}',
        body: 'Hi {{name}},\n\nThanks for signing up for {{appName}}. Confirm your email address to start your free level check.',
        buttonLabel: 'Confirm email',
        footer: "If you didn't create an account, you can ignore this email.",
      },
      ja: {
        subject: '【{{appName}}】メールアドレスの確認',
        body: '{{name}} さん\n\n{{appName}}にご登録いただきありがとうございます。メールアドレスを確認して、無料のレベルチェックを始めましょう。',
        buttonLabel: 'メールアドレスを確認する',
        footer: 'このメールに心当たりがない場合は、このまま破棄してください。',
      },
    },
    reset_password: {
      en: {
        subject: 'Reset your {{appName}} password',
        body: 'Hi {{name}},\n\nWe received a request to reset your password. The link below works for {{expiresInMinutes}} minutes and can be used once.',
        buttonLabel: 'Choose a new password',
        footer: "If you didn't ask for this, ignore this email. Your password stays the same.",
      },
      ja: {
        subject: '【{{appName}}】パスワードの再設定',
        body: '{{name}} さん\n\nパスワード再設定のリクエストを受け付けました。下のリンクは{{expiresInMinutes}}分間、1回だけ有効です。',
        buttonLabel: '新しいパスワードを設定する',
        footer:
          'お心当たりがない場合は、このメールを破棄してください。パスワードは変更されません。',
      },
    },
    admin_reset_password: {
      en: {
        subject: 'Set your {{appName}} admin password',
        body: 'Hi {{name}},\n\nUse the link below to set a new password for your {{appName}} admin account. It works for {{expiresInMinutes}} minutes and can be used once.',
        buttonLabel: 'Set password',
        footer: "If you weren't expecting this, contact your Super Admin.",
      },
      ja: {
        subject: '【{{appName}}】管理者パスワードの設定',
        body: '{{name}} さん\n\n{{appName}}管理者アカウントの新しいパスワードを下のリンクから設定してください。リンクは{{expiresInMinutes}}分間、1回だけ有効です。',
        buttonLabel: 'パスワードを設定する',
        footer: '心当たりがない場合は、スーパー管理者にご連絡ください。',
      },
    },
  }

const escapeHtml = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

/** Fills allowed {{variables}}; strips any other placeholder. Values are inserted raw (escape afterwards). */
export function fillTemplate(
  text: string,
  allowed: readonly string[],
  vars: Record<string, string | number>,
): string {
  return text.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_m, name: string) =>
    allowed.includes(name) && vars[name] !== undefined ? String(vars[name]) : '',
  )
}

function paragraphs(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 16px">${escapeHtml(p).replace(/\n/g, '<br>')}</p>`)
    .join('')
}

/** Branded, table-based HTML that renders in common mail clients. Every inserted value is escaped. */
export function renderLayout(args: {
  locale: Locale
  appName: string
  body: string
  buttonLabel: string
  link: string
  footer: string
}): string {
  const font =
    args.locale === 'ja'
      ? "'Hiragino Sans','Noto Sans JP','Yu Gothic',Meiryo,sans-serif"
      : "'Segoe UI',Roboto,Helvetica,Arial,sans-serif"
  return `<!doctype html><html lang="${args.locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;background:#F2F4F8;font-family:${font};color:#0F2340">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F2F4F8;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFFFF;border-radius:10px;overflow:hidden">
<tr><td style="background:#0F2340;padding:18px 24px;color:#FFFFFF;font-size:18px;font-weight:700">${escapeHtml(args.appName)}</td></tr>
<tr><td style="height:6px;background:#D7262F"></td></tr>
<tr><td style="padding:28px 24px 8px;font-size:16px;line-height:1.7">${paragraphs(args.body)}</td></tr>
<tr><td style="padding:0 24px 24px"><a href="${escapeHtml(args.link)}" style="display:inline-block;background:#D7262F;color:#FFFFFF;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:10px">${escapeHtml(args.buttonLabel)}</a>
<p style="margin:16px 0 0;font-size:13px;color:#4A5770;word-break:break-all">${escapeHtml(args.link)}</p></td></tr>
<tr><td style="padding:16px 24px 24px;border-top:1px solid #DCE2EC;font-size:13px;color:#4A5770;line-height:1.6">${escapeHtml(args.footer)}</td></tr>
</table></td></tr></table></body></html>`
}

export type RenderedEmail = { subject: string; html: string }

/**
 * Renders an email from the CMS template (localized, falling back to EN) or the code default.
 */
export async function renderEmail(
  payload: Payload,
  key: EmailTemplateKey,
  locale: Locale,
  vars: Record<string, string | number>,
  link: string,
): Promise<RenderedEmail> {
  let content: TemplateContent | undefined
  try {
    const found = await payload.find({
      collection: 'email-templates',
      where: { key: { equals: key } },
      locale,
      fallbackLocale: 'en',
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    const doc = found.docs[0]
    if (doc?.subject && doc.body) {
      content = {
        subject: doc.subject,
        body: doc.body,
        buttonLabel: doc.buttonLabel ?? '',
        footer: doc.footer ?? '',
      }
    }
  } catch {
    // Fall through to the code default.
  }
  content ??= DEFAULT_TEMPLATES[key]?.[locale] ?? DEFAULT_TEMPLATES[key]?.en
  if (!content) throw new Error(`No email template for ${key}`)

  const allowed = TEMPLATE_VARIABLES[key]
  const appName = String(vars.appName ?? 'Nihongo Mock')
  const all = { ...vars, appName }
  return {
    subject: fillTemplate(content.subject, allowed, all)
      .replace(/[\r\n]+/g, ' ')
      .trim(),
    html: renderLayout({
      locale,
      appName,
      body: fillTemplate(content.body, allowed, all),
      buttonLabel: fillTemplate(content.buttonLabel, allowed, all) || appName,
      link,
      footer: fillTemplate(content.footer, allowed, all),
    }),
  }
}
