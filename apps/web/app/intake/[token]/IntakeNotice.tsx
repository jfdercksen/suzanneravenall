"use client"

import { motion } from 'framer-motion'

/** The intake page when there is no form to fill in: done, expired, broken link or a fault. */

interface IntakeNoticeProps {
  title: string
  lines: string[]
  supportEmail: string
}

export default function IntakeNotice({ title, lines, supportEmail }: IntakeNoticeProps) {
  return (
    <section className="w-full min-h-[70vh] py-20 lg:py-32 bg-brand-primary-900">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
        >
          <p className="mb-4 text-xs uppercase tracking-[0.3em] font-medium text-brand-accent-400">Intake form</p>
          <h1 className="mb-8 text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight leading-[1.05] text-white">
            {title}
          </h1>
          {lines.map((line) => (
            <p key={line} className="mb-4 max-w-xl text-base lg:text-lg leading-relaxed text-white/85">
              {line}
            </p>
          ))}
          <p className="max-w-xl text-base lg:text-lg leading-relaxed text-white/85">
            Contact us at{' '}
            <a href={`mailto:${supportEmail}`} className="text-white underline underline-offset-4">
              {supportEmail}
            </a>
            .
          </p>
        </motion.div>
      </div>
    </section>
  )
}
