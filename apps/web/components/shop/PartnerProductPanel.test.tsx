import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { partnerProductFor } from '@/data/partnerProducts'
import { PartnerProductPanel } from './PartnerProductPanel'

describe('PartnerProductPanel (Suzanne 12 Nov)', () => {
  it('marks the product as a partner product and links out in a new tab as a sponsored link', () => {
    render(<PartnerProductPanel partner={partnerProductFor('brainwave-club')!} />)
    const panel = screen.getByTestId('partner-product-panel')
    expect(within(panel).getByText('Partner product')).toBeInTheDocument()
    const link = within(panel).getByRole('link', { name: /Read More/ })
    expect(link).toHaveAttribute('href', 'https://jv.brainwave.club/27-jv001-welcome-to-brainwave-club?hop=srav7700')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'sponsored noopener')
    expect(link.textContent).toMatch(/opens the Brainwave Club site in a new tab/)
    expect(panel.textContent).toMatch(/not in\s+this shop/)
    expect(within(panel).queryByRole('button')).toBeNull()
  })
})
