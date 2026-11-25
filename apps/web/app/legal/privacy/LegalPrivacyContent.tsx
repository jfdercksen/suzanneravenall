"use client"

import { motion } from 'framer-motion'
import Link from 'next/link'
import { LIVE_TRAINING_PRIVACY } from '@/lib/legal/booking-terms'

const LAST_UPDATED = '25 November 2026'

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
            <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent-400 mb-4">
              Legal
            </p>
            <h1 className="text-4xl lg:text-6xl font-medium tracking-tight text-white mb-6">
              Privacy Notice
            </h1>
            <p className="text-white/70 text-sm">Last updated: {LAST_UPDATED}</p>
            <p className="text-white/70 text-sm mt-1">
              Governing law: Protection of Personal Information Act 4 of 2013 (POPIA), South Africa
            </p>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="py-20 lg:py-32 bg-brand-cream">
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
              <h2 className="text-2xl font-medium text-brand-primary mb-4">
                1. Introduction &amp; Identity of the Responsible Party
              </h2>
              {/* Legal entity and registration number: https://suzanneravenall.com/terms-and-conditions/ (opening paragraph and clause 16) */}
              <p className="text-brand-ink leading-relaxed mb-3">
                The Ravenall Institute Pty Ltd (registration number 2012/180720/07) (&ldquo;we&rdquo;,
                &ldquo;us&rdquo;, or &ldquo;our&rdquo;) operates the website at{' '}
                <strong>suzanneravenall.com</strong>, one of its brands, and is the Responsible Party as
                defined under the Protection of Personal Information Act 4 of 2013 (&ldquo;POPIA&rdquo;).
              </p>
              <p className="text-brand-ink leading-relaxed mb-3">
                This Privacy Notice explains how we collect, use, share, and protect personal information
                you provide to us, and outlines your rights as a data subject.
              </p>
              {/* Her current Privacy Policy, opening paragraph (A4, 25 Nov 2026) */}
              <p className="text-brand-ink leading-relaxed">
                Across all Ravenall Institute platforms and associated websites, including the
                Effectiveness Company, NCCBM Global, Human Performance Replicator, Repatterning and
                SuzanneRavenall.com, we are committed to protecting your privacy and to ensure that your
                personal information is collected and used properly, lawfully and transparently.
              </p>
            </div>

            {/* 2. What We Collect */}
            <div>
              <h2 className="text-2xl font-medium text-brand-primary mb-4">
                2. What Information We Collect
              </h2>
              {/* TODO (legal review): Confirm the complete list of data fields actually collected: cross-check against Supabase schema and form implementations */}
              <p className="text-brand-ink leading-relaxed mb-3">We may collect the following categories of personal information:</p>
              <ul className="list-disc list-outside pl-6 space-y-2 text-brand-ink">
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
              <h2 className="text-2xl font-medium text-brand-primary mb-4">
                3. Purpose of Processing (POPIA Section 13 Basis)
              </h2>
              {/* TODO (legal review): Verify each processing purpose against POPIA Section 11 grounds: ensure consent, legitimate interest, or contract basis is documented for each */}
              {/* Her current Privacy Policy, "How we use your information" (A4, 25 Nov 2026) */}
              <p className="text-brand-ink leading-relaxed mb-3">
                We will use your personal information only for the purposes for which it was collected.
                In addition, where necessary your information may be retained for legal or research purposes.
              </p>
              <p className="text-brand-ink leading-relaxed mb-3">We process personal information for the following purposes:</p>
              <ul className="list-disc list-outside pl-6 space-y-2 text-brand-ink">
                <li>To gather contact information</li>
                <li>To confirm and verify your identity or to verify that you are an authorized user for security purposes</li>
                <li>For the detection and prevention of fraud, crime, money laundering or other malpractice</li>
                <li>To conduct market or customer satisfaction research or for statistical analysis</li>
                <li>For audit and record keeping purposes</li>
                <li>In connection with legal proceedings</li>
                <li>To create and manage your member account</li>
                <li>To process payments for programmes, products, and memberships</li>
                <li>To deliver digital content, resources, and coaching services you have purchased</li>
                <li>To send transactional communications (booking confirmations, invoices, receipts)</li>
                <li>To send marketing communications, only with your explicit consent</li>
                <li>To comply with legal obligations (tax, accounting, regulatory requirements)</li>
                <li>To improve our website and services through analytics</li>
              </ul>
            </div>

            {/* 4. Sharing */}
            <div>
              <h2 className="text-2xl font-medium text-brand-primary mb-4">
                4. Sharing of Information
              </h2>
              {/* TODO (legal review): Confirm the complete list of third-party processors and add Data Processing Agreements (DPAs) for each */}
              <p className="text-brand-ink leading-relaxed mb-3">
                We do not sell your personal information. We may share it with trusted third parties only
                where necessary:
              </p>
              <ul className="list-disc list-outside pl-6 space-y-2 text-brand-ink">
                {/* The providers the code uses (audit 18 Nov 2026). A hosting country is named only where the
                    repo proves it: the website server is cloud.co.za, South Africa (infra/DEPLOYMENT.md), and the
                    self-hosted tools below run on it (infra/docker-compose.yml). Every other country is for
                    Johan to confirm (KNOWN_ISSUES KI122). */}
                <li>
                  <strong>cloud.co.za</strong>: hosts our website server in South Africa, where the shop
                  (Medusa), website content and intake forms (Payload), site search (Meilisearch) and our
                  workflow automation (n8n, being retired) run
                </li>
                <li>
                  <strong>Supabase</strong> (run on our own database server): member accounts and sign-in,
                  form submissions, quiz answers and intake forms
                </li>
                <li>
                  <strong>PayFast / PayPal</strong>: payment processing
                </li>
                <li>
                  <strong>Brevo</strong>: email delivery, including the email that sends your completed
                  diagnostic or intake form answers to our team
                </li>
                <li>
                  <strong>Thinkific</strong>: online courses
                </li>
                <li>
                  <strong>Bunny Stream</strong>: video content delivery
                </li>
                <li>
                  <strong>Cal.com</strong>: appointment scheduling
                </li>
                <li>
                  <strong>Zoom</strong>: online sessions
                </li>
                <li>
                  <strong>Vtiger CRM</strong>: client relationship management
                </li>
                <li>
                  <strong>Sage Business Cloud</strong>: accounting and invoicing
                </li>
                <li>
                  <strong>Vibe Marketing</strong> (Ai Dynamic Advisory): marketing, only for people who
                  opt in to it
                </li>
                <li>
                  <strong>Google Analytics 4 &amp; Microsoft Clarity</strong>: website analytics
                </li>
                <li>
                  <strong>Sentry</strong>: error monitoring
                </li>
                <li>
                  <strong>Backblaze B2</strong>: database backups
                </li>
                <li>
                  <strong>DB-IP</strong>: a country database we keep on our own server to show
                  prices in rand in South Africa and in US dollars elsewhere. Your IP address is
                  looked up there and is not sent to DB-IP or anyone else.{' '}
                  <a href="https://db-ip.com" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
                    IP Geolocation by DB-IP
                  </a>
                </li>
                <li>Regulatory authorities, where required by law</li>
              </ul>
              {/* Her current Privacy Policy, "Disclosure of information" (A4, 25 Nov 2026). Her sentence that
                  agreements are in place with every service provider is held back until Johan confirms it. */}
              <p className="text-brand-ink leading-relaxed mt-4 mb-3">We may also disclose your information:</p>
              <ul className="list-disc list-outside pl-6 space-y-2 text-brand-ink">
                <li>Where we have a duty or a right to disclose in terms of law or industry codes;</li>
                <li>Where we believe it is necessary to protect our rights.</li>
              </ul>
            </div>

            {/* 5. Your Rights */}
            <div>
              <h2 className="text-2xl font-medium text-brand-primary mb-4">
                5. Your Rights as a Data Subject (POPIA Chapter 2)
              </h2>
              {/* TODO (legal review): Confirm the process and response timeframes for exercising each right: POPIA requires response within 30 days */}
              <p className="text-brand-ink leading-relaxed mb-3">Under POPIA you have the right to:</p>
              <ul className="list-disc list-outside pl-6 space-y-2 text-brand-ink">
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
              {/* Her current Privacy Policy, "Your Rights" and "How to contact us" (A4, 25 Nov 2026): support@ */}
              <p className="text-brand-ink leading-relaxed mt-4">
                To exercise any of these rights, contact us at{' '}
                <a href="mailto:support@ravenallinstitute.com" className="text-brand-accent underline hover:no-underline">
                  support@ravenallinstitute.com
                </a>
                . We will respond within 30 days.
              </p>
              <p className="text-brand-ink leading-relaxed mt-3">
                We will need a copy of your ID document to confirm your identity before providing details
                of your personal information, or before making changes to personal information we may hold
                about you. Please note that any such access request may be subject to a payment of a
                legally allowable fee. We would appreciate it if you would keep your personal information
                accurate.
              </p>
            </div>

            {/* 6. Retention */}
            <div>
              <h2 className="text-2xl font-medium text-brand-primary mb-4">
                6. Retention Period
              </h2>
              {/* TODO (legal review): Define specific retention periods for each data category: align with South African tax law (5 years for financial records) and POPIA minimisation principle */}
              <p className="text-brand-ink leading-relaxed">
                We retain personal information only for as long as necessary to fulfil the purposes for
                which it was collected, or as required by law. Financial transaction records are retained
                for a minimum of five years in compliance with South African tax legislation. Account
                data is retained for the duration of your membership plus a reasonable period thereafter
                to resolve disputes.
              </p>
            </div>

            {/* 7. Security */}
            <div>
              <h2 className="text-2xl font-medium text-brand-primary mb-4">
                7. Security Measures
              </h2>
              {/* TODO (legal review / security audit): Confirm technical and organisational measures before go-live: include encryption at rest, TLS, access controls, audit logging */}
              <p className="text-brand-ink leading-relaxed">
                We implement appropriate technical and organisational measures to protect your personal
                information against unauthorised access, disclosure, alteration, and destruction. These
                include TLS encryption for data in transit, encrypted storage, role-based access controls,
                and regular security reviews. No transmission over the internet is 100% secure. If you
                believe your information has been compromised, please contact us immediately.
              </p>
              {/* Her current Privacy Policy, "Information Security" (A4, 25 Nov 2026) */}
              <p className="text-brand-ink leading-relaxed mt-3 mb-3">Our security policies and procedures cover:</p>
              <ul className="list-disc list-outside pl-6 space-y-1 text-brand-ink">
                <li>Physical security</li>
                <li>Computer and network security</li>
                <li>Access to personal information</li>
                <li>Secure communications</li>
                <li>Security in contracting out activities or functions</li>
                <li>Retention and disposal of information</li>
                <li>Acceptable usage of personal information</li>
                <li>Governance and regulatory issues</li>
                <li>Monitoring access and usage of private information</li>
                <li>Investigating and reacting to security incidents</li>
              </ul>
              <p className="text-brand-ink leading-relaxed mt-3">
                When we contract with third parties, we impose appropriate security, privacy and
                confidentiality obligations on them to ensure that personal information that we remain
                responsible for, is kept secure. We will ensure that anyone to whom we pass your personal
                information agrees to treat your information with the same level of protection as we are
                obliged to.
              </p>
            </div>

            {/* 7A. Live training programmes: her current Privacy Policy, word for word (A4, 25 Nov 2026) */}
            <div id="live-training">
              <h2 className="text-2xl font-medium text-brand-primary mb-4">
                7A. Live Training Programmes
              </h2>
              <p className="text-brand-ink leading-relaxed">
                {LIVE_TRAINING_PRIVACY} See also our{' '}
                <Link href="/legal/terms#live-programs" className="text-brand-accent underline hover:no-underline">
                  Terms and Conditions
                </Link>
                .
              </p>
            </div>

            {/* 8. Cookies */}
            <div>
              <h2 className="text-2xl font-medium text-brand-primary mb-4">
                8. Cookies
              </h2>
              <p className="text-brand-ink leading-relaxed">
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
              <h2 className="text-2xl font-medium text-brand-primary mb-4">
                9. Contact the Information Officer
              </h2>
              {/* TODO (legal review): Register the Information Officer with the Information Regulator if not yet done: required under POPIA for all Responsible Parties */}
              <p className="text-brand-ink leading-relaxed">
                Our designated Information Officer is responsible for ensuring compliance with POPIA.
                For privacy-related enquiries, requests, or complaints:
              </p>
              <div className="mt-4 bg-brand-sand rounded-xl p-6 border border-brand-border">
                <p className="text-brand-ink font-medium">Information Officer</p>
                {/* Confirmed by Suzanne, as Information Officer of The Ravenall Institute (Pty) Ltd, in her
                    mail to the website developers of 8 Nov 2026. */}
                <p className="text-brand-ink mt-1">Dr. Suzanne Ravenall, Information Officer</p>
                <p className="text-brand-ink">The Ravenall Institute Pty Ltd</p>
                <p className="text-brand-ink">
                  Email:{' '}
                  <a href="mailto:admin@ravenallinstitute.com" className="text-brand-accent underline hover:no-underline">
                    admin@ravenallinstitute.com
                  </a>
                </p>
                {/* Suzanne, 24 Nov 2026: "use the box address". As in her mail signature (A2). */}
                <p className="text-brand-ink">Postal address: PO Box 910, Kyalami, Midrand, Johannesburg, South Africa, 1685</p>
              </div>
            </div>

            {/* 10. Complaints */}
            <div>
              <h2 className="text-2xl font-medium text-brand-primary mb-4">
                10. Complaints to the Information Regulator
              </h2>
              <p className="text-brand-ink leading-relaxed">
                If you are not satisfied with our response to your privacy complaint, you have the right
                to lodge a complaint with the Information Regulator of South Africa:
              </p>
              <div className="mt-4 bg-brand-sand rounded-xl p-6 border border-brand-border space-y-1">
                <p className="text-brand-ink font-medium">The Information Regulator (South Africa)</p>
                <p className="text-brand-ink">JD House, 27 Stiemens Street, Braamfontein, Johannesburg, 2001</p>
                <p className="text-brand-ink">
                  Email:{' '}
                  <a href="mailto:inforeg@justice.gov.za" className="text-brand-accent underline hover:no-underline">
                    inforeg@justice.gov.za
                  </a>
                </p>
                <p className="text-brand-ink">
                  Website:{' '}
                  <a href="https://www.justice.gov.za/inforeg/" target="_blank" rel="noopener noreferrer" className="text-brand-accent underline hover:no-underline">
                    www.justice.gov.za/inforeg
                  </a>
                </p>
              </div>
            </div>

            {/* 11. Changes */}
            <div>
              <h2 className="text-2xl font-medium text-brand-primary mb-4">
                11. Changes to this Policy
              </h2>
              <p className="text-brand-ink leading-relaxed">
                We may update this Privacy Notice from time to time to reflect changes in our practices
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
