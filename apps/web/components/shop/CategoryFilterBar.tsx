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

const COLLECTIONS = [
  { handle: '', label: 'All Tiers' },
  { handle: 'start-here', label: 'Start Here' },
  { handle: 'deep-dive', label: 'Deep Dive' },
  { handle: 'master-level', label: 'Master Level' },
  { handle: 'practitioner', label: 'Practitioner' },
]

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

  const setCategoryId = (id: string) => onFiltersChange({ ...filters, categoryId: id })
  const setCollectionHandle = (handle: string) => onFiltersChange({ ...filters, collectionHandle: handle })

  return (
    <div
      ref={barRef}
      className={`sticky top-0 z-40 w-full bg-gray-950 border-b transition-shadow duration-300 ${
        isSticky ? 'border-white/10 shadow-lg shadow-black/40' : 'border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
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

        <div className="flex flex-wrap gap-2">
          {COLLECTIONS.map((col) => (
            <FilterPill
              key={col.handle}
              label={col.label}
              active={filters.collectionHandle === col.handle}
              onClick={() => setCollectionHandle(col.handle)}
              small
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
  small?: boolean
}

function FilterPill({ label, active, onClick, small = false }: FilterPillProps) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full font-medium transition-all duration-200 whitespace-nowrap ${
        small ? 'px-3 py-1 text-xs' : 'px-4 py-2 text-sm'
      } ${
        active
          ? 'bg-brand-accent-600 text-white'
          : 'bg-gray-900 text-gray-400 hover:text-white hover:bg-gray-800'
      }`}
    >
      {label}
    </button>
  )
}
