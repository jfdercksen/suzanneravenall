/**
 * Suzanne Ravenall — Tailwind CSS preset
 *
 * Shared across all apps in the monorepo via:
 *   import baseConfig from '../../packages/config/tailwind.config'
 *   presets: [baseConfig]
 *
 * Brand tokens confirmed from site audit (April 2026):
 *   Primary:  #012B43 Dark Navy  → brand-primary / brand-primary-{100-900}
 *   Accent:   #1719F4 Electric Blue → brand-accent / brand-accent-{100-900}
 *   Font:     Poppins 200 / 400 / 500 / 600 / 700
 *
 * Layout patterns adopted from Tony Robbins reference (April 2026):
 *   Container:  max-w-7xl mx-auto px-4
 *   Card grid:  grid gap-6 sm:grid-cols-2 lg:grid-cols-3
 *   Breakpoints: sm (640px) and lg (1024px) only — no md
 */
import type { Config } from 'tailwindcss'

const config = {
  // Preset convention: consuming apps provide their own `content` glob.
  // Setting content: [] here prevents this file being used standalone by accident.
  content: [],
  // ── Container — must sit under theme (not theme.extend) to take effect ──────
  // Tailwind's container plugin reads from theme.container only.
  theme: {
    container: {
      center: true,
      padding: '1rem',
      screens: {
        '2xl': '80rem', // 1280px — max-w-7xl equivalent
      },
    },
    extend: {
      colors: {
        brand: {
          // ── Primary (navy) ─────────────────────────────────────────────
          // bg-brand-primary / text-brand-primary → #012B43
          // bg-brand-primary-100 … bg-brand-primary-900
          primary: {
            DEFAULT: '#012B43',
            100: '#e6eef2',
            200: '#bdd6e2',
            300: '#8db5c8',
            400: '#5994ae',
            500: '#2e7694',
            600: '#1d5c76',
            700: '#0f4159',
            800: '#022f4b',
            900: '#012B43',
          },
          // ── Accent (electric blue) ──────────────────────────────────────
          // bg-brand-accent / text-brand-accent → #1719F4
          // bg-brand-accent-600 is the main CTA colour
          // bg-brand-accent-700 is the hover state
          accent: {
            DEFAULT: '#1719F4',
            100: '#e8e9fd',
            200: '#c2c3fb',
            300: '#9b9ef9',
            400: '#7578f7',
            500: '#4e52f5',
            600: '#1719F4',
            700: '#0E11C2',
            800: '#0a0d91',
            900: '#070861',
          },
          // ── Supporting brand colours ────────────────────────────────────
          amber: '#ffba00',
          black: '#000000',
          white: '#FFFFFF',
        },
        // NOTE: Tailwind's built-in neutral and gray palettes are preserved.
        // Do not redefined neutral here — object-valued color extensions replace,
        // not merge, the built-in palette. Use neutral-* and gray-* utilities directly.
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '1rem' }],
      },
      fontWeight: {
        // '200' as string — Tailwind fontWeight extension requires string values.
        // tokens.ts exports fontWeight.display as number (200) for non-Tailwind contexts.
        display: '200',
      },
      maxWidth: {
        content: '80rem', // 1280px — max-w-7xl
      },
      boxShadow: {
        card: '0 2px 8px 0 rgb(0 0 0 / 0.08)',
        'card-hover': '0 8px 24px 0 rgb(0 0 0 / 0.12)',
      },
      borderRadius: {
        card: '0.5rem',
        button: '0.75rem',
      },
    },
  },
} satisfies Partial<Config>

export default config
