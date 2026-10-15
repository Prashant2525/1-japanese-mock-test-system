/**
 * Creates or deletes the throwaway E2E accounts in their own process (so no database
 * connection stays open in the Playwright runner).
 *   pnpm exec tsx tests/e2e/e2e-admin.ts create   → prints one E2E_FIXTURE=<json> line (random credentials)
 *   pnpm exec tsx tests/e2e/e2e-admin.ts delete
 *   pnpm exec tsx tests/e2e/e2e-admin.ts google on|off   → the CMS switch for Google sign-in
 */
import { randomBytes } from 'node:crypto'

import { Secret } from 'otpauth'

import 'dotenv/config'

import {
  E2E_ADMIN_EMAIL,
  E2E_EDITOR_EMAIL,
  E2E_NEW_ADMIN_EMAIL,
  E2E_STUDENT_EMAIL,
  E2E_SUPPORT_EMAIL,
  E2E_UI_DOMAIN,
} from './admin-account'

async function main(action: string | undefined): Promise<void> {
  const { getPayload } = await import('payload')
  const { default: config } = await import('../../src/payload.config')
  const payload = await getPayload({ config })

  // `token verify|reset <email>`: print the current emailed token for a UI-test student (the E2E
  // server uses the console email transport, so tests read the token from the database instead).
  if (action === 'token') {
    const [kind, email] = process.argv.slice(3)
    if (!email?.endsWith(E2E_UI_DOMAIN))
      throw new Error('token lookup is limited to UI-test students')
    const found = await payload.find({
      collection: 'students',
      where: { email: { equals: email } },
      showHiddenFields: true,
      limit: 1,
    })
    const doc = found.docs[0] as
      { _verificationToken?: string; resetPasswordToken?: string } | undefined
    const token = kind === 'reset' ? doc?.resetPasswordToken : doc?._verificationToken
    if (!token) throw new Error(`no ${kind} token for ${email}`)
    console.log(`TOKEN=${token}`)
    return
  }

  // `google on|off`: the CMS switch for "Continue with Google" (Settings → Sign-in options).
  if (action === 'google') {
    const state = process.argv[3]
    if (state !== 'on' && state !== 'off') throw new Error('usage: e2e-admin.ts google on|off')
    await payload.updateGlobal({
      slug: 'sign-in-settings',
      data: { googleEnabled: state === 'on' },
    })
    return
  }

  // `student <email> <password>`: a confirmed UI-test student (skips the email round trip).
  // `level <email> <code|none>`: set that student's level-check state, standing in for the
  // level-check service of Phase 11 (`none` = not started).
  // `study <slug> <levelCode> [download]`: a published study material with a PDF, an MP3 and an
  // image, and a body with furigana; `download` allows downloading its files (D-097). Created as the
  // E2E Super Admin (relationship filters use the caller's access).
  if (action === 'study') {
    const [slug, levelCode, download] = process.argv.slice(3)
    if (!slug?.startsWith('e2e-') || !levelCode)
      throw new Error('usage: study e2e-<slug> <levelCode>')
    const { PDF, MP3, PNG } = await import('../fixtures/files')
    const admin = (
      await payload.find({
        collection: 'admins',
        where: { email: { equals: E2E_ADMIN_EMAIL } },
        depth: 1,
      })
    ).docs[0]!
    const user = { ...admin, collection: 'admins' as const, _strategy: 'totp' }
    const level = (
      await payload.find({
        collection: 'levels',
        where: { and: [{ code: { equals: levelCode } }, { 'examType.code': { equals: 'JLPT' } }] },
      })
    ).docs[0]!
    const grammar = (
      await payload.find({
        collection: 'material-categories',
        where: { key: { equals: 'grammar' } },
      })
    ).docs[0]!
    const media = []
    for (const [data, mimetype, name, alt] of [
      [PDF, 'application/pdf', `${slug}.pdf`, undefined],
      [MP3, 'audio/mpeg', `${slug}.mp3`, undefined],
      [PNG, 'image/png', `${slug}.png`, 'A small test picture'],
    ] as const) {
      const doc = await payload.create({
        collection: 'learning-media',
        data: { alt },
        file: { data, mimetype, name, size: data.length },
        user,
        overrideAccess: false,
      })
      media.push(doc.id)
    }
    const text = (t: string) => ({
      type: 'text',
      text: t,
      format: 0,
      style: '',
      mode: 'normal',
      detail: 0,
      version: 1,
    })
    await payload.create({
      collection: 'study-materials',
      data: {
        title: `E2E material ${levelCode}`,
        slug,
        level: level.id,
        category: grammar.id,
        summary: 'A material created by the browser tests.',
        order: 1,
        body: {
          root: {
            type: 'root',
            format: '',
            indent: 0,
            version: 1,
            direction: 'ltr',
            children: [
              {
                type: 'paragraph',
                format: '',
                indent: 0,
                version: 1,
                direction: 'ltr',
                textFormat: 0,
                textStyle: '',
                children: [text('{日本語|にほんご}を勉強しましょう。')],
              },
            ],
          },
        },
        attachments: media.map((id) => ({ media: id, allowDownload: download === 'download' })),
        _status: 'published',
      },
      user,
      overrideAccess: false,
    })
    return
  }

  if (action === 'student' || action === 'level') {
    const [email, arg] = process.argv.slice(3)
    if (!email?.endsWith(E2E_UI_DOMAIN) || !arg)
      throw new Error('student/level actions are limited to UI-test students')
    if (action === 'student') {
      const student = await payload.create({
        collection: 'students',
        disableVerificationEmail: true,
        data: {
          name: 'UI Student',
          email,
          password: arg,
          preferredLocale: 'en',
          status: 'active',
          determinationStatus: 'not_started',
        },
      })
      await payload.db.updateOne({
        collection: 'students',
        id: student.id,
        data: { _verified: true },
        returning: false,
      })
      return
    }
    const found = await payload.find({
      collection: 'students',
      where: { email: { equals: email } },
      limit: 1,
    })
    const level =
      arg === 'none'
        ? undefined
        : (
            await payload.find({
              collection: 'levels',
              where: {
                and: [{ code: { equals: arg } }, { 'examType.code': { equals: 'JLPT' } }],
              },
              limit: 1,
            })
          ).docs[0]
    await payload.db.updateOne({
      collection: 'students',
      id: found.docs[0]!.id,
      data: {
        determinationStatus: level ? 'completed' : 'not_started',
        assignedLevel: level?.id ?? null,
        assignedAt: level ? new Date().toISOString() : null,
      },
      returning: false,
    })
    return
  }

  // Level-check records of test students go first: the database protects these links.
  const { sql } = await import('@payloadcms/db-postgres')
  const testStudents = sql`SELECT id FROM students WHERE email LIKE ${'%' + E2E_UI_DOMAIN} OR email = ${E2E_STUDENT_EMAIL}`
  await payload.db.drizzle.execute(sql`
    DELETE FROM result_items WHERE result_id IN (SELECT id FROM results WHERE student_id IN (${testStudents}));
  `)
  for (const table of ['results', 'attempts', 'level_assignments', 'level_check_sessions']) {
    await payload.db.drizzle.execute(
      sql`DELETE FROM ${sql.identifier(table)} WHERE student_id IN (${testStudents})`,
    )
  }

  // Study materials and media made by the browser tests (slugs and file names start with e2e-).
  await payload.db.deleteMany({ collection: 'study-materials', where: { slug: { like: 'e2e-' } } })
  await payload.db.deleteMany({
    collection: 'learning-media',
    where: { filename: { like: 'e2e-' } },
  })

  // Students created through the UI by tests (unique address per run).
  await payload.db.deleteMany({
    collection: 'students',
    where: { email: { contains: E2E_UI_DOMAIN } },
  })

  // Repeated local runs would otherwise hit the per-account login limits (10 per 15 minutes).
  const { clearRateLimits } = await import('../../src/server/rate-limit')
  const adminEmails = [E2E_ADMIN_EMAIL, E2E_EDITOR_EMAIL, E2E_NEW_ADMIN_EMAIL, E2E_SUPPORT_EMAIL]
  await clearRateLimits(payload, [
    ...adminEmails.flatMap((e) => [`admins:login:acct:${e}`, `admins:forgotPassword:acct:${e}`]),
    `login:acct:${E2E_STUDENT_EMAIL}`,
    `email:acct:${E2E_STUDENT_EMAIL}`,
  ])

  // Admins cannot be deleted through the API (by design); the fixture removes them directly.
  await payload.db.deleteMany({
    collection: 'admins',
    where: { email: { in: adminEmails } },
  })
  await payload.db.deleteMany({
    collection: 'students',
    where: { email: { equals: E2E_STUDENT_EMAIL } },
  })
  if (action === 'delete') return
  if (action !== 'create') throw new Error('usage: e2e-admin.ts create|delete|token')

  const roleId = async (name: string) =>
    (await payload.find({ collection: 'roles', where: { name: { equals: name } }, limit: 1 }))
      .docs[0]!.id
  const pw = () => randomBytes(18).toString('base64url')

  async function createAdmin(name: string, email: string, role: string, enrolTotp: boolean) {
    const password = pw()
    const admin = await payload.create({
      collection: 'admins',
      data: {
        name,
        email,
        password,
        roles: [await roleId(role)],
        preferredLocale: 'en',
        status: 'active',
      },
    })
    let secret = ''
    if (enrolTotp) {
      secret = new Secret().base32
      await payload.db.updateOne({
        collection: 'admins',
        id: admin.id,
        data: { totpSecret: secret },
        returning: false,
      })
    }
    return { password, secret }
  }

  const superAdmin = await createAdmin('E2E Admin', E2E_ADMIN_EMAIL, 'Super Admin', true)
  const editor = await createAdmin('E2E Editor', E2E_EDITOR_EMAIL, 'Content Editor', true)
  const newcomer = await createAdmin('E2E New Admin', E2E_NEW_ADMIN_EMAIL, 'Support', false)
  const support = await createAdmin('E2E Support', E2E_SUPPORT_EMAIL, 'Support', true)

  const studentPassword = pw()
  const student = await payload.create({
    collection: 'students',
    disableVerificationEmail: true,
    data: {
      name: 'E2E Student',
      email: E2E_STUDENT_EMAIL,
      password: studentPassword,
      preferredLocale: 'en',
      status: 'active',
      determinationStatus: 'not_started',
    },
  })
  await payload.db.updateOne({
    collection: 'students',
    id: student.id,
    data: { _verified: true },
    returning: false,
  })

  const fixture = {
    admin: { pw: superAdmin.password, totp: superAdmin.secret },
    editor: { pw: editor.password, totp: editor.secret },
    newAdmin: { pw: newcomer.password },
    support: { pw: support.password, totp: support.secret },
    student: { pw: studentPassword },
  }
  console.log(`E2E_FIXTURE=${JSON.stringify(fixture)}`)
}

main(process.argv[2]).then(
  () => process.exit(0),
  (err) => {
    console.error(err)
    process.exit(1)
  },
)
