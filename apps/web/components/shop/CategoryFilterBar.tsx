'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { shopCategoryLabel } from './shopCatalogue'

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

export function CategoryFilterBar({ categories, filters, onFiltersChange }: CategoryFilterBarProps) {
  const barRef = useRef<HTMLElement>(null)
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

  // A link such as /shop?category=books selects a sub-category; highlight the
  // top-level pill it belongs to.
  const activeRootId = (() => {
    let current = categories.find((c) => c.id === filters.categoryId)
    const seen = new Set<string>()
    while (current?.parent_category_id && !seen.has(current.id)) {
      seen.add(current.id)
      const parentId: string = current.parent_category_id
      current = categories.find((c) => c.id === parentId)
    }
    return current?.id ?? filters.categoryId
  })()

  // A deep link to a sub-category (e.g. ?category=akashic-coaching) only lights
  // up the parent pill, so name the sub-category and offer a way back to the
  // whole parent category.
  const activeSubCategory =
    filters.categoryId !== '' && activeRootId !== filters.categoryId
      ? categories.find((c) => c.id === filters.categoryId) ?? null
      : null

  // Category and collection filters are mutually exclusive — selecting one clears the other.
  const setCategoryId = (id: string) =>
    onFiltersChange({ categoryId: id, collectionHandle: '' })

  const setCollectionHandle = (handle: string) =>
    onFiltersChange({ categoryId: '', collectionHandle: handle })

  const isOnlineCourses = filters.collectionHandle === 'programmes'

  return (
    <nav
      ref={barRef}
      aria-label="Shop categories"
      className={`sticky top-16 lg:top-20 z-40 w-full bg-brand-cream border-b border-brand-border transition-shadow duration-300 ${
        isSticky ? 'shadow-lg shadow-black/5' : ''
      }`}
    >
      {/* Site check V5: below lg the pills sit on one row that scrolls sideways
          (it used to wrap to four rows, 305px of sticky bar on a phone), and
          the smaller pills keep "Self-Study" on the first row on desktop. */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 lg:py-5 flex flex-col lg:flex-row lg:items-start gap-3 lg:gap-8">
        <p className="hidden lg:block flex-shrink-0 text-xs uppercase tracking-[0.3em] font-medium text-brand-accent lg:pt-3">
          Browse by category
        </p>
        <div className="flex-1 min-w-0">
        <div className="flex flex-nowrap lg:flex-wrap gap-2 overflow-x-auto lg:overflow-visible -mx-4 px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0 py-1 lg:py-0">
          <FilterPill
            label="All"
            active={filters.categoryId === '' && filters.collectionHandle === ''}
            onClick={() => setCategoryId('')}
          />
          {topLevelCategories.map((cat) => (
            <FilterPill
              key={cat.id}
              label={shopCategoryLabel(cat)}
              active={filters.categoryId !== '' && activeRootId === cat.id}
              onClick={() => setCategoryId(cat.id)}
            />
          ))}
          <FilterPill
            label="Self-Study"
            active={isOnlineCourses}
            onClick={() => setCollectionHandle(isOnlineCourses ? '' : 'programmes')}
          />
        </div>

        {activeSubCategory && (
          <div className="mt-3 flex items-center gap-2 text-sm text-brand-muted">
            <span>Showing</span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-accent/40 bg-brand-accent/10 pl-3 pr-1.5 py-1 font-medium text-brand-ink">
              {activeSubCategory.name}
              <button
                type="button"
                onClick={() => setCategoryId(activeRootId)}
                aria-label={`Clear ${activeSubCategory.name} filter`}
                className="rounded-full p-0.5 text-brand-muted hover:text-brand-accent transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          </div>
        )}

        <AnimatePresence>
          {isOnlineCourses && (
            <motion.p
              key="courses-subtitle"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="mt-3 text-xs text-brand-muted font-light"
            >
              Self-paced courses delivered via the Ravenall Institute
            </motion.p>
          )}
        </AnimatePresence>
        </div>
      </div>
    </nav>
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
      className={`flex-shrink-0 px-4 py-2 lg:px-5 lg:py-2.5 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap ${
        active
          ? 'bg-brand-accent text-white shadow-lg shadow-brand-accent/25'
          : 'border border-brand-primary-300 text-brand-muted hover:border-brand-accent hover:text-brand-primary hover:bg-brand-sand'
      }`}
    >
      {label}
    </button>
  )
}
