/**
 * Media & press appearances — single source of truth for
 * /resources/media (MediaContent.tsx) and ArticlesContent.tsx.
 *
 * KI025: every one of these articles used to link to the OLD WordPress
 * site (suzanneravenall.com/article-<slug>/). After DNS cutover those
 * URLs become self-referential and next.config.mjs's `/article-:slug*`
 * -> `/blog` redirect bounces visitors to the blog instead of the
 * article. The original URL is preserved in `legacyHref` (never
 * rendered) so restoring or repointing is a one-line change per entry.
 *
 * Sourced 6 Oct 2026 (docs/testing/results/content-sourcing-2026-10-06.md,
 * section 3): every old article URL 301-redirects to a PDF scan hosted on
 * ravenallinstitute.com, a separate domain that survives the cutover, so
 * each entry now links that PDF. Titles are taken from the PDF / article
 * slugs. The earlier dates (WordPress upload dates, not publication dates)
 * and descriptions (written by us, not from the articles) were removed:
 * the scans are images, so any standfirst must be read off them by eye.
 *
 * Status meanings:
 * - 'external'                the entry has a live `href` on a genuine
 *                             third-party domain that survives cutover
 * - 'needs-content-decision'  no safe destination exists yet. Johan /
 *                             Suzanne must decide per entry: host the
 *                             article natively, link a web.archive.org
 *                             snapshot, or drop it. Until then the card
 *                             renders WITHOUT a link (no dead anchors).
 */

export type MediaArticleStatus = 'external' | 'needs-content-decision'

export interface MediaArticle {
  outlet: string
  type: 'Article' | 'Cover Story' | 'Press Release'
  title: string
  /**
   * Publication date, only when read off the source itself. The old site's
   * dates were WordPress upload dates, so none are set today.
   */
  date?: string
  /** Standfirst, only when sourced from the article. None are set today. */
  description?: string
  /**
   * Live URL rendered as the card's link. Only set when the destination
   * survives DNS cutover (third-party domain or new-platform route).
   * Entries without an href render as unlinked citation cards.
   */
  href?: string
  /** Original old-WordPress URL. Reference only, never rendered. */
  legacyHref: string
  status: MediaArticleStatus
  /** Shown on /resources/media (the original six-card grid). */
  featured: boolean
}

// PDF scans of the print articles, hosted on ravenallinstitute.com.
// Source: https://ravenallinstitute.com/articles/ (each old
// suzanneravenall.com/article-<slug>/ URL redirects to the PDF below).
const PDF_BASE = 'https://ravenallinstitute.com/wp-content/uploads/2021/12'

export const MEDIA_ARTICLES: MediaArticle[] = [
  {
    outlet: 'Leadership Magazine',
    type: 'Article',
    title: 'Leadership Magazine Feature',
    href: `${PDF_BASE}/2021-Article-Leadership-Magazine.pdf`,
    legacyHref: 'https://suzanneravenall.com/article-leadership-magazine/',
    status: 'external',
    featured: true,
  },
  {
    outlet: 'CEO Magazine',
    type: 'Cover Story',
    title: 'Fast and Furious',
    href: `${PDF_BASE}/Article-CEO-Magazine-Cover-story-fast-and-furious.pdf`,
    legacyHref:
      'https://suzanneravenall.com/article-ceo-magazine-cover-story-fast-and-furious/',
    status: 'external',
    featured: true,
  },
  {
    outlet: 'CEO Magazine',
    type: 'Cover Story',
    title: 'Execution Excellence',
    href: `${PDF_BASE}/Article-CEO-Magazine-Cover-Story-Execution-Excellence.pdf`,
    legacyHref:
      'https://suzanneravenall.com/article-ceo-magazine-cover-story-execution-excellence/',
    status: 'external',
    featured: true,
  },
  {
    outlet: 'CEO Magazine',
    type: 'Cover Story',
    title: 'Power of Positivity',
    // NB: "Magzaine" / "magzaine" typos are faithful to the real file and slug.
    href: `${PDF_BASE}/Article-CEO-Magzaine-Cover-Story-Power-of-Positivity.pdf`,
    legacyHref:
      'https://suzanneravenall.com/article-ceo-magzaine-cover-story-power-of-positivity/',
    status: 'external',
    featured: true,
  },
  {
    outlet: 'CEO Magazine',
    type: 'Article',
    title: 'B2B Outsourcing',
    href: `${PDF_BASE}/Article-CEO-Magazine-B2B-Outsourcing.pdf`,
    legacyHref: 'https://suzanneravenall.com/article-ceo-magazine-b2b-outsourcing/',
    status: 'external',
    featured: true,
  },
  {
    outlet: 'Business Excellence Awards',
    type: 'Press Release',
    title: 'Business Excellence Awards Press Release',
    href: `${PDF_BASE}/2021-Article-Business-Excellence-Awards-Press-Release.pdf`,
    legacyHref:
      'https://suzanneravenall.com/article-business-excellence-awards-press-release/',
    status: 'external',
    featured: true,
  },
  {
    outlet: 'CEO Magazine',
    type: 'Article',
    title: 'Be Effective or Be at Risk',
    href: `${PDF_BASE}/Article-CEO-Magazine-Be-Effective-or-Be-At-Risk.pdf`,
    legacyHref:
      'https://suzanneravenall.com/article-ceo-magazine-be-effective-or-be-at-risk/',
    status: 'external',
    featured: false,
  },
  {
    outlet: 'CEO Magazine',
    type: 'Article',
    title: 'Transformation',
    href: `${PDF_BASE}/Article-CEO-Magazine-Transformation.pdf`,
    legacyHref: 'https://suzanneravenall.com/article-ceo-magazine-transformation/',
    status: 'external',
    featured: false,
  },
  {
    outlet: 'CEO Magazine',
    type: 'Article',
    title: 'Creating the Future',
    href: `${PDF_BASE}/Article-CEO-Magazine-Creating-the-future.pdf`,
    legacyHref:
      'https://suzanneravenall.com/article-ceo-magazine-creating-the-future/',
    status: 'external',
    featured: false,
  },
  {
    outlet: 'CEO Magazine',
    type: 'Article',
    title: 'New Trends in the Labour Market',
    href: `${PDF_BASE}/Article-CEO-Magazine-New-Trend-Labour-market.pdf`,
    legacyHref:
      'https://suzanneravenall.com/article-ceo-magazine-new-trend-labour-market/',
    status: 'external',
    featured: false,
  },
]

/** The six cards shown on /resources/media. */
export const FEATURED_MEDIA_ARTICLES = MEDIA_ARTICLES.filter((a) => a.featured)
