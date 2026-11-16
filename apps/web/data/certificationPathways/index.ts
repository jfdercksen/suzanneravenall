import type { ProgramSeries } from '@/data/programs'
import type { CertificationPathway } from './types'
import { AKASHIC_NAVIGATION_PATHWAY } from './akashicNavigation'
import { ENERGY_ALIGNMENT_PATHWAY } from './energyAlignmentOptimisation'
import { RAPID_REPATTERNING_PATHWAY } from './rapidRepatterning'

/** The three pathways, in the order the practitioner training section lists them. */
export const CERTIFICATION_PATHWAYS: CertificationPathway[] = [
  RAPID_REPATTERNING_PATHWAY,
  ENERGY_ALIGNMENT_PATHWAY,
  AKASHIC_NAVIGATION_PATHWAY,
]

export const MEMBER_SUPPORT_EMAIL = 'membersupport@ravenallinstitute.com'
export const CERTIFICATION_EMAIL = 'certification@ravenallinstitute.com'

export function pathwayHref(pathway: CertificationPathway): string {
  return `/programs/certification/${pathway.slug}`
}

export function getPathwayBySlug(slug: string): CertificationPathway | undefined {
  return CERTIFICATION_PATHWAYS.find((p) => p.slug === slug)
}

/** The pathway of a practitioner series (the series ids keep their old names, KI116). */
export function pathwayForSeries(series: ProgramSeries | undefined): CertificationPathway | undefined {
  if (series === 'energy-clearing') return ENERGY_ALIGNMENT_PATHWAY
  if (series === 'akashic-navigator') return AKASHIC_NAVIGATION_PATHWAY
  return undefined
}

/** Programme pages of a modality that is not a series: Rapid Repatterning. */
const PATHWAY_BY_PROGRAMME_SLUG: Record<string, CertificationPathway> = {
  'rapid-repatterning-introduction': RAPID_REPATTERNING_PATHWAY,
}

export function pathwayForProgramme(program: { slug: string; series?: ProgramSeries }): CertificationPathway | undefined {
  return pathwayForSeries(program.series) ?? PATHWAY_BY_PROGRAMME_SLUG[program.slug]
}

/** The modality name without its trademark, for "the ... pathway" in running text. */
export function pathwayPlainName(pathway: CertificationPathway): string {
  return pathway.name.replaceAll('™', '')
}
