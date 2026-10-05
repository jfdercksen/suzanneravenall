import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, act } from '@testing-library/react'
import HashScroll, { HASH_SCROLL_GAP_PX, HASH_WAIT_MS, layoutTop } from './HashScroll'

let mockPathname = '/'
vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
  useSearchParams: () => new URLSearchParams(),
}))

const scrollTo = vi.fn()

/** Adds an element whose layout box sits at document y = `top` (jsdom has no layout). */
function addTarget(id: string, top: number) {
  const el = document.createElement('section')
  el.id = id
  Object.defineProperty(el, 'offsetTop', { configurable: true, get: () => top })
  Object.defineProperty(el, 'offsetParent', { configurable: true, get: () => null })
  document.body.appendChild(el)
  return el
}

function addHeader(height: number) {
  const header = document.createElement('header')
  header.setAttribute('role', 'banner')
  header.getBoundingClientRect = () => ({ top: 0, bottom: height, height } as DOMRect)
  document.body.appendChild(header)
}

beforeEach(() => {
  vi.useFakeTimers()
  window.scrollTo = scrollTo as unknown as typeof window.scrollTo
  Object.defineProperty(document.documentElement, 'scrollHeight', { configurable: true, get: () => 10_000 })
  mockPathname = '/'
  window.history.replaceState(null, '', '/')
})

afterEach(() => {
  vi.useRealTimers()
  scrollTo.mockReset()
  document.body.innerHTML = ''
})

describe('HashScroll', () => {
  it('scrolls to the hash target once it renders, below the sticky header', async () => {
    addHeader(80)
    window.history.replaceState(null, '', '/programs#live')
    mockPathname = '/programs'
    render(<HashScroll />)

    // The new page has not rendered the target yet: nothing happens.
    await act(async () => {
      vi.advanceTimersByTime(300)
    })
    expect(scrollTo).not.toHaveBeenCalled()

    addTarget('live', 4800)
    await act(async () => {
      vi.advanceTimersByTime(200)
    })
    expect(scrollTo).toHaveBeenCalledWith({ top: 4800 - 80 - HASH_SCROLL_GAP_PX, left: 0, behavior: 'instant' })
  })

  it('re-runs after a client-side route change', async () => {
    addHeader(64)
    const { rerender } = render(<HashScroll />)
    await act(async () => {
      vi.advanceTimersByTime(200)
    })
    expect(scrollTo).not.toHaveBeenCalled()

    addTarget('private', 1200)
    window.history.pushState(null, '', '/services#private')
    mockPathname = '/services'
    rerender(<HashScroll />)
    await act(async () => {
      vi.advanceTimersByTime(200)
    })
    expect(scrollTo).toHaveBeenCalledWith(expect.objectContaining({ top: 1200 - 64 - HASH_SCROLL_GAP_PX }))
  })

  it('corrects again when content above the target shifts it', async () => {
    addHeader(80)
    let top = 1000
    const el = addTarget('message', 0)
    Object.defineProperty(el, 'offsetTop', { configurable: true, get: () => top })
    window.history.replaceState(null, '', '/contact?enquiry=speaking#message')
    render(<HashScroll />)
    await act(async () => {
      vi.advanceTimersByTime(50)
    })
    expect(scrollTo).toHaveBeenLastCalledWith(expect.objectContaining({ top: 1000 - 96 }))

    top = 1400
    await act(async () => {
      vi.advanceTimersByTime(150)
    })
    expect(scrollTo).toHaveBeenLastCalledWith(expect.objectContaining({ top: 1400 - 96 }))
  })

  it('stops as soon as the visitor scrolls themselves', async () => {
    addHeader(80)
    let top = 1000
    const el = addTarget('book', 0)
    Object.defineProperty(el, 'offsetTop', { configurable: true, get: () => top })
    window.history.replaceState(null, '', '/contact#book')
    render(<HashScroll />)
    await act(async () => {
      vi.advanceTimersByTime(50)
    })
    expect(scrollTo).toHaveBeenCalledTimes(1)

    window.dispatchEvent(new Event('wheel'))
    top = 2000
    await act(async () => {
      vi.advanceTimersByTime(500)
    })
    expect(scrollTo).toHaveBeenCalledTimes(1)
  })

  it('does nothing without a hash, and gives up on a target that never appears', async () => {
    render(<HashScroll />)
    window.history.replaceState(null, '', '/programs#missing')
    mockPathname = '/programs'
    render(<HashScroll />)
    await act(async () => {
      vi.advanceTimersByTime(HASH_WAIT_MS + 500)
    })
    addTarget('missing', 500)
    await act(async () => {
      vi.advanceTimersByTime(500)
    })
    expect(scrollTo).not.toHaveBeenCalled()
  })

  it('layoutTop sums offsetTop up the offsetParent chain, ignoring transforms', () => {
    const outer = document.createElement('div')
    const inner = document.createElement('div')
    Object.defineProperty(outer, 'offsetTop', { get: () => 300 })
    Object.defineProperty(outer, 'offsetParent', { get: () => null })
    Object.defineProperty(inner, 'offsetTop', { get: () => 40 })
    Object.defineProperty(inner, 'offsetParent', { get: () => outer })
    inner.style.transform = 'translateY(20px)'
    expect(layoutTop(inner)).toBe(340)
  })
})
