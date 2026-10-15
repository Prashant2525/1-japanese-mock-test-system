import path from 'path'

import { APIError, type CollectionBeforeOperationHook, type CollectionConfig } from 'payload'

import { activeAdmin, hasPermission, never } from '@/payload/access'
import { ADMIN_GROUPS } from '@/payload/admin/groups'
import { auditTrail } from '@/payload/hooks/auditTrail'
import { mediaDeleteGuard } from '@/payload/hooks/contentLifecycle'
import { say } from '@/payload/say'
import { checkLearningFile, LEARNING_MEDIA_TYPES } from '@/server/media/files'

const audit = auditTrail({
  entityType: 'learning-media',
  action: 'learning_media',
  summary: (doc) => String(doc.filename ?? ''),
})

/** Files live outside /public. Development: local disk; R2 takes over when configured (D-041). */
export const LEARNING_MEDIA_DIR = path.resolve(
  process.env.LEARNING_MEDIA_DIR || path.join(process.cwd(), 'media', 'learning'),
)

/** Type, size and real-content checks before anything is stored (rule 10). */
const validateFile: CollectionBeforeOperationHook = ({ args, operation, req }) => {
  if ((operation === 'create' || operation === 'update') && req.file) {
    const problem = checkLearningFile({
      mimetype: req.file.mimetype,
      size: req.file.size,
      data: req.file.data,
    })
    if (problem) {
      const message =
        problem.reason === 'type'
          ? say(
              req,
              'This file type is not allowed. Use JPEG, PNG or WebP images, MP3, M4A, WAV or OGG audio, or PDF.',
              'このファイル形式は使用できません。JPEG・PNG・WebP 画像、MP3・M4A・WAV・OGG 音声、PDF を使用してください。',
            )
          : problem.reason === 'size'
            ? say(
                req,
                `This file is too large (maximum ${Math.round(problem.maxBytes / 1048576)} MB for this type).`,
                `ファイルが大きすぎます（この形式の上限は ${Math.round(problem.maxBytes / 1048576)} MB です）。`,
              )
            : say(
                req,
                'The file content does not match its type. Export the file again from the original program.',
                'ファイルの内容が形式と一致しません。元のアプリからファイルを書き出し直してください。',
              )
      throw new APIError(message, 400, null, true)
    }
  }
  return args
}

/**
 * Private learning media (D-041): images, audio and PDFs for study materials. Never public: the
 * admin panel reads files with an admin session; students only through signed, access-checked
 * links (/api/v1/media/:id). Deleting is allowed only while no material uses the file (D-092); the
 * stored file goes with it. Archiving hides a file from the picker but keeps it where it is used.
 */
export const LearningMedia: CollectionConfig = {
  slug: 'learning-media',
  labels: {
    singular: { en: 'Learning media', ja: '学習メディア' },
    plural: { en: 'Learning media', ja: '学習メディア' },
  },
  admin: {
    group: ADMIN_GROUPS.study,
    useAsTitle: 'filename',
    defaultColumns: ['filename', 'kind', 'alt', 'filesize', 'archived', 'updatedAt'],
    listSearchableFields: ['filename', 'alt', 'caption'],
    description: {
      en: 'Private images, audio and PDFs for study materials. Images up to 5 MB, PDFs up to 20 MB, audio up to 30 MB. Students reach them only through materials they may open.',
      ja: '学習教材用の非公開の画像・音声・PDFです。画像は5MB、PDFは20MB、音声は30MBまで。受講者は閲覧可能な教材からのみアクセスできます。',
    },
  },
  upload: {
    staticDir: LEARNING_MEDIA_DIR,
    mimeTypes: Object.keys(LEARNING_MEDIA_TYPES),
    adminThumbnail: ({ doc }) =>
      typeof doc.mimeType === 'string' && doc.mimeType.startsWith('image/')
        ? `/api/cms/learning-media/file/${encodeURIComponent(String(doc.filename))}`
        : null,
  },
  access: {
    read: activeAdmin,
    create: hasPermission('media.manage'),
    update: hasPermission('media.manage'),
    delete: hasPermission('media.delete'),
  },
  fields: [
    {
      name: 'usedBy',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: { Field: '/payload/admin/used-by#UsedBy' },
      },
    },
    {
      name: 'archived',
      type: 'checkbox',
      defaultValue: false,
      label: { en: 'Archived', ja: 'アーカイブ' },
      admin: {
        position: 'sidebar',
        components: { Cell: '/payload/admin/cells#YesNoCell' },
        description: {
          en: 'Hidden from the file picker for new attachments. Materials that already use it keep it.',
          ja: '新しい添付の選択肢から外します。すでに使用している教材ではそのまま使えます。',
        },
      },
    },
    {
      name: 'kind',
      type: 'select',
      options: [
        { value: 'image', label: { en: 'Image', ja: '画像' } },
        { value: 'audio', label: { en: 'Audio', ja: '音声' } },
        { value: 'pdf', label: { en: 'PDF', ja: 'PDF' } },
      ],
      label: { en: 'Kind', ja: '種類' },
      access: { create: never, update: never },
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'alt',
      type: 'text',
      localized: true,
      maxLength: 300,
      label: { en: 'Alternative text', ja: '代替テキスト' },
      admin: {
        description: {
          en: 'For images: what the image shows, read aloud to students who cannot see it. Required for images.',
          ja: '画像の場合：画像の内容を説明する文章（画面が見えない受講者向けに読み上げられます）。画像には必須です。',
        },
      },
      validate: (
        value: unknown,
        { data, req }: { data: { mimeType?: string }; req: Parameters<typeof say>[0] },
      ) =>
        !data.mimeType?.startsWith('image/') || (typeof value === 'string' && value.trim())
          ? true
          : say(
              req,
              'Describe the image for students who cannot see it.',
              '画像が見えない受講者のために、画像の内容を説明してください。',
            ),
    },
    {
      name: 'caption',
      type: 'text',
      localized: true,
      maxLength: 300,
      label: { en: 'Caption', ja: 'キャプション' },
    },
    {
      name: 'durationSec',
      type: 'number',
      min: 0,
      label: { en: 'Audio length (seconds)', ja: '音声の長さ（秒）' },
      admin: {
        condition: (data) =>
          typeof data?.mimeType === 'string' && data.mimeType.startsWith('audio/'),
      },
    },
  ],
  hooks: {
    beforeOperation: [validateFile],
    beforeDelete: [mediaDeleteGuard],
    beforeChange: [
      ({ data }) => {
        const rule =
          typeof data.mimeType === 'string' ? LEARNING_MEDIA_TYPES[data.mimeType] : undefined
        if (rule) data.kind = rule.kind
        return data
      },
    ],
    afterChange: [audit.afterChange],
    afterDelete: [audit.afterDelete],
  },
}
