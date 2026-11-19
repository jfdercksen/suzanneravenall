import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import UpgradeContent from './UpgradeContent'

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}>
      {children}
    </a>
  ),
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

const guest = {
  currentAccessLevel: 1,
  currentTrack: 'general' as const,
  currentSku: null,
  currentTierName: 'Guest Membership',
  fromLabel: null,
}

const shopLinks = () =>
  Array.from(document.querySelectorAll('a[href^="/shop/membership-"]')).map((a) => a.getAttribute('href'))

// KI071, reopened 17 Nov 2026 (Shayna's check): the 29 membership products are
// drafts, the store API does not return them, so "Upgrade Now" was a 404.
describe('UpgradeContent: Upgrade Now only for products the store returns', () => {
  it('shows "Opens at launch" and no shop link for every tier when none is on sale (drafts, or the read failed)', () => {
    render(<UpgradeContent {...guest} availableHandles={[]} />)
    expect(shopLinks()).toEqual([])
    expect(screen.queryAllByRole('link', { name: 'Upgrade Now' })).toHaveLength(0)
    // Every tier above Guest is an upgrade for a guest: S0212 to S0239, 28 in
    // all; the four Novice tiers read "Confirmed by the team" instead (KI114).
    expect(screen.getAllByText('Opens at launch')).toHaveLength(24)
    expect(screen.getAllByText('Confirmed by the team')).toHaveLength(4)
  })

  it('keeps Upgrade Now on an available tier and shows "Opens at launch" on a draft or missing one', () => {
    render(<UpgradeContent {...guest} availableHandles={['membership-s0212', 'membership-s0226']} />)
    expect(shopLinks().sort()).toEqual(['/shop/membership-s0212', '/shop/membership-s0226'])
    expect(screen.getAllByRole('link', { name: 'Upgrade Now' })).toHaveLength(2)
    expect(screen.getAllByText('Opens at launch')).toHaveLength(22)
  })

  // Switch-on (19 Nov 2026): every directly buyable tier published = every
  // card a real Upgrade Now, and still no way to buy a Novice level (KI114).
  it('links all 24 buyable tiers when they are all published, and never a Novice or Guest product', () => {
    const everyHandle = Array.from({ length: 29 }, (_, i) => `membership-s0${211 + i}`)
    render(<UpgradeContent {...guest} availableHandles={everyHandle} />)
    expect(screen.getAllByRole('link', { name: 'Upgrade Now' })).toHaveLength(24)
    expect(screen.queryAllByText('Opens at launch')).toHaveLength(0)
    expect(screen.getAllByText('Confirmed by the team')).toHaveLength(4)
    for (const novice of ['s0211', 's0214', 's0215', 's0227', 's0228']) {
      expect(shopLinks()).not.toContain(`/shop/membership-${novice}`)
    }
  })

  it('defaults to none available when the page passes nothing', () => {
    render(<UpgradeContent {...guest} />)
    expect(shopLinks()).toEqual([])
  })

  it('still marks the current plan, never as an upgrade', () => {
    render(
      <UpgradeContent
        {...guest}
        currentAccessLevel={2}
        currentSku="S0212"
        currentTierName="Lifestyle Membership"
        availableHandles={['membership-s0212']}
      />,
    )
    expect(screen.getByText('Current Plan')).toBeInTheDocument()
    expect(shopLinks()).toEqual([])
  })

  it('gives Guest no action at all, never "Confirmed by the team", when a member has no level yet', () => {
    render(<UpgradeContent {...guest} currentAccessLevel={0} availableHandles={['membership-s0211']} />)
    expect(screen.getAllByText('Confirmed by the team')).toHaveLength(4)
    expect(shopLinks()).not.toContain('/shop/membership-s0211')
  })
})
