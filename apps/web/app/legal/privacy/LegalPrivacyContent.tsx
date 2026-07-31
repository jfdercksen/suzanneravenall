"use client"

import { motion } from 'framer-motion'
import Link from 'next/link'

const LAST_UPDATED = '12 May 2026'

export default function LegalPrivacyContent() {
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
              Privacy Policy
            </h1>
            <p className="text-gray-300 text-sm">Last updated: {LAST_UPDATED}</p>
            <p className="text-gray-300 text-sm mt-1">
              Governing law: Protection of Personal Information Act 4 of 2013 (POPIA), South Africa
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

            {/* 1. Introduction */}
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                1. Introduction &amp; Identity of the Responsible Party
              </h2>
              {/* TODO (legal review): Confirm full legal name of the responsible party, registered address, and registration number if applicable */}
              <p className="text-gray-600 leading-relaxed mb-3">
                Dr. Suzanne Ravenall (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) operates the website at{' '}
                <strong>suzanneravenall.com</strong> and is the Responsible Party as defined under the
                Protection of Personal Information Act 4 of 2013 (&ldquo;POPIA&rdquo;).
              </p>
              <p className="text-gray-600 leading-relaxed">
                This Privacy Policy explains how we collect, use, share, and protect personal information
                you provide to us, and outlines your rights as a data subject.
              </p>
            </div>

            {/* 2. What We Collect */}
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                2. What Information We Collect
              </h2>
              {/* TODO (legal review): Confirm the complete list of data fields actually collected — cross-check against Supabase schema and form implementations */}
              <p className="text-gray-600 leading-relaxed mb-3">We may collect the following categories of personal information:</p>
              <ul className="list-disc list-outside pl-6 space-y-2 text-gray-600">
                <li>
                  <strong>Identity data:</strong> first name, last name, title, date of birth (where provided)
                </li>
                <li>
                  <strong>Contact data:</strong> email address, telephone number, postal address
                </li>
                <li>
                  <strong>Account data:</strong> username, password (stored as a salted hash, never in plain text), membership tier, purchase history
                </li>
                <li>
                  <strong>Payment data:</strong> transaction references and payment status (we do not store full card numbers; these are handled by PayFast and PayPal)
                </li>
                <li>
                  <strong>Usage data:</strong> pages visited, session duration, browser type, IP address, referring URL
                </li>
                <li>
                  <strong>Cookie data:</strong> see our <Link href="/legal/cookies" className="text-brand-accent underline hover:no-underline">Cookie Policy</Link>
                </li>
                <li>
                  <strong>Communications:</strong> email correspondence, contact form submissions, coaching notes (where applicable)
                </li>
              </ul>
            </div>

            {/* 3. Purpose of Processing */}
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                3. Purpose of Processing (POPIA Section 13 Basis)
              </h2>
              {/* TODO (legal review): Verify each processing purpose against POPIA Section 11 grounds — ensure consent, legitimate interest, or contract basis is documented for each */}
              <p className="text-gray-600 leading-relaxed mb-3">We process personal information for the following purposes:</p>
              <ul className="list-disc list-outside pl-6 space-y-2 text-gray-600">
                <li>To create and manage your member account</li>
                <li>To process payments for programmes, products, and memberships</li>
                <li>To deliver digital content, resources, and coaching services you have purchased</li>
                <li>To send transactional communications (booking confirmations, invoices, receipts)</li>
                <li>To send marketing communications, only with your explicit consent</li>
                <li>To comply with legal obligations (tax, accounting, regulatory requirements)</li>
                <li>To improve our website and services through analytics</li>
                <li>To protect against fraud and unauthorised access</li>
              </ul>
            </div>

            {/* 4. Sharing */}
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                4. Sharing of Information
              </h2>
              {/* TODO (legal review): Confirm the complete list of third-party processors and add Data Processing Agreements (DPAs) for each */}
              <p className="text-gray-600 leading-relaxed mb-3">
                We do not sell your personal information. We may share it with trusted third parties only
                where necessary:
              </p>
              <ul className="list-disc list-outside pl-6 space-y-2 text-gray-600">
                <li>
                  <strong>Supabase</strong>: database and authentication hosting
                </li>
                <li>
                  <strong>PayFast / PayPal</strong>: payment processing
                </li>
                <li>
                  <strong>Resend</strong>: transactional email delivery
                </li>
                <li>
                  <strong>Bunny CDN / Bunny Stream</strong>: video content delivery
                </li>
                <li>
                  <strong>Google Analytics 4 &amp; Microsoft Clarity</strong>: website analytics
                </li>
                <li>
                  <strong>Sage Business Cloud</strong>: accounting and invoicing
                </li>
                <li>
                  <strong>Vtiger CRM</strong>: client relationship management
                </li>
                <li>
                  <strong>Cal.com</strong>: appointment scheduling
                </li>
                <li>Regulatory authorities, where required by law</li>
              </ul>
            </div>

            {/* 5. Your Rights */}
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                5. Your Rights as a Data Subject (POPIA Chapter 2)
              </h2>
              {/* TODO (legal review): Confirm the process and response timeframes for exercising each right — POPIA requires response within 30 days */}
              <p className="text-gray-600 leading-relaxed mb-3">Under POPIA you have the right to:</p>
              <ul className="list-disc list-outside pl-6 space-y-2 text-gray-600">
                <li>
                  <strong>Access</strong>: request a copy of the personal information we hold about you
                </li>
                <li>
                  <strong>Correction</strong>: request that inaccurate information be corrected
                </li>
                <li>
                  <strong>Deletion</strong>: request that your personal information be deleted (subject to legal retention requirements)
                </li>
                <li>
                  <strong>Objection</strong>: object to the processing of your personal information
                </li>
                <li>
                  <strong>Withdraw consent</strong>: where processing is based on consent, withdraw it at any time without affecting the lawfulness of prior processing
                </li>
              </ul>
              <p className="text-gray-600 leading-relaxed mt-4">
                To exercise any of these rights, contact us at{' '}
                {/* TODO: Confirm official privacy contact email before go-live */}
                <a href="mailto:privacy@suzanneravenall.com" className="text-brand-accent underline hover:no-underline">
                  privacy@suzanneravenall.com
                </a>
                . We will respond within 30 days.
              </p>
            </div>

            {/* 6. Retention */}
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                6. Retention Period
              </h2>
              {/* TODO (legal review): Define specific retention periods for each data category — align with South African tax law (5 years for financial records) and POPIA minimisation principle */}
              <p className="text-gray-600 leading-relaxed">
                We retain personal information only for as long as necessary to fulfil the purposes for
                which it was collected, or as required by law. Financial transaction records are retained
                for a minimum of five years in compliance with South African tax legislation. Account
                data is retained for the duration of your membership plus a reasonable period thereafter
                to resolve disputes.
              </p>
            </div>

            {/* 7. Security */}
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                7. Security Measures
              </h2>
              {/* TODO (legal review / security audit): Confirm technical and organisational measures before go-live — include encryption at rest, TLS, access controls, audit logging */}
              <p className="text-gray-600 leading-relaxed">
                We implement appropriate technical and organisational measures to protect your personal
                information against unauthorised access, disclosure, alteration, and destruction. These
                include TLS encryption for data in transit, encrypted storage, role-based access controls,
                and regular security reviews. No transmission over the internet is 100% secure. If you
                believe your information has been compromised, please contact us immediately.
              </p>
            </div>

            {/* 8. Cookies */}
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                8. Cookies
              </h2>
              <p className="text-gray-600 leading-relaxed">
                We use cookies and similar tracking technologies on our website. For full details of the
                cookies we use and how to control them, please read our{' '}
                <Link href="/legal/cookies" className="text-brand-accent underline hover:no-underline">
                  Cookie Policy
                </Link>
                .
              </p>
            </div>

            {/* 9. Information Officer */}
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                9. Contact the Information Officer
              </h2>
              {/* TODO (legal review): Register the Information Officer with the Information Regulator if not yet done — required under POPIA for all Responsible Parties */}
              <p className="text-gray-600 leading-relaxed">
                Our designated Information Officer is responsible for ensuring compliance with POPIA.
                For privacy-related enquiries, requests, or complaints:
              </p>
              <div className="mt-4 bg-gray-50 rounded-xl p-6 border border-gray-100">
                <p className="text-gray-700 font-medium">Information Officer</p>
                {/* TODO: Insert full name of designated Information Officer */}
                <p className="text-gray-600 mt-1">Dr. Suzanne Ravenall</p>
                <p className="text-gray-600">
                  Email:{' '}
                  <a href="mailto:privacy@suzanneravenall.com" className="text-brand-accent underline hover:no-underline">
                    privacy@suzanneravenall.com
                  </a>
                </p>
                {/* TODO: Add physical address if required by POPIA */}
              </div>
            </div>

            {/* 10. Complaints */}
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                10. Complaints to the Information Regulator
              </h2>
              <p className="text-gray-600 leading-relaxed">
                If you are not satisfied with our response to your privacy complaint, you have the right
                to lodge a complaint with the Information Regulator of South Africa:
              </p>
              <div className="mt-4 bg-gray-50 rounded-xl p-6 border border-gray-100 space-y-1">
                <p className="text-gray-700 font-medium">The Information Regulator (South Africa)</p>
                <p className="text-gray-600">JD House, 27 Stiemens Street, Braamfontein, Johannesburg, 2001</p>
                <p className="text-gray-600">
                  Email:{' '}
                  <a href="mailto:inforeg@justice.gov.za" className="text-brand-accent underline hover:no-underline">
                    inforeg@justice.gov.za
                  </a>
                </p>
                <p className="text-gray-600">
                  Website:{' '}
                  <a href="https://www.justice.gov.za/inforeg/" target="_blank" rel="noopener noreferrer" className="text-brand-accent underline hover:no-underline">
                    www.justice.gov.za/inforeg
                  </a>
                </p>
              </div>
            </div>

            {/* 11. Changes */}
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                11. Changes to this Policy
              </h2>
              <p className="text-gray-600 leading-relaxed">
                We may update this Privacy Policy from time to time to reflect changes in our practices
                or applicable law. When we make material changes we will update the &ldquo;Last updated&rdquo; date
                at the top of this page. We encourage you to review this policy periodically. Continued
                use of our website after changes are published constitutes acceptance of the revised policy.
              </p>
            </div>

          </motion.div>
        </div>
      </section>
    </>
  )
}
