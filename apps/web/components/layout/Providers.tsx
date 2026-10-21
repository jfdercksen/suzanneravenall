'use client'

import { useRouter } from 'next/navigation'
import { CartProvider } from '@/lib/cart'

export function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  // A currency correction (time zone, recovery link) changes the cookie the
  // server-rendered prices read when the location is unknown.
  return <CartProvider onCurrencyChange={() => router.refresh()}>{children}</CartProvider>
}
