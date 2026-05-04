'use client'

import Link from 'next/link'
import { ShoppingBag } from 'lucide-react'
import { useCart } from '@/lib/cart'

export function CartIcon() {
  const { itemCount } = useCart()

  return (
    <Link
      href="/cart"
      aria-label={`Cart${itemCount > 0 ? ` — ${itemCount} item${itemCount !== 1 ? 's' : ''}` : ''}`}
      className="relative inline-flex items-center justify-center w-10 h-10 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-all duration-150"
    >
      <ShoppingBag className="w-5 h-5" />
      {itemCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-brand-accent text-white text-[10px] font-bold flex items-center justify-center tabular-nums leading-none">
          {itemCount > 9 ? '9+' : itemCount}
        </span>
      )}
    </Link>
  )
}
