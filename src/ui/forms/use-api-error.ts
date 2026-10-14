'use client'

import { useTranslations } from 'next-intl'
import { useCallback } from 'react'

import { errorLabelKey, type ApiErrorInfo } from '../lib/api'

/** Translates validation-message keys and API error codes into the visitor's language. */
export function useMessages() {
  const t = useTranslations()
  const fieldError = useCallback(
    (message: string | undefined) => (message ? t(message as never) : undefined),
    [t],
  )
  const apiError = useCallback(
    (error: ApiErrorInfo) => {
      const { key, values } = errorLabelKey(error)
      return t(key as never, values as never)
    },
    [t],
  )
  return { t, fieldError, apiError }
}
