import { Fragment } from 'react'

import { parseRuby } from '@/shared/ruby'

/** Text with optional furigana: `{漢字|かんじ}` is shown with かんじ above 漢字 (D-024). */
export function RubyText({ text }: { text: string }) {
  return (
    <>
      {parseRuby(text).map((part, i) =>
        part.reading ? (
          <ruby key={i}>
            {part.text}
            <rp>(</rp>
            <rt>{part.reading}</rt>
            <rp>)</rp>
          </ruby>
        ) : (
          <Fragment key={i}>{part.text}</Fragment>
        ),
      )}
    </>
  )
}
