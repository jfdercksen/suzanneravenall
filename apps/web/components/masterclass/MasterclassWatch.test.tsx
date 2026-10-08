import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import MasterclassWatch from './MasterclassWatch'
import { MASTERCLASS_VIDEO_URL } from '@/lib/masterclass'

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}>{children}</a>
  ),
}))

describe('MasterclassWatch (viewing page, as /masterclass-viewing/ on the current site)', () => {
  it('plays the masterclass recording', () => {
    const { container } = render(<MasterclassWatch />)
    expect(container.querySelector('video')).toHaveAttribute('src', MASTERCLASS_VIDEO_URL)
  })

  it('reveals the next step only once the video has ended', () => {
    const { container } = render(<MasterclassWatch />)
    expect(screen.queryByText('Thank you for watching')).not.toBeInTheDocument()
    fireEvent.ended(container.querySelector('video')!)
    expect(screen.getByText('Thank you for watching')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /View the programme/ })).toHaveAttribute('href', '/programs/trauma-to-transcendence')
  })
})
