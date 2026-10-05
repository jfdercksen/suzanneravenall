import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SearchResultsContent } from './SearchResultsContent'
import type { SearchResultItem } from '@/lib/search/types'

vi.mock('next/link', () => ({
  default: ({ href, children, className }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}))

vi.mock('next/image', () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}))

function result(title: string, url: string): SearchResultItem {
  return { type: 'pages', id: url, title, subtitle: '', url, thumbnail: null, price_zar: null, label: 'Page' }
}

function mockSearchApi() {
  const mockFetch = vi.fn().mockImplementation(async (url: string) => {
    const q = new URL(url, 'http://localhost').searchParams.get('q')
    return {
      ok: true,
      json: async () => ({ results: q === 'calm' ? [result('Calm page', '/calm')] : [result('Other page', '/other')] }),
    }
  })
  vi.stubGlobal('fetch', mockFetch)
  return mockFetch
}

describe('SearchResultsContent - own search box (site check M16)', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    window.history.replaceState(null, '', '/')
  })

  it('shows a search box holding the current query', async () => {
    mockSearchApi()
    render(<SearchResultsContent initialQuery="anxiety" />)
    expect(screen.getByRole('searchbox', { name: /search the site/i })).toHaveValue('anxiety')
    await waitFor(() => expect(screen.getByText('Other page')).toBeInTheDocument())
  })

  it('updates the results and the address bar when a new search is submitted', async () => {
    const mockFetch = mockSearchApi()
    const user = userEvent.setup()
    render(<SearchResultsContent initialQuery="anxiety" />)
    await waitFor(() => expect(screen.getByText('Other page')).toBeInTheDocument())

    const box = screen.getByRole('searchbox', { name: /search the site/i })
    await user.clear(box)
    await user.type(box, 'calm{Enter}')

    await waitFor(() => expect(screen.getByText('Calm page')).toBeInTheDocument())
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Results for “calm”')
    expect(window.location.search).toBe('?q=calm')
    expect(mockFetch.mock.calls.some(([u]) => String(u).includes('q=calm'))).toBe(true)
  })

  it('offers a Pages tab', () => {
    mockSearchApi()
    render(<SearchResultsContent initialQuery="" />)
    expect(screen.getByRole('button', { name: 'Pages' })).toBeInTheDocument()
  })
})
