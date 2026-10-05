import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup, waitFor } from '@testing-library/react'
import AuthOverlay from './AuthOverlay'

afterEach(() => {
  cleanup()
  document.body.querySelectorAll('[data-test-chrome]').forEach((el) => el.remove())
})

function addChrome(tag: string, label: string): HTMLElement {
  const el = document.createElement(tag)
  el.setAttribute('data-test-chrome', label)
  el.innerHTML = `<a href="/x">${label}</a>`
  document.body.appendChild(el)
  return el
}

describe('AuthOverlay (site check M6)', () => {
  it('makes the covered site chrome inert while mounted, and only that', () => {
    const header = addChrome('header', 'header')
    const footer = addChrome('footer', 'footer')
    const { getByText, unmount } = render(
      <AuthOverlay>
        <a href="/portal/signup">Sign up</a>
      </AuthOverlay>,
    )

    expect(header).toHaveAttribute('inert')
    expect(footer).toHaveAttribute('inert')
    expect(getByText('Sign up').closest('[inert]')).toBeNull()

    unmount()
    expect(header).not.toHaveAttribute('inert')
    expect(footer).not.toHaveAttribute('inert')
  })

  it('catches chrome that mounts after it, such as the cookie banner', async () => {
    render(<AuthOverlay>form</AuthOverlay>)
    const banner = addChrome('div', 'cookie banner')
    await waitFor(() => expect(banner).toHaveAttribute('inert'))
  })

  it('leaves an element that was already inert alone on unmount', () => {
    const modal = addChrome('div', 'already inert')
    modal.setAttribute('inert', '')
    const { unmount } = render(<AuthOverlay>form</AuthOverlay>)
    unmount()
    expect(modal).toHaveAttribute('inert')
  })
})
