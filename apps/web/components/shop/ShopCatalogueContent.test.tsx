import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { MedusaProduct } from '@/types/medusa'

let mockSearch = ''
vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(mockSearch),
}))

vi.mock('framer-motion', () => {
  const strip = ({
    initial, animate, exit, transition, variants, whileInView, viewport, whileHover, whileTap, ...rest
  }: Record<string, unknown>) => rest
  const el = (Tag: string) =>
    function MotionEl(props: Record<string, unknown>) {
      return React.createElement(Tag, strip(props))
    }
  return {
    motion: { div: el('div'), p: el('p') },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  }
})

vi.mock('./ShopHeroBanner', () => ({ ShopHeroBanner: () => null }))
vi.mock('./ShopFinalCTA', () => ({ ShopFinalCTA: () => null }))
vi.mock('./ProductCard', () => ({
  ProductCard: ({ product }: { product: MedusaProduct }) => (
    <a href={`/shop/${product.handle}`} data-testid="card">
      {product.title}
    </a>
  ),
}))

import { ShopCatalogueContent } from './ShopCatalogueContent'

const categories = [
  { id: 'cat-private', handle: 'private-sessions', name: 'Private Sessions', parent_category_id: null },
  { id: 'cat-rapid', handle: 'rapid-repatterning', name: 'Rapid Repatterning', parent_category_id: 'cat-private' },
  { id: 'cat-tools', handle: 'products-tools', name: 'Products & Tools', parent_category_id: null },
  { id: 'cat-books', handle: 'books', name: 'Books', parent_category_id: 'cat-tools' },
]

function product(id: string, zar: number, categoryId: string): MedusaProduct {
  return {
    id,
    handle: `${id}-handle`,
    title: `Product ${id}`,
    description: null,
    thumbnail: null,
    metadata: null,
    variants: [{ id: `${id}-v`, title: 'Default', prices: [{ currency_code: 'zar', amount: zar }] }],
    categories: [{ id: categoryId, handle: categoryId, name: categoryId, parent_category_id: null }],
    collection: null,
  }
}

// 14 private-session products (two pages) and 2 books.
const privateProducts = Array.from({ length: 14 }, (_, i) => product(`p${i}`, 100000 + i * 1000, 'cat-rapid'))
const bookProducts = [product('b0', 16500, 'cat-books'), product('b1', 30000, 'cat-books')]
const allProducts = [...privateProducts, ...bookProducts]

let searchHits: string[] = []

function installFetch() {
  const fetchMock = vi.fn(async (input: string) => {
    const url = new URL(input, 'http://localhost')
    if (url.pathname.endsWith('/store/collections')) {
      return { ok: true, json: async () => ({ collections: [{ id: 'col-prog', handle: 'programmes' }] }) }
    }
    if (url.pathname.endsWith('/store/products')) {
      const cats = url.searchParams.getAll('category_id[]')
      const list = cats.length
        ? allProducts.filter((p) => p.categories.some((c) => cats.includes(c.id)))
        : allProducts
      const offset = Number(url.searchParams.get('offset') ?? 0)
      const limit = Number(url.searchParams.get('limit') ?? 50)
      return { ok: true, json: async () => ({ products: list.slice(offset, offset + limit), count: list.length }) }
    }
    if (url.pathname === '/api/search') {
      return {
        ok: true,
        json: async () => ({
          results: searchHits.map((id) => ({
            type: 'products', id, title: `<mark>x</mark>`, subtitle: '', url: `/shop/${id}-handle`, thumbnail: null, price_zar: 1,
          })),
        }),
      }
    }
    return { ok: false, json: async () => ({}) }
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

beforeEach(() => {
  mockSearch = ''
  searchHits = []
  window.history.replaceState(null, '', '/shop')
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  )
  Element.prototype.scrollIntoView = vi.fn()
  installFetch()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

const cards = () => screen.queryAllByTestId('card').map((a) => a.getAttribute('href'))

describe('ShopCatalogueContent', () => {
  it('opens filtered from ?category=<handle>, including sub-categories, and highlights the parent pill', async () => {
    mockSearch = 'category=products-tools'
    render(<ShopCatalogueContent initialCategories={categories} />)
    await waitFor(() => expect(cards()).toHaveLength(2))
    expect(cards()).toEqual(['/shop/b0-handle', '/shop/b1-handle'])
    expect(screen.getByRole('button', { name: 'Products & Tools' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('a sub-category link (breadcrumb) highlights its top-level pill', async () => {
    mockSearch = 'category=books'
    render(<ShopCatalogueContent initialCategories={categories} />)
    await waitFor(() => expect(cards()).toHaveLength(2))
    expect(screen.getByRole('button', { name: 'Products & Tools' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('sorts the whole catalogue by price, not just the current page', async () => {
    mockSearch = 'sort=price_asc'
    render(<ShopCatalogueContent initialCategories={categories} />)
    await waitFor(() => expect(cards()).toHaveLength(12))
    // The two books are the cheapest even though the store lists them last.
    expect(cards().slice(0, 2)).toEqual(['/shop/b0-handle', '/shop/b1-handle'])
  })

  it('restores the page from the URL and writes state changes back to it', async () => {
    mockSearch = 'category=private-sessions&page=2'
    const user = userEvent.setup()
    render(<ShopCatalogueContent initialCategories={categories} />)
    await waitFor(() => expect(cards()).toHaveLength(2))
    expect(cards()).toEqual(['/shop/p12-handle', '/shop/p13-handle'])

    await user.selectOptions(screen.getByRole('combobox', { name: /sort/i }), 'price_desc')
    await waitFor(() => expect(window.location.search).toBe('?category=private-sessions&sort=price_desc'))

    await user.click(screen.getByRole('button', { name: 'All' }))
    await waitFor(() => expect(window.location.search).toBe('?sort=price_desc'))
  })

  it('search links to real product handles and stays within the active filter', async () => {
    mockSearch = 'category=private-sessions'
    searchHits = ['b0', 'p3', 'p1']
    const user = userEvent.setup()
    render(<ShopCatalogueContent initialCategories={categories} />)
    await waitFor(() => expect(cards()).toHaveLength(12))

    await user.type(screen.getByPlaceholderText(/search programmes/i), 'rapid')
    await waitFor(() => expect(cards()).toEqual(['/shop/p3-handle', '/shop/p1-handle']), { timeout: 2000 })

    // Titles come from the store, so no raw <mark> tags; filter pill and sort stay.
    expect(screen.queryByText(/<mark>/)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Private Sessions' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('combobox', { name: /sort/i })).toBeInTheDocument()
    expect(within(screen.getByRole('main')).getByText('2 results')).toBeInTheDocument()
    expect(window.location.search).toBe('?category=private-sessions&q=rapid')
  })

  it('pages through search results beyond the first page', async () => {
    searchHits = allProducts.map((p) => p.id)
    mockSearch = 'q=session&page=2'
    render(<ShopCatalogueContent initialCategories={categories} />)
    await waitFor(() => expect(cards()).toHaveLength(4), { timeout: 2000 })
    expect(screen.getByRole('button', { name: /next page/i })).toBeDisabled()
  })
})
