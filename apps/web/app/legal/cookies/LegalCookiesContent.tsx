"use client"

import { motion } from 'framer-motion'
import Link from 'next/link'

const LAST_UPDATED = '12 May 2026'

export default function LegalCookiesContent() {
  return (
    <>
      {/* Dark hero */}
      <section className="py-20 lg:py-32 bg-brand-primary-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '0px' }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-4">
              Legal
            </p>
            <h1 className="text-4xl lg:text-6xl font-light text-white mb-6">
              Cookie Policy
            </h1>
            <p className="text-gray-300 text-sm">Last updated: {LAST_UPDATED}</p>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="py-20 lg:py-32 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '0px' }}
            transition={{ duration: 0.6 }}
            className="space-y-12"
          >

            {/* 1. What Are Cookies */}
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                1. What Are Cookies
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Cookies are small text files that are placed on your device when you visit a website.
                They are widely used to make websites work correctly, improve performance, and provide
                information to the website owner. Cookies may be &ldquo;first-party&rdquo; (set by us) or
                &ldquo;third-party&rdquo; (set by a service we use). They may also be &ldquo;session cookies&rdquo; (deleted
                when you close your browser) or &ldquo;persistent cookies&rdquo; (stored for a defined period).
              </p>
            </div>

            {/* 2. Types */}
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                2. Types of Cookies We Use
              </h2>

              {/* 2.1 Essential */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-800 mb-3">
                  2.1 Essential / Functional Cookies
                </h3>
                {/* TODO (legal review): Confirm full list of essential cookies — include cookie name, duration, and purpose for each */}
                <p className="text-gray-600 leading-relaxed mb-3">
                  These cookies are strictly necessary for the Site to function. They cannot be
                  disabled without breaking core features. No consent is required for these cookies
                  under POPIA, as they are essential for a service you have explicitly requested.
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left px-4 py-3 text-gray-700 font-medium border border-gray-200">Cookie Name</th>
                        <th className="text-left px-4 py-3 text-gray-700 font-medium border border-gray-200">Provider</th>
                        <th className="text-left px-4 py-3 text-gray-700 font-medium border border-gray-200">Purpose</th>
                        <th className="text-left px-4 py-3 text-gray-700 font-medium border border-gray-200">Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="px-4 py-3 text-gray-600 border border-gray-200 font-mono text-xs">sb-*-auth-token</td>
                        <td className="px-4 py-3 text-gray-600 border border-gray-200">Supabase</td>
                        <td className="px-4 py-3 text-gray-600 border border-gray-200">Stores your authentication session to keep you logged in to the member portal</td>
                        <td className="px-4 py-3 text-gray-600 border border-gray-200">Session / 7 days</td>
                      </tr>
                      {/* TODO: Add additional essential cookies — CSRF token, cart session, etc. once implemented */}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 2.2 Analytics */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-800 mb-3">
                  2.2 Analytics Cookies
                </h3>
                {/* TODO (legal review): Under POPIA and GDPR equivalency principles, analytics cookies require consent — implement a cookie consent banner before go-live */}
                <p className="text-gray-600 leading-relaxed mb-3">
                  We use analytics services to understand how visitors use our Site. These cookies
                  collect anonymised information about page views, session duration, and navigation
                  paths. Where consent is required we will ask before setting these cookies.
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left px-4 py-3 text-gray-700 font-medium border border-gray-200">Cookie Name</th>
                        <th className="text-left px-4 py-3 text-gray-700 font-medium border border-gray-200">Provider</th>
                        <th className="text-left px-4 py-3 text-gray-700 font-medium border border-gray-200">Purpose</th>
                        <th className="text-left px-4 py-3 text-gray-700 font-medium border border-gray-200">Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="px-4 py-3 text-gray-600 border border-gray-200 font-mono text-xs">_ga, _ga_*</td>
                        <td className="px-4 py-3 text-gray-600 border border-gray-200">Google Analytics 4</td>
                        <td className="px-4 py-3 text-gray-600 border border-gray-200">Distinguishes users and tracks page interactions for aggregated analytics</td>
                        <td className="px-4 py-3 text-gray-600 border border-gray-200">2 years</td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="px-4 py-3 text-gray-600 border border-gray-200 font-mono text-xs">_clck, _clsk, CLID</td>
                        <td className="px-4 py-3 text-gray-600 border border-gray-200">Microsoft Clarity</td>
                        <td className="px-4 py-3 text-gray-600 border border-gray-200">Session recording and heatmap analytics: helps us improve page usability</td>
                        <td className="px-4 py-3 text-gray-600 border border-gray-200">1 year / session</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 2.3 Marketing */}
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">
                  2.3 Marketing Cookies
                </h3>
                {/* TODO: If retargeting or ad pixels are ever added (Meta Pixel, LinkedIn Insight Tag), update this section — requires explicit opt-in consent */}
                <p className="text-gray-600 leading-relaxed">
                  We do not currently use marketing or advertising cookies. If we introduce them in
                  the future, we will update this policy and obtain your explicit consent before
                  setting any such cookies.
                </p>
              </div>
            </div>

            {/* 3. Third-Party Cookies */}
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                3. Third-Party Cookies
              </h2>
              <p className="text-gray-600 leading-relaxed mb-3">
                Some cookies on our Site are set by third-party services. We do not control these
                cookies and their processing is governed by the respective third party&rsquo;s privacy policy:
              </p>
              <ul className="list-disc list-outside pl-6 space-y-3 text-gray-600">
                <li>
                  <strong>Google Analytics 4:</strong>{' '}
                  <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-brand-accent underline hover:no-underline">
                    Google Privacy Policy
                  </a>
                </li>
                <li>
                  <strong>Microsoft Clarity:</strong>{' '}
                  <a href="https://privacy.microsoft.com/en-us/privacystatement" target="_blank" rel="noopener noreferrer" className="text-brand-accent underline hover:no-underline">
                    Microsoft Privacy Statement
                  </a>
                </li>
                {/* TODO: Add Cal.com, PayFast, PayPal cookie disclosures once embedded widgets are live */}
              </ul>
            </div>

            {/* 4. Control */}
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                4. How to Control Cookies
              </h2>
              {/* TODO: Implement a cookie consent banner (e.g. using a POPIA-compliant CMP) before go-live on production — required for analytics cookies */}
              <p className="text-gray-600 leading-relaxed mb-3">
                You have several options for controlling cookies:
              </p>
              <ul className="list-disc list-outside pl-6 space-y-3 text-gray-600">
                <li>
                  <strong>Browser settings:</strong> Most browsers allow you to view, delete, and
                  block cookies. Refer to your browser&rsquo;s help documentation for instructions.
                  Note that disabling all cookies may break essential site functionality.
                </li>
                <li>
                  <strong>Google Analytics opt-out:</strong>{' '}
                  <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="text-brand-accent underline hover:no-underline">
                    Google Analytics opt-out browser add-on
                  </a>
                </li>
                <li>
                  <strong>Microsoft Clarity opt-out:</strong> You can opt out via the Microsoft
                  Privacy dashboard or by adjusting your browser&rsquo;s Do Not Track settings.
                </li>
              </ul>
              <p className="text-gray-600 leading-relaxed mt-4">
                Disabling essential cookies (such as the Supabase authentication cookie) will prevent
                you from logging in to the member portal and accessing gated content.
              </p>
            </div>

            {/* 5. Updates */}
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                5. Updates to This Policy
              </h2>
              <p className="text-gray-600 leading-relaxed">
                We may update this Cookie Policy periodically as we add or remove cookies and
                tracking services. The &ldquo;Last updated&rdquo; date at the top of this page reflects the
                most recent revision. We recommend checking back periodically. If you have questions
                about our use of cookies, please contact us via our{' '}
                <Link href="/legal/privacy" className="text-brand-accent underline hover:no-underline">
                  Privacy Policy
                </Link>{' '}
                contact details.
              </p>
            </div>

          </motion.div>
        </div>
      </section>
    </>
  )
}
