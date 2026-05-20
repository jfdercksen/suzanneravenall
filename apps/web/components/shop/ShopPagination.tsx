'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'

interface ShopPaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function ShopPagination({ page, totalPages, onPageChange }: ShopPaginationProps) {
  const visiblePages = [...new Set(
    Array.from({ length: totalPages }, (_, i) => i).filter(
      (p) => p === 0 || p === totalPages - 1 || Math.abs(p - page) <= 1
    )
  )]

  return (
    <div className="flex items-center justify-center gap-2 mt-16">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 0}
        className="p-2 rounded-lg border border-gray-200 text-gray-400 hover:text-brand-primary hover:border-brand-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
        aria-label="Previous page"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {visiblePages.map((p, i) => {
        const prev = visiblePages[i - 1]
        const showEllipsis = prev !== undefined && p - prev > 1

        return (
          <span key={p} className="flex items-center gap-2">
            {showEllipsis && (
              <span className="text-gray-400 px-1 select-none">…</span>
            )}
            <button
              onClick={() => onPageChange(p)}
              className={`w-10 h-10 rounded-lg text-sm font-medium transition-all duration-200 ${
                p === page
                  ? 'bg-brand-accent-600 text-white'
                  : 'border border-gray-200 text-gray-500 hover:text-brand-primary hover:border-brand-primary'
              }`}
            >
              {p + 1}
            </button>
          </span>
        )
      })}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages - 1}
        className="p-2 rounded-lg border border-gray-200 text-gray-400 hover:text-brand-primary hover:border-brand-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
        aria-label="Next page"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  )
}
