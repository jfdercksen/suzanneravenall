import { describe, it, expect, vi } from 'vitest'
import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MarketingOptIn } from './MarketingOptIn'
import { NO_MARKETING, type MarketingChoice } from '@/lib/consent/marketing'

function Harness({ onChange, showPrivacyLink }: { onChange?: (c: MarketingChoice) => void; showPrivacyLink?: boolean }) {
  const [value, setValue] = useState<MarketingChoice>(NO_MARKETING)
  return (
    <MarketingOptIn
      idPrefix="t"
      value={value}
      showPrivacyLink={showPrivacyLink}
      onChange={(next) => {
        setValue(next)
        onChange?.(next)
      }}
    />
  )
}

describe('MarketingOptIn', () => {
  it('links the Privacy Notice and starts unticked, with no channels shown', () => {
    render(<Harness />)
    expect(screen.getByRole('link', { name: 'Privacy Notice' })).toHaveAttribute('href', '/legal/privacy')
    const box = screen.getByRole('checkbox', { name: /news, programmes and offers/ })
    expect(box).not.toBeChecked()
    expect(box).not.toBeRequired()
    expect(screen.queryByRole('checkbox', { name: 'Email' })).not.toBeInTheDocument()
  })

  it('shows email, WhatsApp and SMS once ticked, none chosen, and reports the picks', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<Harness onChange={onChange} />)
    await user.click(screen.getByRole('checkbox', { name: /news, programmes and offers/ }))
    for (const name of ['Email', 'WhatsApp', 'SMS']) {
      expect(screen.getByRole('checkbox', { name })).not.toBeChecked()
    }
    await user.click(screen.getByRole('checkbox', { name: 'SMS' }))
    await user.click(screen.getByRole('checkbox', { name: 'Email' }))
    expect(onChange).toHaveBeenLastCalledWith({ optIn: true, channels: ['email', 'sms'] })
  })

  it('drops the channels when the box is unticked again', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<Harness onChange={onChange} />)
    const box = screen.getByRole('checkbox', { name: /news, programmes and offers/ })
    await user.click(box)
    await user.click(screen.getByRole('checkbox', { name: 'WhatsApp' }))
    await user.click(box)
    expect(onChange).toHaveBeenLastCalledWith({ optIn: false, channels: [] })
    expect(screen.queryByRole('checkbox', { name: 'WhatsApp' })).not.toBeInTheDocument()
  })

  it('leaves the privacy link out where the form already has one', () => {
    render(<Harness showPrivacyLink={false} />)
    expect(screen.queryByRole('link', { name: 'Privacy Notice' })).not.toBeInTheDocument()
  })
})
