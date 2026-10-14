import '@/ui/styles/globals.css'

import type { Metadata, Viewport } from 'next'
import { hasLocale, NextIntlClientProvider } from 'next-intl'
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server'
import {
  Barlow_Condensed,
  IBM_Plex_Mono,
  Noto_Sans_JP,
  Zen_Kaku_Gothic_New,
} from 'next/font/google'
import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'

import { LOCALES, routing } from '@/i18n/routing'
import { SkipLink } from '@/ui/components/site-chrome'
import { ToastProvider } from '@/ui/components/toast'
import { cn } from '@/ui/lib/cn'

// Self-hosted at build time by next/font (no requests to Google from visitors' browsers).
const display = Zen_Kaku_Gothic_New({
  weight: ['700', '900'],
  subsets: ['latin'],
  display: 'swap',
  preload: false,
  variable: '--nm-font-display',
})
const sign = Barlow_Condensed({
  weight: ['600', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--nm-font-sign',
})
const body = Noto_Sans_JP({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
  preload: false,
  variable: '--nm-font-body',
})
const mono = IBM_Plex_Mono({
  weight: ['500'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--nm-font-mono',
})

type Props = { children: ReactNode; params: Promise<{ locale: string }> }

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'meta' })
  return {
    title: { default: `${t('siteName')} — ${t('tagline')}`, template: `%s · ${t('siteName')}` },
    description: t('description'),
    icons: { icon: '/brand/nihongo-mock-icon.svg' },
    alternates: { languages: { en: '/en', ja: '/ja' } },
  }
}

export const viewport: Viewport = {
  themeColor: '#0F2340',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()
  setRequestLocale(locale)
  const [messages, t] = await Promise.all([getMessages(), getTranslations('a11y')])
  return (
    <html
      lang={locale}
      className={cn(display.variable, sign.variable, body.variable, mono.variable)}
    >
      <body className="min-h-dvh antialiased">
        <NextIntlClientProvider messages={messages}>
          <ToastProvider label={t('notifications')} closeLabel={t('close')}>
            <SkipLink />
            {children}
          </ToastProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
