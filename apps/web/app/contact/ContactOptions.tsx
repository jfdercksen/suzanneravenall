'use client'

import Cal from '@calcom/embed-react'
import { motion } from 'framer-motion'
import { Mail, MapPin } from 'lucide-react'
import ContactForm from './ContactForm'

const CAL_URL = process.env.NEXT_PUBLIC_CAL_URL ?? 'https://cal.suzanneravenall.com'

const sectionReveal = {
  initial: { opacity: 0, y: 50 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-100px' } as const,
  transition: { duration: 0.6, ease: 'easeOut' as const },
}

function cardReveal(delay: number) {
  return {
    initial: { opacity: 0, y: 40 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-100px' } as const,
    transition: { duration: 0.6, delay, ease: 'easeOut' as const },
  }
}

export default function ContactOptions() {
  return (
    <section
      aria-labelledby="contact-options-heading"
      className="w-full bg-white py-20 lg:py-32"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.p
          {...sectionReveal}
          className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-4 text-center"
        >
          HOW TO CONNECT
        </motion.p>

        <motion.h2
          id="contact-options-heading"
          {...sectionReveal}
          transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' as const }}
          className="text-4xl lg:text-5xl font-light text-brand-primary text-center mb-12"
        >
          Choose Your Path
        </motion.h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Card 1 — Book Discovery Call (primary) */}
          <motion.div
            {...cardReveal(0.15)}
            className="rounded-card bg-brand-accent/10 border border-brand-accent p-8 flex flex-col hover:-translate-y-1 hover:shadow-2xl transition-all duration-300"
          >
            <h3 className="text-lg font-semibold text-brand-primary mb-2">Book a Discovery Call</h3>
            <p className="text-gray-600 text-sm leading-relaxed mb-6">
              30 minutes. No obligation. Find out if we&rsquo;re a fit.
            </p>

            <div className="rounded-lg overflow-hidden -mx-2">
              <Cal
                calLink="suzanneravenall/discovery-call"
                embedJsUrl={`${CAL_URL}/embed/embed.js`}
                config={{ theme: 'light', layout: 'month_view' }}
                style={{ width: '100%', height: '600px', overflow: 'auto' }}
              />
            </div>
          </motion.div>

          {/* Card 2 — Send a Message */}
          <motion.div
            {...cardReveal(0.25)}
            className="rounded-card bg-gray-50 border border-gray-200 p-8 flex flex-col hover:-translate-y-1 hover:shadow-2xl transition-all duration-300"
          >
            <h3 className="text-lg font-semibold text-brand-primary mb-2">Send a Message</h3>
            <ContactForm light />
          </motion.div>

          {/* Card 3 — Other Ways to Connect */}
          <motion.div
            {...cardReveal(0.35)}
            className="rounded-card bg-gray-50 border border-gray-200 p-8 flex flex-col gap-6 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300"
          >
            <h3 className="text-lg font-semibold text-brand-primary">Other Ways to Connect</h3>

            <ul className="flex flex-col gap-5">
              <li className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-brand-accent mt-0.5 shrink-0" aria-hidden="true" />
                <div>
                  <p className="text-xs uppercase tracking-wider text-gray-500 mb-0.5">Email</p>
                  <a
                    href="mailto:support@ravenallinstitute.com"
                    className="text-gray-700 hover:text-brand-accent text-sm transition-colors"
                  >
                    support@ravenallinstitute.com
                  </a>
                </div>
              </li>

              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-brand-accent mt-0.5 shrink-0" aria-hidden="true" />
                <div>
                  <p className="text-xs uppercase tracking-wider text-gray-500 mb-0.5">Location</p>
                  <span className="text-gray-700 text-sm">Kyalami, GP, South Africa, 1684</span>
                </div>
              </li>
            </ul>

            <div>
              <p className="text-xs uppercase tracking-wider text-gray-500 mb-4">Follow Along</p>
              <ul className="flex flex-col gap-3">
                <li>
                  <a
                    href="https://www.linkedin.com/in/sravenall"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="LinkedIn"
                    className="inline-flex items-center gap-3 text-gray-600 hover:text-brand-accent text-sm transition-colors group"
                  >
                    <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 group-hover:scale-110 transition-transform duration-300"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                    LinkedIn
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.instagram.com/ravenallinstitute"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                    className="inline-flex items-center gap-3 text-gray-600 hover:text-brand-accent text-sm transition-colors group"
                  >
                    <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 group-hover:scale-110 transition-transform duration-300"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
                    Instagram
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.facebook.com/suzanneravenalltransformation"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Facebook"
                    className="inline-flex items-center gap-3 text-gray-600 hover:text-brand-accent text-sm transition-colors group"
                  >
                    <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 group-hover:scale-110 transition-transform duration-300"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                    Facebook
                  </a>
                </li>
              </ul>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
