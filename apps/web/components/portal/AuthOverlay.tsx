'use client'

import { useEffect, useRef } from 'react'

/**
 * The full-screen layer the signed-out portal pages (login, signup, forgot
 * password, reset password) render in. It covers the public header, footer
 * and the other site chrome visually, but covered is not gone: Tab still
 * walked through about 80 hidden links (site check M6).
 *
 * While it is mounted, everything outside it is made `inert`: at each level
 * from this element up to <body>, every sibling. A MutationObserver catches
 * chrome that mounts later (the cookie banner renders after hydration). On
 * unmount only the attributes this component added are removed.
 */
export default function AuthOverlay({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const overlay = ref.current
    if (!overlay) return

    const added = new Set<Element>()
    const ancestors: Element[] = []

    const apply = () => {
      for (const parent of ancestors) {
        for (const sibling of Array.from(parent.children)) {
          if (sibling.contains(overlay) || sibling.hasAttribute('inert')) continue
          if (sibling instanceof HTMLScriptElement || sibling instanceof HTMLStyleElement) continue
          // Next's route announcer (and dev overlay) must keep talking to screen readers.
          if (sibling.tagName.startsWith('NEXT')) continue
          sibling.setAttribute('inert', '')
          added.add(sibling)
        }
      }
    }

    let node: Element | null = overlay.parentElement
    while (node) {
      ancestors.push(node)
      if (node === document.body) break
      node = node.parentElement
    }

    apply()
    const observer = new MutationObserver(apply)
    for (const parent of ancestors) observer.observe(parent, { childList: true })

    return () => {
      observer.disconnect()
      for (const el of added) el.removeAttribute('inert')
    }
  }, [])

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}
