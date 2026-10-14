import type { CollectionConfig } from 'payload'

/**
 * Admin-panel users (ARCHITECTURE §4). Phase 6 keeps this minimal; Phase 7 adds roles,
 * granular permissions, status and the CLI that creates the first Super Admin.
 *
 * Access is closed by default: creating an admin requires an authenticated admin, which
 * also disables Payload's public "create first user" form. The first admin is created
 * from the command line (no default passwords).
 */
export const Admins: CollectionConfig = {
  slug: 'admins',
  labels: { singular: 'Admin', plural: 'Admins' },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['name', 'email', 'updatedAt'],
    group: 'People',
  },
  auth: {
    maxLoginAttempts: 5,
    lockTime: 15 * 60 * 1000,
    tokenExpiration: 8 * 60 * 60,
    cookies: {
      sameSite: 'Lax',
      secure: process.env.NODE_ENV === 'production',
    },
  },
  access: {
    admin: ({ req }) => Boolean(req.user && req.user.collection === 'admins'),
    create: ({ req }) => Boolean(req.user && req.user.collection === 'admins'),
    read: ({ req }) => Boolean(req.user && req.user.collection === 'admins'),
    update: ({ req }) => Boolean(req.user && req.user.collection === 'admins'),
    delete: () => false,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      maxLength: 120,
    },
  ],
}
