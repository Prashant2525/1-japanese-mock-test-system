import { lexicalEditor } from '@payloadcms/richtext-lexical'
import type { Access, CollectionConfig, PayloadRequest } from 'payload'

import { activeAdmin, never } from '@/payload/access'
import { ADMIN_GROUPS } from '@/payload/admin/groups'
import { auditTrail } from '@/payload/hooks/auditTrail'
import { say } from '@/payload/say'
import { can } from '@/server/auth/permissions'

const audit = auditTrail({
  entityType: 'study-materials',
  action: 'study_material',
  summary: (doc) => String(doc.slug ?? ''),
})

/** Saving a draft needs `materials.manage`; publishing needs `materials.publish`. */
const canSave: Access = ({ req, data }) =>
  (data as { _status?: string } | undefined)?._status === 'published'
    ? can(req.user, 'materials.publish')
    : can(req.user, 'materials.manage')

/**
 * Study materials (SM-R01..R06): EN/JA text with optional furigana, images, audio and PDFs, by
 * level and category. Draft → publish; archive to hide. Students see published, non-archived
 * materials of their level and below, in enabled categories (server-enforced in the study service).
 */
export const StudyMaterials: CollectionConfig = {
  slug: 'study-materials',
  labels: {
    singular: { en: 'Study material', ja: '学習教材' },
    plural: { en: 'Study materials', ja: '学習教材' },
  },
  admin: {
    group: ADMIN_GROUPS.study,
    useAsTitle: 'title',
    defaultColumns: ['title', 'level', 'category', 'order', '_status', 'archived', 'updatedAt'],
    listSearchableFields: ['title', 'slug'],
    pagination: { defaultLimit: 25, limits: [25, 50, 100] },
    description: {
      en: 'Lessons and reading material for students. Publish to make a material visible at once (no redeploy); archive to hide it.',
      ja: '受講者向けのレッスンや教材です。公開するとすぐに表示されます（再デプロイ不要）。アーカイブすると非表示になります。',
    },
  },
  defaultSort: 'order',
  versions: { drafts: true, maxPerDoc: 30 },
  access: {
    read: activeAdmin,
    create: canSave,
    update: canSave,
    delete: never,
    readVersions: activeAdmin,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
      maxLength: 160,
      label: { en: 'Title', ja: 'タイトル' },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'level',
          type: 'relationship',
          relationTo: 'levels',
          required: true,
          index: true,
          label: { en: 'Level', ja: 'レベル' },
          filterOptions: {
            and: [{ 'examType.code': { equals: 'JLPT' } }, { enabledForStudy: { equals: true } }],
          },
          admin: { width: '50%', allowCreate: false },
        },
        {
          name: 'category',
          type: 'relationship',
          relationTo: 'material-categories',
          required: true,
          index: true,
          label: { en: 'Category', ja: 'カテゴリー' },
          admin: { width: '50%', allowCreate: false },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'slug',
          type: 'text',
          required: true,
          unique: true,
          index: true,
          label: { en: 'Address name', ja: 'アドレス名' },
          admin: {
            width: '50%',
            description: {
              en: 'Part of the page address, e.g. n5-particles-wa-ga.',
              ja: 'ページのアドレスの一部（例：n5-particles-wa-ga）。',
            },
          },
          validate: (value: string | null | undefined, { req }: { req: PayloadRequest }) =>
            typeof value === 'string' &&
            /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) &&
            value.length <= 100
              ? true
              : say(
                  req,
                  'Use lower-case letters, digits and single hyphens (up to 100 characters).',
                  '英小文字・数字・ハイフン（連続不可）で100文字以内にしてください。',
                ),
        },
        {
          name: 'order',
          type: 'number',
          required: true,
          defaultValue: 1,
          min: 1,
          max: 9999,
          label: { en: 'Display order', ja: '表示順' },
          admin: { width: '50%' },
        },
      ],
    },
    {
      name: 'summary',
      type: 'textarea',
      localized: true,
      maxLength: 400,
      label: { en: 'Summary', ja: '概要' },
      admin: { rows: 2 },
    },
    {
      name: 'body',
      type: 'richText',
      localized: true,
      label: { en: 'Content', ja: '本文' },
      admin: {
        description: {
          en: 'Furigana (optional): write {漢字|かんじ}. Add images, audio and PDFs under Attachments below.',
          ja: 'ふりがな（任意）：{漢字|かんじ} と書きます。画像・音声・PDFは下の「添付ファイル」に追加します。',
        },
      },
      editor: lexicalEditor({
        // Files go through private, signed attachments, not inline uploads or links to documents.
        features: ({ defaultFeatures }) =>
          defaultFeatures.filter((f) => !['upload', 'relationship'].includes(f.key)),
      }),
    },
    {
      name: 'attachments',
      type: 'array',
      maxRows: 30,
      label: { en: 'Attachments', ja: '添付ファイル' },
      labels: {
        singular: { en: 'Attachment', ja: '添付ファイル' },
        plural: { en: 'Attachments', ja: '添付ファイル' },
      },
      admin: {
        description: {
          en: 'Images, audio and PDFs from Learning media, in display order.',
          ja: '学習メディアの画像・音声・PDF（表示順）。',
        },
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'media',
              type: 'upload',
              relationTo: 'learning-media',
              required: true,
              label: { en: 'File', ja: 'ファイル' },
              admin: { width: '50%' },
            },
            {
              name: 'title',
              type: 'text',
              localized: true,
              maxLength: 160,
              label: { en: 'Label (optional)', ja: 'ラベル（任意）' },
              admin: { width: '50%' },
            },
          ],
        },
      ],
    },
    {
      name: 'archived',
      type: 'checkbox',
      defaultValue: false,
      label: { en: 'Archived', ja: 'アーカイブ済み' },
      admin: {
        position: 'sidebar',
        components: { Cell: '/payload/admin/cells#YesNoCell' },
        description: {
          en: 'Archived materials are hidden from students but kept.',
          ja: 'アーカイブした教材は受講者に表示されませんが、保存されます。',
        },
      },
    },
  ],
  hooks: { afterChange: [audit.afterChange], afterDelete: [audit.afterDelete] },
}
