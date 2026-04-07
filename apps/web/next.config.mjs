// @ts-check
import { withSentryConfig } from '@sentry/nextjs'

/** @type {import('next').NextConfig} */
const nextConfig = {
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
