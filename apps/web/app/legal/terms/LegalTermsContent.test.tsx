import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import LegalTermsContent from './LegalTermsContent'
import { SESSION_TERMS, SESSION_TERMS_TITLE, sessionTermsMode } from '@/lib/legal/session-terms'

describe('Terms: the session rules section (D024)', () => {
  beforeEach(() => {
    // framer-motion's whileInView needs an observer jsdom lacks.
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    )
  })
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('is hidden by default', () => {
    render(<LegalTermsContent />)
    expect(screen.queryByText(SESSION_TERMS_TITLE)).not.toBeInTheDocument()
  })

  it('shows as a draft with a banner for review', () => {
    render(<LegalTermsContent sessionTerms="draft" />)
    expect(screen.getByRole('heading', { name: SESSION_TERMS_TITLE })).toBeInTheDocument()
    expect(screen.getByRole('note')).toHaveTextContent('Draft for approval')
  })

  it('shows every paragraph when live, without the banner', () => {
    render(<LegalTermsContent sessionTerms="live" />)
    for (const p of SESSION_TERMS) expect(screen.getByText(p.lead)).toBeInTheDocument()
    expect(screen.queryByRole('note')).not.toBeInTheDocument()
  })

  it('goes live only on SESSION_TERMS_LIVE=true; ?draft=sessions previews it', () => {
    expect(sessionTermsMode(undefined)).toBe('hidden')
    expect(sessionTermsMode('sessions')).toBe('draft')
    expect(sessionTermsMode('other')).toBe('hidden')
    vi.stubEnv('SESSION_TERMS_LIVE', 'true')
    expect(sessionTermsMode(undefined)).toBe('live')
  })

  it('uses no long dashes in the wording', () => {
    const text = [SESSION_TERMS_TITLE, ...SESSION_TERMS.map((p) => `${p.lead} ${p.text}`)].join(' ')
    expect(text).not.toMatch(/[–—]/)
  })
})
