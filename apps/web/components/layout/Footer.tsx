import Link from 'next/link'
import Image from 'next/image'

const footerLinks = {
  services: {
    label: 'Services',
    links: [
      { label: 'Private Sessions', href: '/services' },
      { label: 'Group Coaching', href: '/services' },
      { label: 'Executive Coaching', href: '/services' },
      { label: 'Corporate Programs', href: '/services' },
    ],
  },
  programs: {
    label: 'Programs',
    links: [
      { label: 'Guided Programmes', href: '/programs' },
      { label: 'Online Courses', href: '/programs' },
      { label: 'Masterclass', href: '/programs' },
      { label: 'Workshops', href: '/programs' },
    ],
  },
  company: {
    label: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Blog', href: '/blog' },
      { label: 'Media', href: '/about' },
      { label: 'Contact', href: '/contact' },
    ],
  },
  legal: {
    label: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Cookie Policy', href: '/cookies' },
    ],
  },
}

const credentials = [
  'ICF Member',
  'CTAA Accredited',
  'ISO 9001 Certified',
  'B.Msc. M.Msc. Msc.D.',
]

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-brand-primary text-white" role="contentinfo">

      {/* Main footer grid */}
      <div className="max-w-7xl mx-auto px-4 pt-16 pb-10">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-6">

          {/* Brand column — spans 2 cols on lg */}
          <div className="lg:col-span-2">
            <Link href="/" aria-label="Dr. Suzanne Ravenall — return to homepage">
              <Image
                src="/logos/suzanne-white-logo.png"
                alt="Dr. Suzanne Ravenall"
                width={160}
                height={49}
              />
            </Link>
            <p className="mt-4 text-sm text-white/70 leading-relaxed max-w-xs">
              Helping high-performers unlock their most extraordinary self through
              Rapid Repatterning® and Neuro-repatterning® methodology.
            </p>

            {/* Credentials */}
            <ul className="mt-6 flex flex-wrap gap-2" aria-label="Professional credentials">
              {credentials.map((cred) => (
                <li
                  key={cred}
                  className="px-2.5 py-1 text-xs font-medium text-white/80 border border-white/20 rounded-sm"
                >
                  {cred}
                </li>
              ))}
            </ul>

            {/* Social icons */}
            <ul className="mt-6 flex items-center gap-4 list-none" aria-label="Social media links">
              <li><SocialLink href="https://facebook.com" label="Facebook"><FacebookIcon /></SocialLink></li>
              <li><SocialLink href="https://instagram.com" label="Instagram"><InstagramIcon /></SocialLink></li>
              <li><SocialLink href="https://linkedin.com" label="LinkedIn"><LinkedInIcon /></SocialLink></li>
              <li><SocialLink href="https://youtube.com" label="YouTube"><YouTubeIcon /></SocialLink></li>
            </ul>
          </div>

          {/* Link columns */}
          {Object.values(footerLinks).map((col) => (
            <div key={col.label}>
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
                {col.label}
              </h3>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/70 hover:text-white transition-colors duration-150"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <p className="text-xs text-white/50">
            &copy; {year} Dr. Suzanne Ravenall. All rights reserved.
          </p>
          <p className="text-xs text-white/50">
            Built by{' '}
            <a
              href="https://aidynamicadvisory.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white/80 transition-colors duration-150 underline underline-offset-2"
            >
              Ai Dynamic Advisory
            </a>
          </p>
        </div>
      </div>

    </footer>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface SocialLinkProps {
  href: string
  label: string
  children: React.ReactNode
}

function SocialLink({ href, label, children }: SocialLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="text-white/60 hover:text-white transition-colors duration-150"
    >
      {children}
    </a>
  )
}

function FacebookIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  )
}

function InstagramIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  )
}

function LinkedInIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  )
}

function YouTubeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.96-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
      <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="white" />
    </svg>
  )
}
