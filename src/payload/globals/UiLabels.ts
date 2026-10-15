import type { Field, GlobalConfig } from 'payload'

import { LABEL_GROUPS } from '@/i18n/label-groups'
import { type Messages, valueAt } from '@/i18n/labels'
import en from '@/i18n/messages/en.json'
import ja from '@/i18n/messages/ja.json'
import { hasPermission } from '@/payload/access'
import { recordAudit } from '@/server/audit/record'
import { invalidateLabelOverrides } from '@/server/i18n/label-overrides'
import { ADMIN_GROUPS } from '@/payload/admin/groups'

const humanize = (key: string) =>
  key
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^./, (c) => c.toUpperCase())

/**
 * One localized text field per UI label, mirroring messages/en.json. Empty = use the default.
 * The defaults are shown under each field so editors know what they are replacing.
 */
function buildFields(node: Messages, path: string[] = []): Field[] {
  return Object.entries(node).map(([key, value]): Field => {
    const here = [...path, key]
    if (typeof value === 'string') {
      const jaDefault = valueAt(ja as Messages, here) ?? ''
      const admin = {
        placeholder: value,
        description: `Default — EN: “${value}” · JA: “${jaDefault}”. Leave empty to keep the default. Keep {placeholders} exactly as they are.`,
      }
      return value.length > 70
        ? { name: key, label: humanize(key), type: 'textarea', localized: true, admin }
        : { name: key, label: humanize(key), type: 'text', localized: true, admin }
    }
    return { name: key, label: humanize(key), type: 'group', fields: buildFields(value, here) }
  })
}

/** CMS override layer for every UI label on the website (D-030), split into a few globals. */
export const UiLabelGlobals: GlobalConfig[] = LABEL_GROUPS.map((group) => {
  const subset: Messages = Object.fromEntries(
    group.namespaces.map((ns) => [ns, (en as Messages)[ns] as Messages]),
  )
  return {
    slug: group.slug,
    label: group.label,
    admin: {
      group: ADMIN_GROUPS.content,
      description:
        'Buttons, headings and messages on the website. Switch the language at the top to edit Japanese. Empty fields use the built-in text.',
    },
    access: {
      read: hasPermission('content.manage'),
      update: hasPermission('content.manage'),
    },
    fields: buildFields(subset),
    hooks: {
      afterChange: [
        async ({ req }) => {
          invalidateLabelOverrides()
          await recordAudit(
            req.payload,
            {
              actorType: req.user ? 'admin' : 'system',
              actorId: req.user?.id,
              action: 'ui_labels.updated',
              entityType: group.slug,
              summary: `locale ${req.locale ?? 'en'}`,
            },
            req,
          )
        },
      ],
    },
  }
})
