import type { Metadata } from 'next'
import { Suspense } from 'react'
import ConfirmationContent from '@/components/checkout/ConfirmationContent'

export const metadata: Metadata = {
  title: 'Your Order',
  description: 'The status of your order with Dr Suzanne Ravenall.',
}

// ConfirmationContent reads useSearchParams, which needs its own Suspense
// boundary now that there is no root loading.tsx (site check M1).
export default function ConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-900" />
        </div>
      }
    >
      <ConfirmationContent />
    </Suspense>
  )
}
