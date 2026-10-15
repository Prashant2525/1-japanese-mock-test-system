import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { Link } from '@/i18n/navigation'
import { isAppError } from '@/server/http/errors'
import { studyMaterialFor, type StudyMaterialView } from '@/server/study/service'
import { NoSave } from '@/ui/components/no-save'
import { PdfViewer } from '@/ui/components/pdf-viewer'
import { Reveal } from '@/ui/components/reveal'
import { RichText } from '@/ui/components/rich-text'
import { StationBadge } from '@/ui/components/station-badge'

import { studentPage } from '../../student-page'

type Props = { params: Promise<{ locale: string; slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale })
  return { title: t('student.nav.study'), robots: { index: false } }
}

/**
 * One study material: text with furigana, then its images, audio and PDFs (signed, private). Files
 * open in the app; download links appear only where the editor allowed them (D-097).
 */
export default async function StudyMaterialPage({ params }: Props) {
  const { locale, slug } = await params
  setRequestLocale(locale)
  const student = await studentPage(locale, 'study')
  const t = await getTranslations('student')
  let material: StudyMaterialView
  try {
    material = await studyMaterialFor(student, slug, locale === 'ja' ? 'ja' : 'en')
  } catch (err) {
    // Unpublished, archived, above the student's level or unknown: all look the same.
    if (isAppError(err) && err.code === 'NOT_FOUND') notFound()
    throw err
  }

  return (
    <article className="mx-auto grid max-w-3xl gap-6 px-4 py-12">
      <Link
        href="/app/study"
        className="justify-self-start text-sm font-bold text-muted underline underline-offset-4"
      >
        ← {t('study.back')}
      </Link>
      <Reveal>
        <p className="flex flex-wrap items-center gap-3 text-sm font-bold text-muted">
          <StationBadge
            level={material.level.code}
            color={material.level.badgeColor}
            className="text-base"
          />
          {material.category.symbol ? (
            <span aria-hidden="true">{material.category.symbol}</span>
          ) : null}
          {material.category.name}
        </p>
        <h1 className="mt-3 text-3xl font-black sm:text-4xl">{material.title}</h1>
        {material.summary ? <p className="mt-3 text-lg text-muted">{material.summary}</p> : null}
      </Reveal>

      <div className="rounded-card bg-surface p-6 shadow-card sm:p-8" lang={locale}>
        <RichText data={material.body as never} />
      </div>

      {material.attachments.length ? (
        <section aria-labelledby="files" className="grid gap-4">
          <h2 id="files" className="text-xl font-bold">
            {t('study.files')}
          </h2>
          {material.attachments.map((a, i) => {
            const name = a.title ?? a.caption ?? a.filename
            if (a.kind === 'image') {
              return (
                <figure key={i} className="grid gap-2 rounded-card bg-surface p-4 shadow-card">
                  <NoSave on={!a.allowDownload}>
                    {/* eslint-disable-next-line @next/next/no-img-element -- private signed file, not optimisable */}
                    <img
                      src={a.url}
                      alt={a.alt ?? ''}
                      className="h-auto max-w-full rounded-input"
                      loading="lazy"
                      draggable={a.allowDownload}
                    />
                  </NoSave>
                  {a.caption || a.title ? (
                    <figcaption className="text-sm text-muted">{a.caption ?? a.title}</figcaption>
                  ) : null}
                </figure>
              )
            }
            if (a.kind === 'audio') {
              return (
                <figure key={i} className="grid gap-2 rounded-card bg-surface p-4 shadow-card">
                  <figcaption className="flex flex-wrap items-center justify-between gap-2 font-bold">
                    <span>♪ {name}</span>
                    {a.allowDownload ? (
                      <a
                        href={a.url}
                        download={a.filename}
                        className="text-sm underline underline-offset-4"
                      >
                        {t('study.download')}
                      </a>
                    ) : null}
                  </figcaption>
                  <NoSave on={!a.allowDownload}>
                    <audio
                      controls
                      preload="metadata"
                      src={a.url}
                      className="w-full"
                      controlsList={a.allowDownload ? undefined : 'nodownload'}
                    >
                      {t('study.audioUnsupported')}
                    </audio>
                  </NoSave>
                </figure>
              )
            }
            return (
              <figure key={i} className="grid gap-3 rounded-card bg-surface p-4 shadow-card">
                <figcaption className="flex flex-wrap items-center justify-between gap-2 font-bold">
                  <span>▤ {name}</span>
                  {a.allowDownload ? (
                    <span className="flex gap-3 text-sm">
                      <a
                        href={a.url}
                        target="_blank"
                        rel="noopener"
                        className="underline underline-offset-4"
                      >
                        {t('study.openPdf')}
                      </a>
                      <a
                        href={a.url}
                        download={a.filename}
                        className="underline underline-offset-4"
                      >
                        {t('study.downloadPdf')}
                      </a>
                    </span>
                  ) : null}
                </figcaption>
                <PdfViewer
                  src={a.url}
                  title={t('study.pdfTitle', { name })}
                  protect={!a.allowDownload}
                  labels={{
                    loading: t('study.pdfLoading'),
                    failed: t('study.pdfFailed'),
                    pages: t.raw('study.pdfPages') as string,
                  }}
                />
              </figure>
            )
          })}
        </section>
      ) : null}
    </article>
  )
}
