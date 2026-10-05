import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import SpeakingContent, { SPEAKING_KIT_HREF } from './SpeakingContent'

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
  it('"Request the Speaking Kit" lands on the contact form with the speaking enquiry preselected', () => {
    expect(SPEAKING_KIT_HREF).toBe('/contact?enquiry=speaking&topic=Speaking+Kit#message')
    render(<SpeakingContent />)
    expect(screen.getByRole('link', { name: 'Request the Speaking Kit' })).toHaveAttribute('href', SPEAKING_KIT_HREF)
  })
})
