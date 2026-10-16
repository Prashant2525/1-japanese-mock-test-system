import type { CollectionConfig } from 'payload'

import { hasPermission, never } from '@/payload/access'
import { ADMIN_GROUPS } from '@/payload/admin/groups'

/**
 * Study progress (RV-12, D-099; brought forward for the dashboard, D-107): one row per student and
 * material — when they first and last opened it, and when they marked it as studied. Written only
 * by the study service (opening a material page, the "Mark as studied" button); read-only here.
 * No time-on-page is measured. Progress shown to the student is always recomputed against the
 * materials they may see now, so archived or hidden materials never count.
 */
export const StudyProgress: CollectionConfig = {
  slug: 'study-progress',
  labels: {
    singular: { en: 'Study progress', ja: '学習の進み具合' },
    plural: { en: 'Study progress', ja: '学習の進み具合' },
  },
  admin: {
    group: ADMIN_GROUPS.study,
    defaultColumns: ['student', 'material', 'lastOpenedAt', 'studiedAt'],
    description: {
      en: 'Which materials each student has opened and marked as studied. Recorded by the app; read-only.',
      ja: '受講者ごとに開いた教材・学習済みにした教材の記録です。アプリが記録し、読み取り専用です。',
    },
  },
  defaultSort: '-lastOpenedAt',
  indexes: [{ fields: ['student', 'material'], unique: true }],
  access: {
    read: hasPermission('students.read'),
    create: never,
    update: never,
    delete: never,
  },
  fields: [
    {
      name: 'student',
      type: 'relationship',
      relationTo: 'students',
      required: true,
      index: true,
      label: { en: 'Student', ja: '受講者' },
    },
    {
      name: 'material',
      type: 'relationship',
      relationTo: 'study-materials',
      required: true,
      label: { en: 'Material', ja: '教材' },
    },
    {
      name: 'firstOpenedAt',
      type: 'date',
      required: true,
      label: { en: 'First opened', ja: '初回閲覧' },
      admin: { date: { pickerAppearance: 'dayAndTime' } },
    },
    {
      name: 'lastOpenedAt',
      type: 'date',
      required: true,
      index: true,
      label: { en: 'Last opened', ja: '最終閲覧' },
      admin: { date: { pickerAppearance: 'dayAndTime' } },
    },
    {
      name: 'studiedAt',
      type: 'date',
      label: { en: 'Marked as studied', ja: '学習済みにした日時' },
      admin: { date: { pickerAppearance: 'dayAndTime' } },
    },
  ],
}
