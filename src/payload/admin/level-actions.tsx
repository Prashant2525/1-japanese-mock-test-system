'use client'

import { useDocumentInfo, useTranslation } from '@payloadcms/ui'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

/**
 * Student sidebar: reset the level check, or change the level (D-013). Both need a written reason
 * and are checked and audited on the server; this panel only collects the input.
 */
const T = {
  title: { en: 'Level check', ja: 'レベルチェック' },
  reset: { en: 'Reset level check', ja: 'レベルチェックをリセット' },
  resetHelp: {
    en: 'The student takes the level check again from N5. Their current level is removed.',
    ja: '受講者はN5からレベルチェックを受け直します。現在のレベルは削除されます。',
  },
  override: { en: 'Change level', ja: 'レベルを変更' },
  overrideHelp: {
    en: 'Sets the level directly (Super Admin). The level check counts as complete.',
    ja: 'レベルを直接設定します（スーパー管理者）。レベルチェックは完了扱いになります。',
  },
  level: { en: 'New level', ja: '新しいレベル' },
  reason: { en: 'Reason (required, saved in the audit log)', ja: '理由（必須・監査ログに保存）' },
  confirm: { en: 'Confirm', ja: '確定' },
  cancel: { en: 'Cancel', ja: 'キャンセル' },
  done: { en: 'Done.', ja: '完了しました。' },
  failed: { en: 'Not done:', ja: '実行できませんでした：' },
  tooShort: {
    en: 'Write a reason of at least 5 characters.',
    ja: '理由を5文字以上で入力してください。',
  },
}

type Mode = 'reset' | 'override' | null

export function LevelActions() {
  const { id } = useDocumentInfo()
  const { i18n } = useTranslation()
  const router = useRouter()
  const t = (k: keyof typeof T) => (i18n.language === 'ja' ? T[k].ja : T[k].en)
  const [mode, setMode] = useState<Mode>(null)
  const [reason, setReason] = useState('')
  const [levelId, setLevelId] = useState('')
  const [levels, setLevels] = useState<{ id: number; code: string }[]>([])
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (mode !== 'override' || levels.length) return
    void fetch('/api/cms/levels?where[examType.code][equals]=JLPT&sort=order&depth=0&limit=20', {
      credentials: 'same-origin',
    })
      .then((r) => r.json())
      .then((d: { docs?: { id: number; code: string }[] }) => setLevels(d.docs ?? []))
  }, [mode, levels.length])

  if (!id) return null

  const submit = async () => {
    if (reason.trim().length < 5) return setMessage({ ok: false, text: t('tooShort') })
    setBusy(true)
    setMessage(null)
    const path = mode === 'reset' ? 'level-check/reset' : 'level/override'
    const body = mode === 'reset' ? { reason } : { reason, levelId: Number(levelId) }
    const res = await fetch(`/api/cms/students/${id}/${path}`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })
    setBusy(false)
    if (res.ok) {
      setMessage({ ok: true, text: t('done') })
      setMode(null)
      setReason('')
      router.refresh()
    } else {
      const err = (await res.json().catch(() => null)) as { error?: { message?: string } } | null
      setMessage({ ok: false, text: `${t('failed')} ${err?.error?.message ?? res.status}` })
    }
  }

  return (
    <div className="nm-level-actions field-type">
      <p className="field-label">{t('title')}</p>
      {message ? (
        <p role={message.ok ? 'status' : 'alert'} className={message.ok ? 'nm-yes' : 'nm-error'}>
          {message.text}
        </p>
      ) : null}
      {mode === null ? (
        <div className="nm-level-actions__buttons">
          <button
            type="button"
            className="btn btn--style-secondary btn--size-small"
            onClick={() => setMode('reset')}
          >
            {t('reset')}
          </button>
          <button
            type="button"
            className="btn btn--style-secondary btn--size-small"
            onClick={() => setMode('override')}
          >
            {t('override')}
          </button>
        </div>
      ) : (
        <div className="nm-level-actions__form">
          <p className="field-description">{t(mode === 'reset' ? 'resetHelp' : 'overrideHelp')}</p>
          {mode === 'override' ? (
            <label>
              <span className="field-label">{t('level')}</span>
              <select value={levelId} onChange={(e) => setLevelId(e.target.value)}>
                <option value="">—</option>
                {levels.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.code}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <label>
            <span className="field-label">{t('reason')}</span>
            <textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
          </label>
          <div className="nm-level-actions__buttons">
            <button
              type="button"
              className="btn btn--style-primary btn--size-small"
              disabled={busy || (mode === 'override' && !levelId)}
              onClick={submit}
            >
              {t('confirm')}
            </button>
            <button
              type="button"
              className="btn btn--style-secondary btn--size-small"
              onClick={() => setMode(null)}
            >
              {t('cancel')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
