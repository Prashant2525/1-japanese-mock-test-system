import type { CollectionConfig } from 'payload'

import { never } from '@/payload/access'

/**
 * Study plans (D-111): a student's own short notes on calendar days ("Grammar: は and が"),
 * which they can tick off or remove. Private to the student: hidden from the admin panel and
 * closed to every CMS request; only the student's own API (/api/v1/me/plans) reads or writes them.
 * `date` is the Nepal calendar date (YYYY-MM-DD).
 */
export const StudyPlans: CollectionConfig = {
  slug: 'study-plans',
  admin: { hidden: true },
  indexes: [{ fields: ['student', 'date'] }],
  access: { read: never, create: never, update: never, delete: never },
  fields: [
    {
      name: 'student',
      type: 'relationship',
      relationTo: 'students',
      required: true,
      index: true,
    },
    { name: 'date', type: 'text', required: true },
    { name: 'note', type: 'text', required: true, maxLength: 80 },
    { name: 'done', type: 'checkbox', defaultValue: false },
  ],
}
