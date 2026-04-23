// @ts-check
import { withSentryConfig } from '@sentry/nextjs'

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,

  images: {
    remotePatterns: [
      {
        // Replace with exact Supabase project hostname before go-live
        // e.g. 'abcdefghijklmnop.supabase.co'
        protocol: 'https',
        hostname: 'your-project.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: '*.b-cdn.net',
        port: '',
        pathname: '/**',
      },
    ],
  },

  async redirects() {
    return [
      // ── WordPress core ──────────────────────────────────────────────────────
      { source: '/wp-admin',          destination: '/cms/admin', permanent: true },
      { source: '/wp-admin/:path*',   destination: '/cms/admin', permanent: true },
      { source: '/wp-login.php',      destination: '/cms/admin', permanent: true },
      { source: '/wp-json/:path*',    destination: '/',           permanent: true },
      { source: '/wp-content/:path*', destination: '/',           permanent: true },
      { source: '/feed',              destination: '/',           permanent: true },
      { source: '/feed/',             destination: '/',           permanent: true },
      { source: '/comments/feed',     destination: '/',           permanent: true },

      // ── Query-string WP patterns (/?p=123 etc.) ─────────────────────────────
      {
        source: '/',
        has: [{ type: 'query', key: 'p' }],
        destination: '/',
        permanent: true,
      },
      {
        source: '/',
        has: [{ type: 'query', key: 'page_id' }],
        destination: '/',
        permanent: true,
      },

      // ── Taxonomy patterns ───────────────────────────────────────────────────
      { source: '/category/:slug*',         destination: '/explore', permanent: true },
      { source: '/tag/:slug*',              destination: '/explore', permanent: true },
      { source: '/product-category/:slug*', destination: '/shop',    permanent: true },

      // ── Products ─────────────────────────────────────────────────────────────
      { source: '/product/:slug*', destination: '/shop', permanent: true },

      // ── Events ───────────────────────────────────────────────────────────────
      { source: '/events/:slug*',    destination: '/contact', permanent: true },
      { source: '/events-calendar',  destination: '/contact', permanent: true },
      { source: '/dates',            destination: '/contact', permanent: true },
      { source: '/dates-repository', destination: '/contact', permanent: true },

      // ── Slug-prefix patterns (covers all article/award/conference posts) ────
      { source: '/article-:slug*',    destination: '/blog',  permanent: true },
      { source: '/award-:slug*',      destination: '/about', permanent: true },
      { source: '/awards-:slug*',     destination: '/about', permanent: true },
      { source: '/conference-:slug*', destination: '/about', permanent: true },

      // ── WP pages → new routes ───────────────────────────────────────────────
      { source: '/home',        destination: '/', permanent: true },
      { source: '/test-page',   destination: '/', permanent: true },
      { source: '/testacuityapi', destination: '/', permanent: true },
      { source: '/affiliate-area', destination: '/', permanent: true },
      { source: '/unsubscribe', destination: '/', permanent: true },
      { source: '/masterclass-test-page', destination: '/', permanent: true },

      { source: '/about', destination: '/about', permanent: false },  // keep — no-op guard
      { source: '/contact', destination: '/contact', permanent: false },

      { source: '/what-i-do',                   destination: '/services', permanent: true },
      { source: '/speaking',                     destination: '/about',    permanent: true },
      { source: '/speaking-info',                destination: '/about',    permanent: true },
      { source: '/qualifications',               destination: '/about',    permanent: true },
      { source: '/media',                        destination: '/about',    permanent: true },
      { source: '/awards',                       destination: '/about',    permanent: true },
      { source: '/careers',                      destination: '/contact',  permanent: true },
      { source: '/privacy-policy',               destination: '/',         permanent: true },
      { source: '/disclaimer',                   destination: '/',         permanent: true },
      { source: '/terms-and-conditions',         destination: '/',         permanent: true },

      { source: '/blog-2',       destination: '/blog', permanent: true },
      { source: '/articles',     destination: '/blog', permanent: true },
      { source: '/newsletters',  destination: '/blog', permanent: true },
      { source: '/notices',      destination: '/blog', permanent: true },

      { source: '/programmes',              destination: '/services', permanent: true },
      { source: '/guided-programmes',       destination: '/services', permanent: true },
      { source: '/courses',                 destination: '/services', permanent: true },
      { source: '/assessments',             destination: '/services', permanent: true },
      { source: '/transformation-pathways', destination: '/services', permanent: true },
      { source: '/akashic',                 destination: '/services', permanent: true },
      { source: '/energy-clearing',         destination: '/services', permanent: true },
      { source: '/trauma-to-transcendance', destination: '/services', permanent: true },
      { source: '/masterclass2',            destination: '/services', permanent: true },
      { source: '/masterclass-register',    destination: '/services', permanent: true },
      { source: '/speaking-shop',           destination: '/shop',     permanent: true },

      // Services sub-pages
      { source: '/services/transformational-coaching',            destination: '/services', permanent: true },
      { source: '/services/true-transformation',                   destination: '/services', permanent: true },
      { source: '/services/akashic-coaching',                      destination: '/services', permanent: true },
      { source: '/services/rapid-repatterning',                    destination: '/services', permanent: true },
      { source: '/services/rapid-transformational-therapy',        destination: '/services', permanent: true },
      { source: '/services/masterclass/:path*',                    destination: '/services', permanent: true },
      { source: '/services/masterclass',                           destination: '/services', permanent: true },
      { source: '/services/private-sessions/:path*',               destination: '/services', permanent: true },
      { source: '/services/private-sessions',                      destination: '/services', permanent: true },
      { source: '/services/group-sessions/:path*',                 destination: '/services', permanent: true },
      { source: '/services/group-sessions',                        destination: '/services', permanent: true },

      // Programme landing pages (new slugs that were WP pages)
      { source: '/break-the-loop',                          destination: '/services', permanent: true },
      { source: '/reclaim-your-power',                      destination: '/services', permanent: true },
      { source: '/reinvent-your-life',                      destination: '/services', permanent: true },
      { source: '/upgrade-your-operating-system',           destination: '/services', permanent: true },
      { source: '/trauma-to-breakthrough',                  destination: '/services', permanent: true },
      { source: '/resilience-fortification',                destination: '/services', permanent: true },
      { source: '/pattern-mastery',                         destination: '/services', permanent: true },
      { source: '/children-young-people-foundations-for-life', destination: '/services', permanent: true },
      { source: '/emotional-mastery-for-young-minds',       destination: '/services', permanent: true },
      { source: '/pattern-foundations',                     destination: '/services', permanent: true },
      { source: '/inner-compass',                           destination: '/services', permanent: true },
      { source: '/emotional-nervous-system-mastery',        destination: '/services', permanent: true },
      { source: '/relationships-attachment-patterns',       destination: '/services', permanent: true },
      { source: '/health-energy-intelligence',              destination: '/services', permanent: true },
      { source: '/identity-purpose-activation',             destination: '/services', permanent: true },
      { source: '/leadership-high-performance',             destination: '/services', permanent: true },
      { source: '/life-transitions-reinvention',            destination: '/services', permanent: true },
      { source: '/intuition-as-patterned-intelligence',     destination: '/services', permanent: true },
      { source: '/next-level-health-vitality-longevity',    destination: '/services', permanent: true },

      // Member portal / account
      { source: '/my-account/:path*',             destination: '/portal',         permanent: true },
      { source: '/my-account',                    destination: '/portal',         permanent: true },
      { source: '/programmes/user-dashboard',     destination: '/portal',         permanent: true },
      { source: '/login-customizer',              destination: '/portal',         permanent: true },
      { source: '/my-acuity-bookings',            destination: '/portal',         permanent: true },
      { source: '/masterclass-viewing',           destination: '/portal/videos',  permanent: true },
      { source: '/masterclass-steps',             destination: '/portal',         permanent: true },
      { source: '/memberships',                   destination: '/portal',         permanent: true },

      // Commerce
      { source: '/basket',   destination: '/shop', permanent: true },
      { source: '/checkout', destination: '/shop', permanent: true },

      // Misc WP posts at root level → /services
      { source: '/trauma-to-transcendence',                        destination: '/services', permanent: true },
      { source: '/trauma-to-transcendence-2',                      destination: '/services', permanent: true },
      { source: '/love-relationships',                              destination: '/services', permanent: true },
      { source: '/love-relationships-session',                      destination: '/services', permanent: true },
      { source: '/being-a-great-boundry-setter-group-session',      destination: '/services', permanent: true },
      { source: '/be-an-energy-ninja-mastering-energy-for-an-abundant-life', destination: '/services', permanent: true },
      { source: '/energy-clearing-2',                               destination: '/services', permanent: true },
      { source: '/energy-clearing-clearing-others-advanced',        destination: '/services', permanent: true },
      { source: '/shedding-excess-weight',                          destination: '/services', permanent: true },
      { source: '/energetic-clearing',                              destination: '/services', permanent: true },
      { source: '/group-family-coaching',                           destination: '/services', permanent: true },
      { source: '/how-to-muscle-check',                             destination: '/services', permanent: true },
      { source: '/intuition-in-my-personal-capacity',               destination: '/services', permanent: true },
      { source: '/akashic-clearing',                                destination: '/services', permanent: true },
      { source: '/meditation',                                      destination: '/services', permanent: true },
      { source: '/mental-health',                                   destination: '/services', permanent: true },
      { source: '/resonance-repatterning-session',                  destination: '/services', permanent: true },
      { source: '/rapid-repatterning-2',                            destination: '/services', permanent: true },
      { source: '/rapid-repatterning-3',                            destination: '/services', permanent: true },
      { source: '/rapid-repatterning',                              destination: '/services', permanent: true },
      { source: '/resonance-repatterning',                          destination: '/services', permanent: true },
      { source: '/resonance-repatterning-08-principles-of-relationship',                      destination: '/services', permanent: true },
      { source: '/resonance-repatterning-09-energetics-of-relationship',                      destination: '/services', permanent: true },
      { source: '/resonance-repatterning-06-inner-cultivation-through-the-twelve-meridians',  destination: '/services', permanent: true },
      { source: '/mindfulness',                                     destination: '/services', permanent: true },
      { source: '/transformational-behavioural-coaching',           destination: '/services', permanent: true },
      { source: '/akashic-navigator',                               destination: '/services', permanent: true },
      { source: '/akashic-navigator-advanced',                      destination: '/services', permanent: true },
      { source: '/intuition-in-business',                           destination: '/services', permanent: true },
      { source: '/exploring-the-alpha-mind',                        destination: '/services', permanent: true },
      { source: '/finding-my-life-purpose',                         destination: '/services', permanent: true },

      // Misc WP posts at root level → /about
      { source: '/teacher',                                destination: '/about', permanent: true },
      { source: '/functional-integrative-medicine-practitioner', destination: '/about', permanent: true },
      { source: '/professional-speaker',                   destination: '/about', permanent: true },
      { source: '/consciousness-engineer',                 destination: '/about', permanent: true },
      { source: '/mediator',                               destination: '/about', permanent: true },
      { source: '/transformational-coach',                 destination: '/about', permanent: true },
      { source: '/top-performance-companies',              destination: '/about', permanent: true },
      { source: '/duplicated-programmes-582',              destination: '/services', permanent: true },
      { source: '/duplicated-duplicated-programmes-1730-3141', destination: '/services', permanent: true },

      // Misc WP posts at root level → /blog
      { source: '/embracing-our-ascension-journey',        destination: '/blog', permanent: true },
      { source: '/protecting-your-joy',                    destination: '/blog', permanent: true },
      { source: '/march-newsletter-the-power-of-letting-go', destination: '/blog', permanent: true },
      { source: '/become-an-energy-ninja',                 destination: '/blog', permanent: true },
      { source: '/getting-unstuck',                        destination: '/blog', permanent: true },
      { source: '/nice-or-not-nice-communication',         destination: '/blog', permanent: true },
      { source: '/second-time-around',                     destination: '/blog', permanent: true },
      { source: '/overcoming-the-need-to-fix-others',      destination: '/blog', permanent: true },
      { source: '/body-talk',                              destination: '/blog', permanent: true },
      { source: '/artile-making-things-happen',            destination: '/blog', permanent: true },
      { source: '/women-magazine-2',                       destination: '/blog', permanent: true },
      { source: '/blog-post-1',                            destination: '/blog', permanent: true },
      { source: '/achieving-work-life-balance-2',          destination: '/blog', permanent: true },
      { source: '/beyond-outsourcing-2-2',                 destination: '/blog', permanent: true },
      { source: '/recycling-my-soul',                      destination: '/blog', permanent: true },
      { source: '/creative-concepts',                      destination: '/blog', permanent: true },
      { source: '/conversations-with-my-brain',            destination: '/blog', permanent: true },

      // Newsletter posts with emoji slugs — source uses decoded characters
      // (Next.js matches against the decoded path)
      { source: '/november-newsletter-🌟embracing-the-power-within',                                    destination: '/blog', permanent: true },
      { source: '/april-newsletter-✨-be-a-champion-of-change',                                         destination: '/blog', permanent: true },
      { source: '/may-newsletter✨a-message-from-your-future-self',                                     destination: '/blog', permanent: true },
      { source: '/june-newsletter✨navigating-the-threshold-between-striving-and-surrender',            destination: '/blog', permanent: true },
      { source: '/july-newsletter✨riding-the-waves✨finding-calm-and-clarity-in-the-chaos',            destination: '/blog', permanent: true },
      { source: '/august-newsletter✨effortless-flow✨from-control-to-co-creation',                     destination: '/blog', permanent: true },
      { source: '/september-newsletter✨from-wounds-to-wisdom✨healing-family-patterns',                destination: '/blog', permanent: true },
      { source: '/october-newsletter✨the-art-of-inner-regulation✨neuro-mastery',                      destination: '/blog', permanent: true },
      { source: '/november-newsletter✨from-survival-to-thriving',                                      destination: '/blog', permanent: true },
      { source: '/december-newsletter✨a-quiet-threshold✨connection-begins-inside',                    destination: '/blog', permanent: true },
      { source: '/february-newsletter✨own-your-happiness✨joy-isnt-rented-its-owned',                  destination: '/blog', permanent: true },
      { source: '/march-newsletter✨conscious-choice-✨attention-shapes-experience',                    destination: '/blog', permanent: true },
      { source: '/april-newsletter✨not-all-healing-heals',                                             destination: '/blog', permanent: true },
    ]
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            // Cloudflare handles HSTS at the edge — do not add preload directive here
            // as it would permanently affect all subdomains (including staging)
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains',
          },
        ],
      },
    ]
  },
}

const sentryOrg = process.env.SENTRY_ORG ?? 'your-sentry-org'
const sentryAuthToken = process.env.SENTRY_AUTH_TOKEN

export default withSentryConfig(nextConfig, {
  org: sentryOrg,
  project: 'suzanneravenall-web',

  // Suppress Sentry CLI output during builds — also suppressed when org is a placeholder
  silent: !process.env.CI || sentryOrg === 'your-sentry-org',

  // Only upload source maps when a real auth token is present (Phase 5)
  sourcemaps: {
    disable: !sentryAuthToken,
  },

  // Upload larger source map artifacts for better stack traces
  widenClientFileUpload: true,

  // Hide source maps from the browser bundle
  hideSourceMaps: true,

  // Remove Sentry logger statements from the production bundle
  disableLogger: true,
})
