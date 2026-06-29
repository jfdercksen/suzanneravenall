"use client"

import { motion } from 'framer-motion'

const LAST_UPDATED = '12 May 2026'

export default function LegalTermsContent() {
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
              Terms of Service
            </h1>
            <p className="text-gray-300 text-sm">Last updated: {LAST_UPDATED}</p>
            <p className="text-gray-300 text-sm mt-1">
              Governing law: Republic of South Africa
            </p>
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

            {/* 1. Acceptance */}
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                1. Acceptance of Terms
              </h2>
              {/* TODO (legal review): Confirm whether click-wrap acceptance (checkbox at checkout) is required in addition to browse-wrap — South African ECT Act Section 22 governs contract formation */}
              <p className="text-gray-600 leading-relaxed">
                By accessing or using the website at <strong>suzanneravenall.com</strong> (&ldquo;the Site&rdquo;)
                or purchasing any service offered by Dr. Suzanne Ravenall (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;),
                you agree to be bound by these Terms of Service (&ldquo;Terms&rdquo;). If you do not agree, you
                must not use the Site or purchase any services.
              </p>
              <p className="text-gray-600 leading-relaxed mt-3">
                These Terms constitute a binding agreement between you and Dr. Suzanne Ravenall in
                accordance with the Electronic Communications and Transactions Act 25 of 2002 (&ldquo;ECT Act&rdquo;).
              </p>
            </div>

            {/* 2. Services */}
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                2. Services Offered
              </h2>
              {/* TODO (legal review): Enumerate each service category with a clear description — coaching, programmes, masterclasses, memberships, assessments, etc. */}
              <p className="text-gray-600 leading-relaxed mb-3">
                We offer a range of personal transformation services including, but not limited to:
              </p>
              <ul className="list-disc list-outside pl-6 space-y-2 text-gray-600">
                <li>One-on-one and group transformational coaching sessions</li>
                <li>Digital programmes and masterclasses</li>
                <li>Membership portals with gated resources and video content</li>
                <li>Downloadable resources and assessments</li>
                <li>Online community access via our Discourse forum</li>
                <li>In-person workshops and speaking engagements (where scheduled)</li>
              </ul>
              <p className="text-gray-600 leading-relaxed mt-3">
                All services are subject to availability and may be modified or discontinued at any time
                with reasonable notice.
              </p>
            </div>

            {/* 3. Accounts */}
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                3. User Accounts and Memberships
              </h2>
              {/* TODO (legal review): Define membership tier entitlements and cancellation rights — Consumer Protection Act 68 of 2008 Section 17 grants a 5-day cooling-off right for direct marketing */}
              <p className="text-gray-600 leading-relaxed mb-3">
                To access gated content or purchase services, you must create an account. You are
                responsible for:
              </p>
              <ul className="list-disc list-outside pl-6 space-y-2 text-gray-600">
                <li>Maintaining the confidentiality of your login credentials</li>
                <li>All activity that occurs under your account</li>
                <li>Notifying us immediately of any unauthorised use of your account</li>
              </ul>
              <p className="text-gray-600 leading-relaxed mt-3">
                Memberships are personal and non-transferable. Sharing account credentials with third
                parties is strictly prohibited and may result in immediate termination of your account.
              </p>
            </div>

            {/* 4. Payment */}
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                4. Payment Terms and Refund Policy
              </h2>
              {/* TODO (legal review): Define specific refund windows per service type — digital content vs. coaching sessions vs. memberships. Align with Consumer Protection Act CPA Section 17 and 56 */}
              <p className="text-gray-600 leading-relaxed mb-3">
                All prices are displayed in South African Rand (ZAR) or as specified at checkout,
                inclusive of VAT where applicable.
              </p>
              <p className="text-gray-600 leading-relaxed mb-3">
                Payment is processed via PayFast (South Africa) or PayPal (international). We do not
                store your payment card details.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Refund requests must be submitted within the period specified at the point of purchase.
                Digital programmes and downloadable content are generally non-refundable once accessed.
                Coaching session cancellations are subject to our cancellation policy communicated at
                the time of booking. We reserve the right to assess refund requests on a case-by-case basis.
              </p>
            </div>

            {/* 5. IP */}
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                5. Intellectual Property
              </h2>
              {/* TODO (legal review): Confirm IP ownership — distinguish between owned content and licensed third-party content (e.g. Resonance Repatterning) */}
              <p className="text-gray-600 leading-relaxed">
                All content on this Site — including text, graphics, logos, images, audio, video,
                programme materials, and software — is the property of Dr. Suzanne Ravenall or her
                licensors and is protected by South African copyright law and international treaties.
                You may not reproduce, distribute, modify, or create derivative works from any content
                without our express written consent. Purchase of a programme grants a limited,
                non-exclusive, non-transferable licence to access that content for personal use only.
              </p>
            </div>

            {/* 6. Prohibited */}
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                6. Prohibited Uses
              </h2>
              {/* TODO (legal review): Expand as appropriate — add any jurisdiction-specific prohibited uses */}
              <p className="text-gray-600 leading-relaxed mb-3">You agree not to:</p>
              <ul className="list-disc list-outside pl-6 space-y-2 text-gray-600">
                <li>Use the Site for any unlawful purpose or in violation of these Terms</li>
                <li>Attempt to gain unauthorised access to any part of the Site or its systems</li>
                <li>Transmit any harmful, offensive, or disruptive content</li>
                <li>Share, resell, or distribute paid programme content without authorisation</li>
                <li>Use automated tools (bots, scrapers) to harvest content or data</li>
                <li>Impersonate any person or entity</li>
                <li>Interfere with other users&rsquo; enjoyment of the services</li>
              </ul>
            </div>

            {/* 7. Disclaimer */}
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                7. Disclaimer of Warranties
              </h2>
              {/* TODO (legal review): Ensure disclaimer language is enforceable under the Consumer Protection Act — CPA does not permit full exclusion of implied warranties for consumers */}
              <p className="text-gray-600 leading-relaxed">
                The Site and services are provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis.
                To the maximum extent permitted by law, we disclaim all warranties, express or implied,
                including warranties of merchantability, fitness for a particular purpose, and
                non-infringement. Coaching and personal development services are not a substitute for
                professional medical, psychological, or therapeutic advice. Results vary and are not
                guaranteed.
              </p>
            </div>

            {/* 8. Liability */}
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                8. Limitation of Liability
              </h2>
              {/* TODO (legal review): Under the Consumer Protection Act, liability cannot be excluded for death or personal injury caused by negligence — ensure this carve-out is included */}
              <p className="text-gray-600 leading-relaxed">
                To the fullest extent permitted by applicable law, Dr. Suzanne Ravenall shall not be
                liable for any indirect, incidental, special, consequential, or punitive damages arising
                from your use of, or inability to use, the Site or services. Our total liability to you
                in connection with any claim arising under these Terms shall not exceed the amount you
                paid to us in the three months preceding the claim.
              </p>
            </div>

            {/* 9. Indemnification */}
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                9. Indemnification
              </h2>
              {/* TODO (legal review): Review enforceability of indemnification clauses under South African law */}
              <p className="text-gray-600 leading-relaxed">
                You agree to indemnify and hold harmless Dr. Suzanne Ravenall and her affiliates,
                employees, and contractors from any claim, loss, liability, or expense (including legal
                fees) arising from your breach of these Terms or misuse of the Site or services.
              </p>
            </div>

            {/* 10. Termination */}
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                10. Termination
              </h2>
              {/* TODO (legal review): Define notice periods and data handling on termination — align with POPIA retention obligations */}
              <p className="text-gray-600 leading-relaxed">
                We reserve the right to suspend or terminate your account and access to services at
                any time, with or without notice, if we believe you have violated these Terms or engaged
                in conduct that is harmful to us, other users, or third parties. You may close your
                account at any time by contacting us. Termination does not affect any rights or
                obligations that accrued prior to termination.
              </p>
            </div>

            {/* 11. Governing Law */}
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                11. Governing Law and Jurisdiction
              </h2>
              {/* TODO (legal review): Confirm preferred jurisdiction and whether an arbitration or mediation clause is desired */}
              <p className="text-gray-600 leading-relaxed">
                These Terms are governed by and construed in accordance with the laws of the Republic
                of South Africa. Any dispute arising out of or in connection with these Terms shall be
                subject to the exclusive jurisdiction of the South African courts. For minor consumer
                disputes, you may also approach the National Consumer Commission or a relevant
                Ombud with jurisdiction.
              </p>
            </div>

            {/* 12. Contact */}
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                12. Contact
              </h2>
              {/* TODO (legal review): Confirm the designated contact for legal notices — ECT Act Section 43 requires website operators to publish contact details */}
              <p className="text-gray-600 leading-relaxed">
                For questions about these Terms, contact us at:
              </p>
              <div className="mt-4 bg-gray-50 rounded-xl p-6 border border-gray-100">
                <p className="text-gray-700 font-medium">Dr. Suzanne Ravenall</p>
                <p className="text-gray-600">
                  Email:{' '}
                  <a href="mailto:hello@suzanneravenall.com" className="text-brand-accent underline hover:no-underline">
                    hello@suzanneravenall.com
                  </a>
                </p>
                {/* TODO: Add physical address — required under ECT Act Section 43(1)(a) */}
              </div>
            </div>

          </motion.div>
        </div>
      </section>
    </>
  )
}
