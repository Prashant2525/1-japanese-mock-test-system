import type { GlobalConfig } from 'payload'

import { hasPermission } from '@/payload/access'
import { recordAudit } from '@/server/audit/record'

/**
 * Sign-in options editable in the admin panel (D-030, D-066). Only switches live here; the Google
 * client ID and secret stay in server environment variables (D-020).
 */
export const SignInSettings: GlobalConfig = {
  slug: 'sign-in-settings',
  label: { en: 'Sign-in options', ja: 'ログイン方法' },
  admin: {
    group: { en: 'Settings', ja: '設定' },
    description: {
      en: 'How students can log in. Email and password is always available.',
      ja: '受講者のログイン方法。メールアドレスとパスワードでのログインは常に利用できます。',
    },
  },
  access: {
    read: hasPermission('settings.manage'),
    update: hasPermission('settings.manage'),
  },
  fields: [
    {
      name: 'googleEnabled',
      type: 'checkbox',
      defaultValue: true,
      label: { en: 'Show “Continue with Google”', ja: '「Google で続ける」を表示する' },
      admin: {
        description: {
          en: 'Also needs GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in the server settings; until both are set, the button stays hidden. When switched off, students who joined with Google can still log in by choosing “Forgot your password?” to set a password.',
          ja: 'サーバー設定に GOOGLE_CLIENT_ID と GOOGLE_CLIENT_SECRET も必要です。両方が設定されるまでボタンは表示されません。オフにした場合、Google で登録した受講者は「パスワードをお忘れですか？」からパスワードを設定してログインできます。',
        },
      },
    },
  ],
  hooks: {
    afterChange: [
      async ({ doc, previousDoc, req }) => {
        await recordAudit(
          req.payload,
          {
            actorType: req.user ? 'admin' : 'system',
            actorId: req.user?.id,
            action: 'settings.sign_in_updated',
            entityType: 'sign-in-settings',
            before: { googleEnabled: previousDoc?.googleEnabled ?? null },
            after: { googleEnabled: doc.googleEnabled ?? null },
          },
          req,
        )
      },
    ],
  },
}
