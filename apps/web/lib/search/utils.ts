import type { SearchResultItem } from './types'

/**
 * Strip all HTML tags from MeiliSearch highlight output except <mark> and </mark>.
 * MeiliSearch wraps matched terms in <mark> tags — we preserve only those.
 * This replaces DOMPurify for this narrow use case with no extra dependency.
 */
export function sanitizeHighlight(html: string): string {
  // Allow only exactly <mark> and </mark> (no attributes).
  // Everything else — including <script>, <img onerror=...>, etc. — is stripped.
  return html.replace(/<(?!\/?mark>)[^>]+>/gi, '')
}

/**
 * Shares `limit` slots between result groups one slot at a time, so each group
 * gets an even share and slots a group cannot fill go to the others.
 */
export function shareLimit<T>(groups: T[][], limit: number): T[][] {
  const counts = groups.map(() => 0)
  let used = 0
  let progress = true
  while (used < limit && progress) {
    progress = false
    for (let g = 0; g < groups.length && used < limit; g++) {
      if (counts[g]! < groups[g]!.length) {
        counts[g] = counts[g]! + 1
        used++
        progress = true
      }
    }
  }
  return groups.map((group, g) => group.slice(0, counts[g]))
}

const TYPE_BADGES: Record<SearchResultItem['type'], string> = {
  products: 'Programme',
  explore_topics: 'Topic',
  pages: 'Page',
}

/** Badge shown on a result that has no price. */
export function resultBadge(item: Pick<SearchResultItem, 'type' | 'label'>): string {
  return item.label ?? TYPE_BADGES[item.type]
}
