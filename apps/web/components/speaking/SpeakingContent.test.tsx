import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import SpeakingContent, {
  SPEAKING_EVENT_GROUPS,
  SPEAKING_DISCUSSION_HREF,
  SPEAKER_PACK_HREF,
  WHY_BOOK,
} from './SpeakingContent'

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}>{children}</a>
  ),
}))

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}))

// Render motion.* as plain elements without animation props.
vi.mock('framer-motion', () => {
  const cache = new Map<string, React.FC<Record<string, unknown>>>()
  const factory = (tag: string) => {
    if (!cache.has(tag)) {
      cache.set(tag, function MotionStub({
        children,
        initial,
        animate,
        exit,
        transition,
        whileInView,
        whileHover,
        viewport,
        variants,
        ...props
      }: Record<string, unknown>) {
        return React.createElement(tag, props, children as React.ReactNode)
      })
    }
    return cache.get(tag)
  }
  return {
    motion: new Proxy({}, { get: (_t, tag: string) => factory(tag) }),
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useInView: () => true,
    useReducedMotion: () => false,
  }
})

describe('SpeakingContent', () => {
  // Shayna, 7 Oct: both buttons went to the contact page. The current site
  // pairs "Get in contact" with "Book a discussion" on Acuity.
  it('pairs the contact button with "Book a Discussion" on the Acuity scheduler', () => {
    render(<SpeakingContent />)
    const book = screen.getByRole('link', { name: 'Book a Discussion' })
    expect(book).toHaveAttribute('href', SPEAKING_DISCUSSION_HREF)
    expect(SPEAKING_DISCUSSION_HREF).toContain('appointmentType=24190547')
    expect(book).toHaveAttribute('target', '_blank')
    expect(screen.queryByRole('link', { name: 'Request the Speaking Kit' })).not.toBeInTheDocument()
  })

  // Decision 11 (content sourcing, 6 Oct): events list replaces the logo
  // strip; testimonials and the keynote reel stay hidden until Suzanne
  // sends real material.
  // Suzanne, 8 Nov 2026: her three lists replace the flat events list.
  it('lists where Suzanne has spoken in her three groups instead of placeholder logos', () => {
    render(<SpeakingContent />)
    expect(SPEAKING_EVENT_GROUPS.map((g) => g.heading)).toEqual([
      'Global stages',
      'Leadership & business',
      'Women in leadership',
    ])
    for (const group of SPEAKING_EVENT_GROUPS) {
      const list = screen.getByRole('list', { name: group.heading })
      for (const event of group.events) expect(list).toHaveTextContent(event)
    }
    expect(screen.queryByText(/to be provided by Suzanne/)).not.toBeInTheDocument()
    expect(screen.queryByText('Trusted by')).not.toBeInTheDocument()
  })

  it('hides the speaker testimonials and keynote reel until real material exists', () => {
    render(<SpeakingContent />)
    expect(screen.queryByText('What audiences say')).not.toBeInTheDocument()
    expect(screen.queryByText(/coming\s+soon/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Play keynote preview' })).not.toBeInTheDocument()
    expect(screen.queryByText(/Watch a Preview/)).not.toBeInTheDocument()
  })

  it('opens with her "Audiences leave changed" copy and the three numbered points', () => {
    render(<SpeakingContent />)
    expect(screen.getByRole('heading', { level: 2, name: 'Audiences leave changed' })).toBeInTheDocument()
    for (const point of ['The shift happens in the room', 'Tools they use the next day', 'Insight that lasts']) {
      expect(screen.getByRole('heading', { level: 3, name: point })).toBeInTheDocument()
    }
  })

  it('gives organisers her four reasons and her two buttons', () => {
    render(<SpeakingContent />)
    expect(screen.getByRole('heading', { level: 2, name: 'Why event organisers book Suzanne' })).toBeInTheDocument()
    for (const reason of WHY_BOOK) expect(screen.getByText(reason)).toBeInTheDocument()
    const pack = screen.getByRole('link', { name: 'Download Speaker Pack' })
    // No pack file yet: the button asks for it through the contact form
    expect(pack).toHaveAttribute('href', SPEAKER_PACK_HREF)
    expect(SPEAKER_PACK_HREF).toMatch(/^\/contact\?enquiry=speaking&topic=.*speaker\+pack#message$/i)
    expect(screen.getAllByRole('link', { name: 'Book Suzanne to Speak' }).length).toBeGreaterThan(0)
  })
})
