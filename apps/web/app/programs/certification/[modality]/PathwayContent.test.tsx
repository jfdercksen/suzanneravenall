import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import PathwayContent from './PathwayContent'
import { CERTIFICATION_PATHWAYS, getPathwayBySlug } from '@/data/certificationPathways'

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}>
      {children}
    </a>
  ),
}))

vi.mock('next/image', () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}))

vi.mock('framer-motion', () => {
  const strip = ({
    initial, animate, exit, transition, variants, whileInView, viewport, whileHover, whileTap,
    ...rest
  }: Record<string, unknown>) => rest
  const motion = new Proxy(
    {},
    {
      get: (_t, tag: string) =>
        ({ children, ...props }: { children?: React.ReactNode } & Record<string, unknown>) =>
          React.createElement(tag, strip(props), children),
    },
  )
  return { motion, AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</> }
})

const renderPathway = (slug: string) => render(<PathwayContent pathway={getPathwayBySlug(slug)!} image="/x.webp" />)

// Suzanne's pathway documents of 12 Nov 2026, used as sent (Johan, 16 Nov).
describe('Career & Certification Pathway pages', () => {
  it('has one page per modality, under /programs/certification', () => {
    expect(CERTIFICATION_PATHWAYS.map((p) => [p.slug, p.name])).toEqual([
      ['rapid-repatterning', 'Rapid Repatterning™'],
      ['energy-alignment-optimisation', 'Energy Alignment & Optimisation™'],
      ['akashic-navigation', 'Akashic Navigation™'],
    ])
  })

  for (const pathway of CERTIFICATION_PATHWAYS) {
    describe(pathway.slug, () => {
      it('shows every part of the document: about, safe practice, how it works, programmes, levels, each level A to D, the Session Log', () => {
        const { container } = renderPathway(pathway.slug)
        for (const h of ['About this pathway', 'How certification works', 'The programmes', 'The levels at a glance', 'Each level follows the same four parts', 'Session Log template']) {
          expect(screen.getByRole('heading', { name: h })).toBeInTheDocument()
        }
        expect(screen.getByRole('heading', { name: 'Safe practice' })).toBeInTheDocument()
        expect(container.textContent).toContain(pathway.nb)
        const glance = screen.getByRole('table', { name: 'The levels at a glance' })
        expect(within(glance).getAllByRole('row')).toHaveLength(pathway.levelsAtAGlance.length + 1)
        const log = screen.getByRole('table', { name: 'Session Log template' })
        expect(within(log).getAllByRole('row')).toHaveLength(pathway.sessionLog.columns.length + 1)
        for (const level of pathway.levels) {
          const details = container.querySelector(`#level-${level.level}`)
          expect(details?.tagName, level.status).toBe('DETAILS')
          for (const key of ['A', 'B', 'C', 'D']) {
            expect(details?.textContent, `${level.status} ${key}`).toContain(`${key}. `)
          }
        }
        for (const row of pathway.levelsAtAGlance) {
          expect(screen.getByRole('rowheader', { name: row.status })).toBeInTheDocument()
        }
      })

      it('publishes none of the editorial furniture', () => {
        const { container } = renderPathway(pathway.slug)
        const text = container.textContent ?? ''
        expect(text).not.toMatch(/DRAFT v1\.0|For review/)
        expect(text).not.toMatch(/[[\]]/)
        expect(text).not.toMatch(/working titles/)
        expect(text).not.toMatch(/Accreditation:|insert the external body|AADP/)
        expect(text).not.toMatch(/Appendix B|Recording & Consent Form\s*\(|attorney/)
        expect(text).not.toContain('\u2014')
        expect(text).not.toContain('shown in brackets')
        expect(text).toContain('All fees are shown in US dollars and are subject to change.')
      })

      it('shows the fees without brackets and both addresses as mailto links', () => {
        const { container } = renderPathway(pathway.slug)
        expect(container.textContent).toContain('USD 250')
        expect(container.textContent).toContain('USD 350 + Train the Trainer USD 500')
        const hrefs = Array.from(container.querySelectorAll('a')).map((a) => a.getAttribute('href'))
        expect(hrefs).toContain('mailto:membersupport@ravenallinstitute.com')
        expect(hrefs).toContain('mailto:certification@ravenallinstitute.com')
      })
    })
  }

  it('numbers part B so its "points 6 and 7 above" read true (Rapid Repatterning, Novice)', () => {
    const { container } = renderPathway('rapid-repatterning')
    const b = Array.from(container.querySelectorAll('#level-1 ol > li')).map((li) => li.firstChild?.textContent ?? '')
    expect(b[5]).toMatch(/^Complete eight \(8\) full self-sessions/)
    expect(b[6]).toBe('Complete all the repatternings from RP1 and RP2 on yourself.')
    expect(b[7]).toMatch(/fulfil points 6 and 7/)
  })

  it('keeps the Session Log sub-list and its closing line together under its item', () => {
    const { container } = renderPathway('akashic-navigation')
    const item = Array.from(container.querySelectorAll('#level-1 ol > li')).find((li) => li.textContent?.includes('called “Session Log”'))
    expect(item?.querySelectorAll('ul > li')).toHaveLength(3)
    expect(item?.textContent).toContain('A template is provided in Appendix A.')
  })

  it('states the Novice prerequisites as the documents do', () => {
    const glance = (slug: string) => getPathwayBySlug(slug)!.levelsAtAGlance[0]
    expect(glance('akashic-navigation')).toMatchObject({ status: 'Novice Navigator', prerequisite: 'AN1 + AN2' })
    expect(glance('energy-alignment-optimisation')).toMatchObject({ status: 'Novice Practitioner', prerequisite: 'EA1 + EA2' })
    expect(glance('rapid-repatterning')).toMatchObject({ status: 'Novice Practitioner', prerequisite: 'RP1 + RP2' })
  })

  it('opens the level a glance-table link points at, and one named in the address on load', () => {
    window.location.hash = '#level-3'
    const { container } = renderPathway('akashic-navigation')
    expect((container.querySelector('#level-3') as HTMLDetailsElement).open).toBe(true)
    const link = screen.getByRole('link', { name: 'Mentor' })
    expect(link).toHaveAttribute('href', '#level-5')
    link.click()
    expect((container.querySelector('#level-5') as HTMLDetailsElement).open).toBe(true)
    window.location.hash = ''
  })

  it('makes the scrollable tables keyboard reachable regions', () => {
    renderPathway('rapid-repatterning')
    for (const name of ['The levels at a glance', 'Session Log template']) {
      // The section is a region too; the scroll box is the one with tabindex.
      expect(screen.getAllByRole('region', { name }).filter((el) => el.getAttribute('tabindex') === '0')).toHaveLength(1)
    }
  })
})
