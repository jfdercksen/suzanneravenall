'use client'

import { useEffect, useRef, useState } from 'react'

interface MedusaCategory {
  id: string
  handle: string
  name: string
  parent_category_id: string | null
}

interface FilterState {
  categoryId: string
  collectionHandle: string
}

interface CategoryFilterBarProps {
  categories: MedusaCategory[]
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
}

const CATEGORY_LABELS: Record<string, string> = {
  'private-sessions': 'Private Sessions',
  'guided-programmes': 'Guided Programmes',
  'group-sessions': 'Group Sessions',
  'products-tools': 'Products & Tools',
}

export function CategoryFilterBar({ categories, filters, onFiltersChange }: CategoryFilterBarProps) {
  const barRef = useRef<HTMLDivElement>(null)
  const [isSticky, setIsSticky] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsSticky(entry !== undefined && !entry.isIntersecting),
      { threshold: 1, rootMargin: '-1px 0px 0px 0px' }
    )

    const el = barRef.current
    if (el) observer.observe(el)

    return () => {
      if (el) observer.unobserve(el)
    }
  }, [])

  const topLevelCategories = categories.filter((c) => c.parent_category_id === null)

  const setCategoryId = (id: string) =>
    onFiltersChange({ ...filters, categoryId: id, collectionHandle: '' })

  return (
    <div
      ref={barRef}
      className={`sticky top-0 z-40 w-full bg-gray-950 border-b transition-shadow duration-300 ${
        isSticky ? 'border-white/10 shadow-lg shadow-black/40' : 'border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex flex-wrap gap-3">
          <FilterPill
            label="All"
            active={filters.categoryId === ''}
            onClick={() => setCategoryId('')}
          />
          {topLevelCategories.map((cat) => (
            <FilterPill
              key={cat.id}
              label={CATEGORY_LABELS[cat.handle] ?? cat.name}
              active={filters.categoryId === cat.id}
              onClick={() => setCategoryId(cat.id)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

interface FilterPillProps {
  label: string
  active: boolean
  onClick: () => void
}

function FilterPill({ label, active, onClick }: FilterPillProps) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap ${
        active
          ? 'bg-brand-accent text-white shadow-lg shadow-brand-accent/25'
          : 'bg-gray-900 text-gray-300 hover:text-white hover:bg-gray-800 hover:border-brand-accent border border-transparent'
      }`}
    >
      {label}
    </button>
  )
}
