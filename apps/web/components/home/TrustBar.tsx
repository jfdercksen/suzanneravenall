'use client'

import { useRef, useEffect, useState } from 'react'
import { motion, useInView } from 'framer-motion'

interface Stat {
  value: string
  label: string
  numeric: number | null
  suffix: string
}

const stats: Stat[] = [
  { value: '20+',   label: 'Years Experience',        numeric: 20,   suffix: '+' },
  { value: '1,000+', label: 'Lives Transformed',      numeric: 1000, suffix: '+' },
  { value: '30+',   label: 'Countries',               numeric: 30,   suffix: '+' },
  { value: 'Dr.',   label: 'B.Msc · M.Msc · Msc.D.', numeric: null, suffix: '' },
]

function CountUp({ target, suffix, isInView }: { target: number; suffix: string; isInView: boolean }) {
  const rafRef = useRef<number>(0)
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!isInView) return
    const start = performance.now()
    const duration = 1600

    const animate = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(eased * target))
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      } else {
        setCount(target)
      }
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [isInView, target])

  return (
    <span>
      {target >= 1000 ? count.toLocaleString() : count}{suffix}
    </span>
  )
}

export default function TrustBar() {
  const sectionRef = useRef<HTMLElement>(null)
  const isInView = useInView(sectionRef, { once: true, margin: '-80px' })

  return (
    <section ref={sectionRef} aria-label="Trust indicators" className="bg-white py-12 lg:py-16 border-y border-gray-100">
      <div className="max-w-7xl mx-auto px-4">
        <dl className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-0 lg:divide-x lg:divide-gray-200">
          {stats.map(({ value, label, numeric, suffix }, i) => (
            <motion.div
              key={label}
              className="text-center lg:px-8"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: 'easeOut' }}
            >
              <dd className="text-4xl lg:text-5xl font-light text-brand-primary">
                {numeric !== null
                  ? <CountUp target={numeric} suffix={suffix} isInView={isInView} />
                  : value}
              </dd>
              <dt className="mt-2 text-sm font-medium text-gray-400 uppercase tracking-wider">{label}</dt>
            </motion.div>
          ))}
        </dl>
      </div>
    </section>
  )
}
