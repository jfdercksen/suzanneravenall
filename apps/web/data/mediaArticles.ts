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
  /** Publication date as shown on the old site, where known. */
  date?: string
  description: string
  /**
   * Live URL rendered as the card's link. Only set when the destination
   * survives DNS cutover (third-party domain or new-platform route).
   * Entries without an href render as unlinked citation cards.
   */
  href?: string
  /** Original old-WordPress URL. Reference only — never rendered. */
  legacyHref: string
  status: MediaArticleStatus
  /** Shown on /resources/media (the original six-card grid). */
  featured: boolean
}

export const MEDIA_ARTICLES: MediaArticle[] = [
  {
    outlet: 'Leadership Magazine',
    type: 'Article',
    title: 'Leadership Magazine Feature',
    date: 'December 2021',
    description:
      'Dr. Suzanne Ravenall featured in Leadership Magazine, sharing insights on transformational leadership and the science of human potential.',
    legacyHref: 'https://suzanneravenall.com/article-leadership-magazine/',
    status: 'needs-content-decision',
    featured: true,
  },
  {
    outlet: 'CEO Magazine',
    type: 'Cover Story',
    title: 'Fast and Furious: Leading at Speed',
    date: 'November 2021',
    description:
      "A CEO Magazine cover story exploring how high-performing leaders drive transformation at pace. Dr. Ravenall's strategies for sustainable execution.",
    legacyHref:
      'https://suzanneravenall.com/article-ceo-magazine-cover-story-fast-and-furious/',
    status: 'needs-content-decision',
    featured: true,
  },
  {
    outlet: 'CEO Magazine',
    type: 'Cover Story',
    title: 'Execution Excellence',
    date: 'November 2021',
    description:
      'The gap between strategic intention and actual execution, and the mindset shifts that close it. A CEO Magazine cover story.',
    legacyHref:
      'https://suzanneravenall.com/article-ceo-magazine-cover-story-execution-excellence/',
    status: 'needs-content-decision',
    featured: true,
  },
  {
    outlet: 'CEO Magazine',
    type: 'Cover Story',
    title: 'The Power of Positivity',
    date: 'November 2021',
    description:
      'Dr. Ravenall on how positivity is not naive optimism but a disciplined neurological practice that reshapes outcomes in business and life.',
    // NB: "magzaine" typo is faithful to the real old-site slug.
    legacyHref:
      'https://suzanneravenall.com/article-ceo-magzaine-cover-story-power-of-positivity/',
    status: 'needs-content-decision',
    featured: true,
  },
  {
    outlet: 'CEO Magazine',
    type: 'Article',
    title: 'B2B Outsourcing: A Human Lens',
    date: 'November 2021',
    description:
      'Applying a human-centred lens to B2B outsourcing decisions: how people patterns determine whether partnerships succeed or fail.',
    legacyHref: 'https://suzanneravenall.com/article-ceo-magazine-b2b-outsourcing/',
    status: 'needs-content-decision',
    featured: true,
  },
  {
    outlet: 'Business Excellence Awards',
    type: 'Press Release',
    title: 'Ravenall Institute: Business Excellence Award',
    date: 'December 2021',
    description:
      'Official press release recognising the Ravenall Institute for outstanding contribution to coaching, human development and business excellence.',
    legacyHref:
      'https://suzanneravenall.com/article-business-excellence-awards-press-release/',
    status: 'needs-content-decision',
    featured: true,
  },
  {
    outlet: 'CEO Magazine',
    type: 'Article',
    title: 'Be Effective or Be at Risk',
    date: 'November 2021',
    description:
      'In a rapidly changing world, effectiveness is no longer optional. Dr. Ravenall on how organisations can develop human effectiveness as a strategic capability rather than an afterthought.',
    legacyHref:
      'https://suzanneravenall.com/article-ceo-magazine-be-effective-or-be-at-risk/',
    status: 'needs-content-decision',
    featured: false,
  },
  {
    outlet: 'CEO Magazine',
    type: 'Article',
    title: 'Transformation: What It Really Takes',
    date: 'November 2021',
    description:
      'True transformation is a shift in being, not just behaviour. Dr. Ravenall distinguishes between surface-level change and the deep, lasting metamorphosis that rewires how people operate in the world.',
    legacyHref: 'https://suzanneravenall.com/article-ceo-magazine-transformation/',
    status: 'needs-content-decision',
    featured: false,
  },
  {
    outlet: 'CEO Magazine',
    type: 'Article',
    title: 'Creating the Future',
    date: 'November 2021',
    description:
      'You do not stumble into a great future. You design it from the inside out. Dr. Ravenall on intentional creation, purpose alignment and the role of consciousness in building what comes next.',
    legacyHref:
      'https://suzanneravenall.com/article-ceo-magazine-creating-the-future/',
    status: 'needs-content-decision',
    featured: false,
  },
  {
    outlet: 'CEO Magazine',
    type: 'Article',
    title: 'New Trends in the Labour Market',
    date: 'November 2021',
    description:
      'The labour market is shifting fundamentally. Dr. Ravenall analyses what employees now want, and why organisations that ignore human needs will struggle to attract and retain top talent.',
    legacyHref:
      'https://suzanneravenall.com/article-ceo-magazine-new-trend-labour-market/',
    status: 'needs-content-decision',
    featured: false,
  },
]

/** The six cards shown on /resources/media. */
export const FEATURED_MEDIA_ARTICLES = MEDIA_ARTICLES.filter((a) => a.featured)
