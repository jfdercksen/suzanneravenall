"use client"

import Link from 'next/link'
import { motion } from 'framer-motion'

/** The /book/<token> page when the client is not sent on to Cal.com (J-07). */

interface NoticeAction {
  label: string
  href: string
}

interface BookingNoticeProps {
  title: string
  lines: string[]
  primary: NoticeAction
  secondary?: NoticeAction
  supportEmail: string
}

export default function BookingNotice({ title, lines, primary, secondary, supportEmail }: BookingNoticeProps) {
  return (
    <section className="w-full min-h-[70vh] py-20 lg:py-32 bg-brand-primary-900">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
        >
          <p className="mb-4 text-xs uppercase tracking-[0.3em] font-medium text-brand-accent-400">Book a session</p>
          <h1 className="mb-8 text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight leading-[1.05] text-white">
            {title}
          </h1>
          {lines.map((line) => (
            <p key={line} className="mb-4 max-w-xl text-base lg:text-lg leading-relaxed text-white/85">
              {line}
            </p>
          ))}
          <div className="flex flex-col sm:flex-row gap-4 mt-8 mb-8">
            <Link
              href={primary.href}
              className="inline-flex items-center justify-center py-4 px-8 rounded-button text-base font-medium bg-white text-brand-primary hover:bg-brand-sand transition-all duration-300"
            >
              {primary.label}
            </Link>
            {secondary && (
              <Link
                href={secondary.href}
                className="inline-flex items-center justify-center py-4 px-8 rounded-button text-base font-medium border border-white/50 text-white hover:bg-white/10 transition-all duration-300"
              >
                {secondary.label}
              </Link>
            )}
          </div>
          <p className="max-w-xl text-base leading-relaxed text-white/85">
            Questions? Contact us at{' '}
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
