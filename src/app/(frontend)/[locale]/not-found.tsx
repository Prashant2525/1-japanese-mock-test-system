import { getTranslations } from 'next-intl/server'

import { Link } from '@/i18n/navigation'
import { Button } from '@/ui/components/button'
import { StationBadge } from '@/ui/components/station-badge'

export default async function NotFound() {
  const t = await getTranslations('notFound')
  return (
    <main id="main" className="mx-auto grid min-h-dvh max-w-xl content-center gap-5 px-4 py-16">
      <StationBadge level="404" />
      <h1 className="text-3xl font-black">{t('title')}</h1>
      <p className="text-muted">{t('body')}</p>
      <div>
        <Button asChild>
          <Link href="/">{t('home')}</Link>
        </Button>
      </div>
    </main>
  )
}
