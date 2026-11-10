/**
 * A line of copy that can carry an inline link or a visible placeholder.
 *
 * Suzanne's 8 Nov copy documents leave [square bracket] placeholders for facts
 * only she, Shayna or Johan hold (formats, prices, lesson counts, policy
 * links). Those must stay VISIBLE on the page until filled, never be invented,
 * so the copy is stored as segments and the renderer draws placeholders in a
 * dashed box (components/shared/RichText.tsx). A plain string is one segment.
 */
export type RichSegment =
  | string
  | { link: string; href: string }
  | { placeholder: string; owner: PlaceholderOwner }

export type RichLine = string | RichSegment[]

/** Who fills a placeholder: listed in the hand-over report per owner. */
export type PlaceholderOwner = 'Suzanne' | 'Shayna' | 'Johan'

/** A placeholder segment, shorthand for the data files. */
export const ph = (placeholder: string, owner: PlaceholderOwner): RichSegment => ({
  placeholder,
  owner,
})

/** Every placeholder in a line, for the tests and the hand-over list. */
export function placeholdersIn(line: RichLine | undefined): { placeholder: string; owner: PlaceholderOwner }[] {
  if (!line || typeof line === 'string') return []
  return line.filter(
    (s): s is { placeholder: string; owner: PlaceholderOwner } =>
      typeof s === 'object' && 'placeholder' in s,
  )
}

/** The line as plain text (placeholders in brackets), for metadata and tests. */
export function richLineText(line: RichLine): string {
  if (typeof line === 'string') return line
  return line
    .map((s) => {
      if (typeof s === 'string') return s
      if ('link' in s) return s.link
      return `[${s.placeholder}]`
    })
    .join('')
}
