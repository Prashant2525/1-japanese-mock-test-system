import {
  type JSXConvertersFunction,
  RichText as PayloadRichText,
} from '@payloadcms/richtext-lexical/react'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import type { ReactNode } from 'react'

import { RubyText } from './ruby-text'

/** Lexical text format bits (same values Payload uses). */
const BOLD = 1
const ITALIC = 1 << 1
const STRIKETHROUGH = 1 << 2
const UNDERLINE = 1 << 3

/**
 * CMS rich text for students. Payload's renderer, with text nodes rendered through RubyText so the
 * `{漢字|かんじ}` furigana markup works inside study materials too (D-024).
 */
const converters: JSXConvertersFunction = ({ defaultConverters }) => ({
  ...defaultConverters,
  text: ({ node }) => {
    let out: ReactNode = <RubyText text={node.text} />
    if (node.format & BOLD) out = <strong>{out}</strong>
    if (node.format & ITALIC) out = <em>{out}</em>
    if (node.format & STRIKETHROUGH) out = <s>{out}</s>
    if (node.format & UNDERLINE) out = <u>{out}</u>
    return out
  },
})

export function RichText({ data }: { data: SerializedEditorState | null | undefined }) {
  if (!data) return null
  return (
    <PayloadRichText
      data={data}
      converters={converters}
      className="nm-prose grid gap-4 text-lg leading-relaxed [&_h2]:text-2xl [&_h2]:font-bold [&_h3]:text-xl [&_h3]:font-bold [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:pl-6 [&_a]:font-bold [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-line [&_blockquote]:pl-4"
    />
  )
}
