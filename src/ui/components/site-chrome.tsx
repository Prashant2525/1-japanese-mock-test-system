import { getTranslations } from 'next-intl/server'
import { Suspense } from 'react'

import { Link } from '@/i18n/navigation'

import { AccountMenu } from './account-menu'
import { Button } from './button'
import { LanguageToggle } from './language-toggle'
import { Logo } from './logo'

export async function SkipLink() {
  const t = await getTranslations('a11y')
  return (
    <a
      href="#main"
      className="fixed top-2 left-2 z-50 -translate-y-20 rounded-card bg-night px-4 py-2 font-bold text-white transition-transform focus:translate-y-0"
    >
      {t('skipToContent')}
    </a>
  )
}

/** Day header (DESIGN_SYSTEM §7 navbar). Only links to pages that exist (no dead links). */
export async function SiteHeader({ signedIn }: { signedIn: boolean }) {
  const t = await getTranslations()
  return (
    <header className="relative z-30 border-b border-line bg-surface/90 backdrop-blur supports-[backdrop-filter]:bg-surface/75">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="rounded-card">
          <Logo variant="wordmark" tone="day" className="h-8 sm:h-10" alt={t('meta.siteName')} />
        </Link>
        <nav aria-label={t('a11y.mainNavigation')} className="flex items-center gap-2 sm:gap-3">
          <Suspense fallback={null}>
            <LanguageToggle />
          </Suspense>
          {signedIn ? (
            <AccountMenu
              myPageLabel={t('nav.myPage')}
              logoutLabel={t('nav.logout')}
              menuLabel={t('nav.menu')}
            />
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">{t('nav.login')}</Link>
              </Button>
              <Button asChild size="sm" className="hidden sm:inline-flex">
                <Link href="/signup">{t('nav.signup')}</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}

export async function SiteFooter() {
  const t = await getTranslations('footer')
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto grid max-w-6xl gap-2 px-4 py-6 text-sm text-muted">
        <p>{t('rights', { year: new Date().getFullYear() })}</p>
        <p>{t('notAffiliated')}</p>
      </div>
    </footer>
  )
}
