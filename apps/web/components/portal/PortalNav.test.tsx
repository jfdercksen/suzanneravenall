import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'

vi.mock('next/navigation', () => ({
  usePathname: () => '/portal/dashboard',
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}))

vi.mock('next/image', () => ({
  default: ({ alt }: { alt: string }) => <span data-alt={alt} />,
}))

import PortalNav from './PortalNav'

function phoneNav() {
  // Two navs share the label: the desktop sidebar's sits inside the <aside>.
  const navs = screen.getAllByRole('navigation', { name: 'Portal navigation' })
  const phone = navs.find((n) => !n.closest('aside'))
  if (!phone) throw new Error('no phone nav')
  return phone
}

describe('PortalNav', () => {
  it('puts Videos in the phone tab bar (KI076)', () => {
    render(<PortalNav tier="free" />)
    expect(within(phoneNav()).getByRole('link', { name: /Videos/ })).toHaveAttribute('href', '/portal/videos')
    expect(within(phoneNav()).getAllByRole('link')).toHaveLength(6)
  })

  it('keeps the phone tab bar above the cookie banner while it shows (KI077)', () => {
    render(<PortalNav tier="free" />)
    expect(phoneNav().className).toMatch(/bottom-\[var\(--cookie-banner-h,0px\)\]/)
  })

  it('hides the tier badge while memberships are off (KI072)', () => {
    const { container, rerender } = render(<PortalNav tier="free" showTier={false} />)
    expect(container.textContent).not.toMatch(/Free Member/)
    rerender(<PortalNav tier="free" showTier />)
    expect(container.textContent).toMatch(/Free Member/)
  })
})
