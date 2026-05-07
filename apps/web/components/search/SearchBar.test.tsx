import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SearchBar } from './SearchBar'
import type { SearchResultItem } from '@/lib/search/types'

// ---------------------------------------------------------------------------
// Mock next/navigation — SearchBar calls useRouter() and router.push()
// ---------------------------------------------------------------------------
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

// ---------------------------------------------------------------------------
// Mock next/link — render as plain <a> so href is inspectable
// ---------------------------------------------------------------------------
vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    onClick,
    className,
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} onClick={onClick} className={className}>
      {children}
    </a>
  ),
}))

// ---------------------------------------------------------------------------
// Mock next/image — render as plain <img>
// ---------------------------------------------------------------------------
vi.mock('next/image', () => ({
  default: ({
    src,
    alt,
    width,
    height,
    className,
  }: React.ImgHTMLAttributes<HTMLImageElement> & { src: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} width={width} height={height} className={className} />
  ),
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeResults(overrides: Partial<SearchResultItem>[] = []): SearchResultItem[] {
  return overrides.map((o, i) => ({
    type: 'products' as const,
    id: `item-${i}`,
    title: `Result ${i}`,
    subtitle: `Subtitle ${i}`,
    url: `/shop/item-${i}`,
    thumbnail: null,
    price_zar: 9900,
    ...o,
  }))
}

function mockFetchWith(results: SearchResultItem[]) {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ results }),
  })
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SearchBar — trigger button (closed state)', () => {
  it('renders the search trigger button and not the modal by default', () => {
    render(<SearchBar />)
    expect(screen.getByRole('button', { name: /open search/i })).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})

describe('SearchBar — opening the modal', () => {
  it('opens the modal when the trigger button is clicked', async () => {
    const user = userEvent.setup()
    render(<SearchBar />)
    await user.click(screen.getByRole('button', { name: /open search/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /open search/i })).not.toBeInTheDocument()
  })
})

describe('SearchBar — fetch on debounced input', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('calls /api/search with the typed query after the debounce delay', async () => {
    const mockFetch = mockFetchWith([])
    vi.stubGlobal('fetch', mockFetch)

    // userEvent with advanceTimers so clicks/inputs don't deadlock on fake timers
    const user = userEvent.setup({ advanceTimers: (ms) => vi.advanceTimersByTime(ms) })
    render(<SearchBar />)

    await user.click(screen.getByRole('button', { name: /open search/i }))

    const input = screen.getByPlaceholderText(/search programmes/i)

    // Type a character — no debounce fired yet
    await user.type(input, 'mindset')
    expect(mockFetch).not.toHaveBeenCalled()

    // Advance past the 300ms debounce
    await act(async () => {
      vi.advanceTimersByTime(400)
    })

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    const calledUrl = mockFetch.mock.calls[0][0] as string
    expect(calledUrl).toContain('/api/search')
    expect(calledUrl).toContain('q=mindset')
  }, 15000)

  it('does not call fetch when query is empty after debounce', async () => {
    const mockFetch = mockFetchWith([])
    vi.stubGlobal('fetch', mockFetch)

    const user = userEvent.setup({ advanceTimers: (ms) => vi.advanceTimersByTime(ms) })
    render(<SearchBar />)

    await user.click(screen.getByRole('button', { name: /open search/i }))

    // Do not type anything — query stays empty
    await act(async () => {
      vi.advanceTimersByTime(400)
    })

    expect(mockFetch).not.toHaveBeenCalled()
  }, 15000)
})

describe('SearchBar — empty results message', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('shows a "No results" message when the API returns an empty array', async () => {
    vi.stubGlobal('fetch', mockFetchWith([]))

    const user = userEvent.setup()
    render(<SearchBar />)
    await user.click(screen.getByRole('button', { name: /open search/i }))

    const input = screen.getByPlaceholderText(/search programmes/i)

    // Type, then wait for the debounced fetch + state update
    await user.type(input, 'zzzunknown')

    await waitFor(
      () => {
        expect(screen.getByText(/no results for/i)).toBeInTheDocument()
      },
      { timeout: 2000 }
    )
  })
})

describe('SearchBar — Escape key closes modal', () => {
  it('closes the modal when Escape is pressed', async () => {
    const user = userEvent.setup()
    render(<SearchBar />)
    await user.click(screen.getByRole('button', { name: /open search/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    fireEvent.keyDown(document, { key: 'Escape' })

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })
})

describe('SearchBar — keyboard navigation', () => {
  beforeEach(() => {
    mockPush.mockClear()
    vi.unstubAllGlobals()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('ArrowDown increments activeIndex and highlights the first result', async () => {
    const results = makeResults([
      { title: 'Alpha', url: '/shop/alpha' },
      { title: 'Beta', url: '/shop/beta' },
    ])
    vi.stubGlobal('fetch', mockFetchWith(results))

    const user = userEvent.setup()
    render(<SearchBar />)
    await user.click(screen.getByRole('button', { name: /open search/i }))

    const input = screen.getByPlaceholderText(/search programmes/i)
    await user.type(input, 'test')

    // Wait for results to appear
    await waitFor(
      () => {
        expect(screen.getByText('Alpha')).toBeInTheDocument()
      },
      { timeout: 2000 }
    )

    // First ArrowDown: activeIndex 0 → Alpha link should have bg-white/10 class
    fireEvent.keyDown(input, { key: 'ArrowDown' })

    await waitFor(() => {
      const links = screen.getAllByRole('link')
      const alphaLink = links.find((l) => l.textContent?.includes('Alpha'))
      expect(alphaLink?.className).toContain('bg-white/10')
    })
  })

  it('Enter key calls router.push with the active result URL', async () => {
    const results = makeResults([{ title: 'Clarity', url: '/shop/clarity' }])
    vi.stubGlobal('fetch', mockFetchWith(results))

    const user = userEvent.setup()
    render(<SearchBar />)
    await user.click(screen.getByRole('button', { name: /open search/i }))

    const input = screen.getByPlaceholderText(/search programmes/i)
    await user.type(input, 'clarity')

    await waitFor(
      () => {
        expect(screen.getByText('Clarity')).toBeInTheDocument()
      },
      { timeout: 2000 }
    )

    // Move down to select first result, then Enter navigates
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(mockPush).toHaveBeenCalledWith('/shop/clarity')
  })
})

describe('SearchBar — results display', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders result items when API returns data', async () => {
    const results = makeResults([
      { title: 'Mindset Mastery', url: '/shop/mindset', price_zar: 49900 },
    ])
    vi.stubGlobal('fetch', mockFetchWith(results))

    const user = userEvent.setup()
    render(<SearchBar />)
    await user.click(screen.getByRole('button', { name: /open search/i }))

    const input = screen.getByPlaceholderText(/search programmes/i)
    await user.type(input, 'mindset')

    await waitFor(
      () => {
        expect(screen.getByText('Mindset Mastery')).toBeInTheDocument()
      },
      { timeout: 2000 }
    )
  })

  it('displays a "Topic" badge for results with null price_zar', async () => {
    const results = makeResults([
      { type: 'explore_topics', title: 'Finding Purpose', price_zar: null },
    ])
    vi.stubGlobal('fetch', mockFetchWith(results))

    const user = userEvent.setup()
    render(<SearchBar />)
    await user.click(screen.getByRole('button', { name: /open search/i }))

    const input = screen.getByPlaceholderText(/search programmes/i)
    await user.type(input, 'purpose')

    await waitFor(
      () => {
        expect(screen.getByText('Topic')).toBeInTheDocument()
      },
      { timeout: 2000 }
    )
  })
})
