'use client'

import { useEffect, useRef, useState } from 'react'

type Labels = { loading: string; failed: string; pages: string }

type TextPage = {
  streamTextContent: () => ReadableStream<{ items: ({ str: string } | object)[] }>
}

/**
 * A page's text for screen readers. Read with a plain stream reader: Safari cannot iterate
 * streams with `for await`, which pdf.js's getTextContent needs. Never fails the page.
 */
async function pageText(page: TextPage): Promise<string> {
  try {
    const reader = page.streamTextContent().getReader()
    const parts: string[] = []
    for (;;) {
      const { value, done } = await reader.read()
      if (done) break
      for (const item of value.items) if ('str' in item) parts.push(item.str)
    }
    return parts.join(' ')
  } catch {
    return ''
  }
}

/**
 * Shows a PDF inside the page with pdf.js (D-097): no browser viewer toolbar, so no download or
 * print button unless the editor allowed downloads (then the page also shows a download link).
 * Pages are drawn to canvases sized to the container; each page's text is kept in a visually
 * hidden block so screen readers can still read it. This deters casual saving; it cannot stop
 * screenshots or someone determined to copy the file.
 */
export function PdfViewer({
  src,
  title,
  labels,
  protect,
}: {
  src: string
  title: string
  labels: Labels
  /** Block the context menu and dragging (files without "Allow download"). */
  protect: boolean
}) {
  const box = useRef<HTMLDivElement>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'failed'>('loading')
  const [count, setCount] = useState(0)

  useEffect(() => {
    let cancelled = false
    let destroy: (() => void) | undefined
    const container = box.current
    if (!container) return

    void (async () => {
      try {
        const pdfjs = await import('pdfjs-dist')
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          'pdfjs-dist/build/pdf.worker.min.mjs',
          import.meta.url,
        ).toString()
        const task = pdfjs.getDocument({ url: src, withCredentials: true })
        destroy = () => void task.destroy()
        const doc = await task.promise
        if (cancelled) return
        setCount(doc.numPages)
        container.replaceChildren()
        const width = container.clientWidth || 600
        const ratio = Math.min(window.devicePixelRatio || 1, 2)
        for (let n = 1; n <= doc.numPages && !cancelled; n++) {
          const page = await doc.getPage(n)
          const base = page.getViewport({ scale: 1 })
          const viewport = page.getViewport({ scale: (width / base.width) * ratio })
          const canvas = document.createElement('canvas')
          canvas.width = Math.floor(viewport.width)
          canvas.height = Math.floor(viewport.height)
          canvas.style.width = '100%'
          canvas.style.height = 'auto'
          canvas.setAttribute('aria-hidden', 'true')
          canvas.className = 'block rounded-input border border-line bg-white'
          const wrap = document.createElement('div')
          wrap.className = 'grid gap-1'
          wrap.append(canvas)
          container.append(wrap)
          await page.render({ canvas, viewport }).promise
          const hidden = document.createElement('div')
          hidden.className = 'sr-only'
          hidden.textContent = await pageText(page)
          wrap.append(hidden)
        }
        if (!cancelled) setState('ready')
      } catch {
        if (!cancelled) setState('failed')
      }
    })()

    return () => {
      cancelled = true
      destroy?.()
    }
  }, [src])

  const block = protect ? (e: React.SyntheticEvent) => e.preventDefault() : undefined
  return (
    <div className="grid gap-2">
      <p className="text-sm text-muted" aria-live="polite">
        {state === 'loading'
          ? labels.loading
          : state === 'failed'
            ? labels.failed
            : labels.pages.replace('{count}', String(count))}
      </p>
      <div
        ref={box}
        role="document"
        aria-label={title}
        // Focusable so keyboard users can scroll the pages.
        tabIndex={0}
        onContextMenu={block}
        onDragStart={block}
        className="grid max-h-[80vh] gap-3 overflow-y-auto select-none"
      />
    </div>
  )
}
