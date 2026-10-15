'use client'

import { useSyncExternalStore } from 'react'

const subscribe = () => () => {}

/**
 * False in the server render and during hydration, true once React has taken
 * over the page. A handler on a server-rendered button does nothing until then,
 * so a control that must not lose a click renders disabled while this is false
 * (KI066: the product page's variant picker and Add to Cart).
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  )
}
