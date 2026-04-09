import type { Metadata } from 'next'
import { Poppins } from 'next/font/google'
import Script from 'next/script'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import './globals.css'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['200', '400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Dr. Suzanne Ravenall',
    template: '%s | Dr. Suzanne Ravenall',
  },
  description: 'Coaching and professional development with Dr. Suzanne Ravenall.',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ??
      (process.env.NODE_ENV === 'production'
        ? 'https://suzanneravenall.com'
        : 'http://localhost:3000')
  ),
}

// Validate analytics IDs to prevent injection if env vars are ever compromised.
// GA4 IDs must be G- followed by alphanumeric characters.
// Clarity IDs must be lowercase alphanumeric.
const GA_ID_PATTERN = /^G-[A-Z0-9]+$/
const CLARITY_ID_PATTERN = /^[a-z0-9]+$/

const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? ''
const clarityId = process.env.NEXT_PUBLIC_CLARITY_ID ?? ''

const safeGaId = GA_ID_PATTERN.test(gaId) ? gaId : ''
const safeClarityId = CLARITY_ID_PATTERN.test(clarityId) ? clarityId : ''

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={poppins.variable}>
      <body className="font-sans antialiased">
        {/* Skip link — visible on focus for keyboard users, hidden visually otherwise */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-4 focus:left-4 focus:px-4 focus:py-2 focus:bg-brand-accent focus:text-white focus:rounded-button focus:font-medium focus:text-sm"
        >
          Skip to main content
        </a>
        <Header />
        {/* tabIndex={-1} allows the skip link to programmatically move focus here (WCAG 2.4.1) */}
        <main id="main-content" tabIndex={-1} className="outline-none">{children}</main>
        <Footer />

        {/* GA4 — placeholder measurement ID, confirm with Suzanne before going live */}
        {safeGaId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${safeGaId}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${safeGaId}');
              `}
            </Script>
          </>
        )}

        {/* Microsoft Clarity — placeholder ID, confirm with Suzanne before going live */}
        {safeClarityId && (
          <Script id="clarity-init" strategy="afterInteractive">
            {`
              (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "${safeClarityId}");
            `}
          </Script>
        )}
      </body>
    </html>
  )
}
