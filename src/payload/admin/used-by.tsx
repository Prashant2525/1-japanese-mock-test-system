import type { Payload, PayloadRequest } from 'payload'

import { mediaUsage } from '@/payload/hooks/contentLifecycle'

/**
 * Learning-media sidebar: the materials that use this file (live or latest draft). A file in use
 * cannot be deleted (D-092); this list shows where to remove it first.
 */
const T = {
  title: { en: 'Used by', ja: '使用している教材' },
  none: {
    en: 'Not used by any material. It can be deleted.',
    ja: 'どの教材にも使われていません。削除できます。',
  },
  published: { en: 'published', ja: '公開中' },
  draft: { en: 'draft', ja: '下書き' },
  hint: {
    en: 'Remove it from these materials before deleting, or archive it.',
    ja: '削除する前にこれらの教材から外すか、アーカイブしてください。',
  },
}

export async function UsedBy({
  id,
  payload,
  req,
}: {
  id?: number | string
  payload: Payload
  req: PayloadRequest
}) {
  const ja = req.i18n?.language === 'ja'
  const t = (k: keyof typeof T) => (ja ? T[k].ja : T[k].en)
  if (id === undefined) return null
  const usage = await mediaUsage(payload, id, req)
  return (
    <div className="nm-used-by" style={{ marginBottom: 'var(--base)' }}>
      <h4 style={{ margin: '0 0 calc(var(--base) / 2)' }}>{t('title')}</h4>
      {usage.length === 0 ? (
        <p style={{ margin: 0 }}>{t('none')}</p>
      ) : (
        <>
          <ul style={{ margin: 0, paddingInlineStart: '1.2em' }}>
            {usage.map((u, i) => (
              <li key={i}>
                {u.label} ({t(u.status === 'published' ? 'published' : 'draft')})
              </li>
            ))}
          </ul>
          <p style={{ margin: 'calc(var(--base) / 2) 0 0', opacity: 0.8 }}>{t('hint')}</p>
        </>
      )}
    </div>
  )
}
