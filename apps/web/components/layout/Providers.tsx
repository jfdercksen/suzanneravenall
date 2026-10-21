'use client'

import { useRouter } from 'next/navigation'
import { CartProvider } from '@/lib/cart'

export function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  // A currency switch changes the cookie the server-rendered prices read.
  return <CartProvider onCurrencyChange={() => router.refresh()}>{children}</CartProvider>
}
