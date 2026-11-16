/**
 * A Career & Certification Pathway of The Ravenall Institute, as Suzanne's
 * pathway documents of 12 Nov 2026 set it out (one per modality). Johan, 16 Nov:
 * use them as sent. The page is app/programs/certification/[modality].
 */

/** A list item; `sub` is its nested list, `after` a paragraph that closes it. */
export interface PathwayItem {
  text: string
  sub?: string[]
  after?: string[]
}

/** An intro line, or a line ending in ':' with the short list that follows it. */
export type PathwayIntroLine = string | { text: string; sub: string[] }

export interface PathwayPart {
  /** A to D on every level; E ("Continuing past ...") on Instructor. */
  key: 'A' | 'B' | 'C' | 'D' | 'E'
  heading: string
  items: PathwayItem[]
}

export interface PathwayLevel {
  level: number
  status: string
  /** e.g. "Graduation from Student to Novice Practitioner". */
  heading: string
  /** e.g. "Steps/Criteria to graduate from Student to Novice Practitioner". */
  stepsHeading: string
  intro: PathwayIntroLine[]
  parts: PathwayPart[]
}

export interface PathwayProgrammeTable {
  /** "Basic Series" or "Advanced Programmes". */
  title: string
  rows: { code: string; name: string; covers: string }[]
}

export interface PathwayGlanceRow {
  level: number
  status: string
  prerequisite: string
  sessions: string
  fee: string
}

export interface CertificationPathway {
  /** URL segment under /programs/certification/. */
  slug: string
  /** The modality name with its trademark, as the document writes it. */
  name: string
  tagline: string
  subtitle: string
  /** The document's own "NB: Certification requirements change ..." line. */
  nb: string
  about: string[]
  safePractice: string[]
  howItWorks: string[]
  programmesIntro: string[]
  programmeTables: PathwayProgrammeTable[]
  levelsSubtitle: string
  levelsAtAGlance: PathwayGlanceRow[]
  /** "A. High-level overview of the process steps to follow", B, C, D. */
  fourParts: string[]
  levels: PathwayLevel[]
  /** Appendix A, the Session Log template. Appendix B (draft consent form) is not published. */
  sessionLog: { subtitle: string; intro: string; columns: { column: string; record: string }[] }
}
