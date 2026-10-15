import {
  APIError,
  type CollectionBeforeDeleteHook,
  type CollectionBeforeOperationHook,
  type CollectionSlug,
  type Payload,
  type PayloadRequest,
  type Where,
} from 'payload'

import { say } from '@/payload/say'
import { can, type Permission } from '@/server/auth/permissions'

/**
 * Content lifecycle rules (D-091, D-092; LC-R01..R04):
 * - only someone with the publish permission may change what students see live (publish,
 *   unpublish, archive or edit a published item); a draft save leaves the live item alone;
 * - permanent deletion is refused while anything still uses the record, naming each user.
 */

export type Usage = { label: string; status: 'published' | 'draft' }

/** Study materials (live or latest draft) whose `field` points at `id`. */
async function materialsWhere(
  payload: Payload,
  field: 'attachments.media' | 'category',
  id: number | string,
  req?: PayloadRequest,
): Promise<Usage[]> {
  const found = new Map<number | string, Usage>()
  const live = await payload.find({
    collection: 'study-materials',
    where: { [field]: { equals: id } } as Where,
    pagination: false,
    depth: 0,
    overrideAccess: true,
    req,
  })
  for (const m of live.docs) {
    found.set(m.id, { label: String(m.title ?? m.slug), status: m._status ?? 'draft' })
  }
  // A newer draft may use it even when the live version does not.
  const drafts = await payload.findVersions({
    collection: 'study-materials',
    where: {
      and: [{ [`version.${field}`]: { equals: id } }, { latest: { equals: true } }],
    } as Where,
    pagination: false,
    depth: 0,
    overrideAccess: true,
    req,
  })
  for (const v of drafts.docs) {
    const p = v.parent as unknown as number | { id: number }
    const parent = typeof p === 'object' ? p.id : p
    if (!found.has(parent)) {
      found.set(parent, { label: String(v.version.title ?? v.version.slug), status: 'draft' })
    }
  }
  return [...found.values()]
}

export const mediaUsage = (payload: Payload, id: number | string, req?: PayloadRequest) =>
  materialsWhere(payload, 'attachments.media', id, req)

export const categoryUsage = (payload: Payload, id: number | string, req?: PayloadRequest) =>
  materialsWhere(payload, 'category', id, req)

function usedBy(req: PayloadRequest, usage: Usage[]): string {
  const list = usage
    .slice(0, 10)
    .map(
      (u) =>
        `“${u.label}” (${u.status === 'published' ? say(req, 'published', '公開中') : say(req, 'draft', '下書き')})`,
    )
    .join(', ')
  const more =
    usage.length > 10
      ? say(req, ` and ${usage.length - 10} more`, ` ほか${usage.length - 10}件`)
      : ''
  return list + more
}

const refuse = (message: string) => new APIError(message, 409, null, true)

/**
 * Edits that change the live item need `permission`: publishing, and any non-draft save of an item
 * that is published now (unpublish, archive, direct edits). Draft saves only add a version.
 */
export const guardLiveChanges =
  (permission: Permission): CollectionBeforeOperationHook =>
  async ({ args, operation, req, collection }) => {
    const a = args as {
      id?: number | string
      where?: Where
      draft?: boolean
      overrideAccess?: boolean
      data?: { _status?: string }
    }
    if (operation !== 'update' || a.overrideAccess || can(req.user, permission)) return args
    if (a.draft && a.data?._status !== 'published') return args
    const target: Where = a.id !== undefined ? { id: { equals: a.id } } : (a.where ?? {})
    const live = await req.payload.find({
      collection: collection.slug as CollectionSlug,
      where: { and: [target, { _status: { equals: 'published' } }] },
      limit: 1,
      depth: 0,
      overrideAccess: true,
      req,
    })
    if (live.totalDocs > 0) {
      throw new APIError(
        say(
          req,
          'Only someone who may publish can change, unpublish or archive a published item. Save a draft instead.',
          '公開中の項目の変更・非公開・アーカイブは公開権限を持つ人だけができます。下書きとして保存してください。',
        ),
        403,
        null,
        true,
      )
    }
    return args
  }

/** Learning media: refused while a material (live or latest draft) attaches it. */
export const mediaDeleteGuard: CollectionBeforeDeleteHook = async ({ id, req }) => {
  const usage = await mediaUsage(req.payload, id, req)
  if (usage.length) {
    throw refuse(
      say(
        req,
        `This file is still used by ${usedBy(req, usage)}. Remove it from those materials first, or archive the file instead.`,
        `このファイルは ${usedBy(req, usage)} で使用中です。先に教材から外すか、ファイルをアーカイブしてください。`,
      ),
    )
  }
}

/** Study categories: refused while any material is in it. */
export const categoryDeleteGuard: CollectionBeforeDeleteHook = async ({ id, req }) => {
  const usage = await categoryUsage(req.payload, id, req)
  if (usage.length) {
    throw refuse(
      say(
        req,
        `This category still has materials: ${usedBy(req, usage)}. Move or delete them first, or switch the category off.`,
        `このカテゴリにはまだ教材があります：${usedBy(req, usage)}。先に移動または削除するか、カテゴリを無効にしてください。`,
      ),
    )
  }
}

/**
 * Questions: only ones that were never published (so in no level-check version or other snapshot)
 * and that the level-check settings do not list.
 */
export const questionDeleteGuard: CollectionBeforeDeleteHook = async ({ id, req }) => {
  const { payload } = req
  const everPublished = await payload.findVersions({
    collection: 'questions',
    where: { and: [{ parent: { equals: id } }, { 'version._status': { equals: 'published' } }] },
    limit: 1,
    depth: 0,
    overrideAccess: true,
    req,
  })
  const live = await payload.find({
    collection: 'questions',
    where: { and: [{ id: { equals: id } }, { _status: { equals: 'published' } }] },
    limit: 1,
    depth: 0,
    overrideAccess: true,
    req,
  })
  if (everPublished.totalDocs > 0 || live.totalDocs > 0) {
    throw refuse(
      say(
        req,
        'This question has been published, so results and level-check versions may depend on it. Archive it instead.',
        'この問題は公開されたことがあるため、結果やレベルチェックの版が参照している可能性があります。アーカイブしてください。',
      ),
    )
  }
  for (const draft of [false, true]) {
    const settings = await payload.findGlobal({
      slug: 'level-check-settings',
      draft,
      depth: 0,
      overrideAccess: true,
      req,
    })
    const listed = (settings.stages ?? []).some((s) =>
      (s.questions ?? []).some((q) => (typeof q === 'object' ? q.id : q) === Number(id)),
    )
    if (listed) {
      throw refuse(
        say(
          req,
          'The level check settings list this question. Remove it there first.',
          'レベルチェック設定がこの問題を使用しています。先に設定から外してください。',
        ),
      )
    }
  }
}
