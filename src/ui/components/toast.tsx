'use client'

import * as RadixToast from '@radix-ui/react-toast'
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

import { cn } from '../lib/cn'

type Toast = { id: number; title: string; tone: 'success' | 'info' | 'danger' }
type ToastContextValue = { show: (title: string, tone?: Toast['tone']) => void }

const ToastContext = createContext<ToastContextValue | null>(null)

/** Accessible toasts (Radix: announced politely, swipe/Escape to dismiss, pause on hover/focus). */
export function ToastProvider({
  children,
  label,
  closeLabel,
}: {
  children: ReactNode
  label: string
  closeLabel: string
}) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const show = useCallback((title: string, tone: Toast['tone'] = 'success') => {
    setToasts((all) => [...all, { id: Date.now() + Math.random(), title, tone }])
  }, [])
  return (
    <ToastContext.Provider value={{ show }}>
      <RadixToast.Provider swipeDirection="right" duration={6000} label={label}>
        {children}
        {toasts.map((t) => (
          <RadixToast.Root
            key={t.id}
            onOpenChange={(open) => !open && setToasts((all) => all.filter((x) => x.id !== t.id))}
            className={cn(
              'flex items-start gap-3 rounded-card border-l-4 bg-surface p-4 text-sm text-ink shadow-card',
              t.tone === 'success' && 'border-success',
              t.tone === 'info' && 'border-info',
              t.tone === 'danger' && 'border-danger',
            )}
          >
            <RadixToast.Title className="flex-1 font-medium">{t.title}</RadixToast.Title>
            <RadixToast.Close
              aria-label={closeLabel}
              className="rounded px-1 text-muted hover:text-ink"
            >
              ×
            </RadixToast.Close>
          </RadixToast.Root>
        ))}
        <RadixToast.Viewport className="fixed right-4 bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] z-50 grid w-[min(24rem,calc(100vw-2rem))] gap-2 outline-none" />
      </RadixToast.Provider>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}
