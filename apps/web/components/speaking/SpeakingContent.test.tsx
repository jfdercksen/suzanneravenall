import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import SpeakingContent, { SPEAKING_EVENTS, SPEAKING_DISCUSSION_HREF } from './SpeakingContent'

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
  it('lists the events Suzanne has spoken at instead of placeholder logos', () => {
    render(<SpeakingContent />)
    const list = screen.getByRole('list', { name: 'Events Suzanne has spoken at' })
    for (const event of SPEAKING_EVENTS) expect(list).toHaveTextContent(event)
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
})
