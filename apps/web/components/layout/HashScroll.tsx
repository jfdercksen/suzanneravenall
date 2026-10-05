'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

// Site check A2: an in-app <Link> to /programs#live, /services#private,
// /contact?enquiry=...#message and so on left the visitor at the top of the
// page, because the App Router looks for the hash target before the new page
// (or its loading state) has rendered it. Direct loads were fine. This one
// component, mounted in the root layout, settles the scroll after every route
// change: it waits for the target to exist, then scrolls it to just under the
// sticky header, and corrects once more if images or embeds shift it.

/** Gap left between the bottom of the sticky header and the target. */
export const HASH_SCROLL_GAP_PX = 16
/** How long to wait for the target element to be rendered. */
export const HASH_WAIT_MS = 5_000
/** How long to keep correcting for layout shift after the first scroll. */
export const HASH_SETTLE_MS = 2_000
const POLL_MS = 100

/** Document y of an element's layout box, ignoring CSS transforms (reveal animations). */
export function layoutTop(el: HTMLElement): number {
  let top = 0
  let node: HTMLElement | null = el
  while (node) {
    top += node.offsetTop
    node = node.offsetParent as HTMLElement | null
  }
  return top
}

/** Space the sticky header covers at the top of the viewport. */
function headerOffset(): number {
  const header = document.querySelector('header[role="banner"]')
  const bottom = header ? header.getBoundingClientRect().bottom : 0
  return Math.max(0, bottom) + HASH_SCROLL_GAP_PX
}

/** The window scroll position that puts `el` just below the header. */
export function hashScrollTarget(el: HTMLElement): number {
  const margin = parseFloat(getComputedStyle(el).scrollMarginTop) || 0
  const offset = Math.max(margin, headerOffset())
  const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
  return Math.min(max, Math.max(0, Math.round(layoutTop(el) - offset)))
}

function findTarget(hash: string): HTMLElement | null {
  if (!hash || hash === '#') return null
  let id = hash.slice(1)
  try {
    id = decodeURIComponent(id)
  } catch {
    // Malformed escape: use the raw id.
  }
  return document.getElementById(id)
}

function scrollToY(y: number) {
  // 'instant' overrides html { scroll-behavior: smooth }, which would otherwise
  // animate a long scroll that our layout-shift correction then interrupts.
  window.scrollTo({ top: y, left: 0, behavior: 'instant' as ScrollBehavior })
}

// Back/forward and reload restore the visitor's own scroll position, so the
// hash must not override it. A popstate marks the next route change as a
// history traversal; the first mount checks how the document was loaded.
let historyTraversal = false
if (typeof window !== 'undefined') {
  window.addEventListener('popstate', () => {
    historyTraversal = true
  })
}

function loadedFromHistoryOrReload(): boolean {
  const nav = performance.getEntriesByType?.('navigation')?.[0] as PerformanceNavigationTiming | undefined
  return nav?.type === 'back_forward' || nav?.type === 'reload'
}

let firstRun = true

export default function HashScroll() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const search = searchParams?.toString() ?? ''

  useEffect(() => {
    const traversal = historyTraversal || (firstRun && loadedFromHistoryOrReload())
    historyTraversal = false
    firstRun = false
    if (traversal) return

    const hash = window.location.hash
    if (!hash || hash === '#') return

    const startedAt = Date.now()
    let scrolledAt = 0
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined

    // The visitor takes over as soon as they scroll, tap or press a key.
    const stop = () => {
      cancelled = true
      clearTimeout(timer)
    }
    const userEvents = ['wheel', 'touchstart', 'keydown', 'pointerdown'] as const
    userEvents.forEach((type) => window.addEventListener(type, stop, { passive: true }))

    const tick = () => {
      if (cancelled) return
      const now = Date.now()
      const el = findTarget(hash)
      if (!el) {
        if (now - startedAt < HASH_WAIT_MS) timer = setTimeout(tick, POLL_MS)
        return
      }
      const y = hashScrollTarget(el)
      if (Math.abs(window.scrollY - y) > 2) scrollToY(y)
      if (!scrolledAt) scrolledAt = now
      if (now - scrolledAt < HASH_SETTLE_MS) timer = setTimeout(tick, POLL_MS)
    }
    // Let the App Router finish its own scroll handling for this commit first.
    timer = setTimeout(tick, 0)

    return () => {
      stop()
      userEvents.forEach((type) => window.removeEventListener(type, stop))
    }
  }, [pathname, search])

  return null
}
