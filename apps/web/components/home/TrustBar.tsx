'use client'

import { useRef, useEffect, useState } from 'react'
import Image from 'next/image'
import { motion, useInView } from 'framer-motion'

interface Stat {
  value: string
  label: string
  numeric: number | null
  suffix: string
}

const accreditations = [
  { src: '/logos/accreditations/icf-member.png',             alt: 'International Coaching Federation — Member',            w: 110 },
  { src: '/logos/accreditations/aadp.png',                   alt: 'American Association of Drugless Practitioners',        w: 190 },
  { src: '/logos/accreditations/ctaa.png',                   alt: 'Complementary Therapists Accredited Association',       w: 295 },
  { src: '/logos/accreditations/ctss.png',                   alt: 'Certified Clinical Trauma Specialist',                  w: 110 },
  { src: '/logos/accreditations/royal-society-medicine.png', alt: 'The Royal Society of Medicine',                         w: 111 },
  { src: '/logos/accreditations/iqnet.png',                  alt: 'IQNet Certified',                                       w: 196 },
  { src: '/logos/accreditations/iso-9001.jpg',               alt: 'ISO 9001 Certified',                                    w: 250 },
  { src: '/logos/accreditations/accredited-mediator.jpg',    alt: 'Accredited Mediator',                                   w: 147 },
]

const stats: Stat[] = [
  { value: '20+',   label: 'Years Experience',        numeric: 20,   suffix: '+' },
  { value: '2,000+', label: 'Lives Transformed',      numeric: 2000, suffix: '+' },
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
  const isInView = useInView(sectionRef, { once: true, margin: '0px' })

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
              viewport={{ once: true, margin: '0px' }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: 'easeOut' }}
            >
              <dd className="text-4xl sm:text-5xl lg:text-7xl font-semibold tracking-tight text-brand-primary">
                {numeric !== null
                  ? <CountUp target={numeric} suffix={suffix} isInView={isInView} />
                  : value}
              </dd>
              <dt className="mt-3 text-xs lg:text-sm font-medium text-gray-500 uppercase tracking-[0.2em]">{label}</dt>
            </motion.div>
          ))}
        </dl>

        {/* Accreditations */}
        <motion.div
          className="mt-14 lg:mt-16"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '0px' }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <p className="text-center text-xs uppercase tracking-[0.3em] font-medium text-gray-500 mb-8">
            Our Accreditations
          </p>
          <ul className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6" aria-label="Accreditation bodies">
            {accreditations.map(({ src, alt, w }) => (
              <li key={src} className="relative h-12 lg:h-14" style={{ aspectRatio: `${w} / 110` }}>
                <Image
                  src={src}
                  alt={alt}
                  fill
                  sizes="160px"
                  className="object-contain grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
                />
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  )
}
