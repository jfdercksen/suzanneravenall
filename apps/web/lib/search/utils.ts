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
