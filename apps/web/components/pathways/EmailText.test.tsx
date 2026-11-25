import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { EmailText } from './EmailText'

describe('EmailText', () => {
  it('leaves text without an address as it is', () => {
    const { container } = render(<p><EmailText text="Pay the observation fee." /></p>)
    expect(container.textContent).toBe('Pay the observation fee.')
    expect(container.querySelector('a')).toBeNull()
  })

  it('links the support address wherever it sits in the sentence', () => {
    const text = 'Membership and resubmissions: support@ravenallinstitute.com, or ask your instructor.'
    const { container } = render(<p><EmailText text={text} /></p>)
    expect(container.textContent).toBe(text)
    expect(Array.from(container.querySelectorAll('a')).map((a) => a.getAttribute('href'))).toEqual([
      'mailto:support@ravenallinstitute.com',
    ])
  })

  it('does not link other addresses', () => {
    const { container } = render(<p><EmailText text="Write to someone@example.com." /></p>)
    expect(container.querySelector('a')).toBeNull()
  })
})
