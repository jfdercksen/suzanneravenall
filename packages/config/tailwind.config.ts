/**
 * Suzanne Ravenall — Tailwind CSS preset
 *
 * Shared across all apps in the monorepo via:
 *   import baseConfig from '../../packages/config/tailwind.config'
 *   presets: [baseConfig]
 *
 * Brand tokens (warm direction, 2026-09-02 — supersedes the April 2026 audit):
 *   Primary:  #1A1512 Warm Ink   → brand-primary / brand-primary-{100-900}
 *   Accent:   #A84C07 Warm Amber → brand-accent / brand-accent-{100-900}
 *   Grounds:  #FDFAF6 cream / #F5EDE3 sand
 *   Identity: #012B43 Suzanne blue → brand-blue (not a background)
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
          // ── Primary (warm ink) ─────────────────────────────────────────
          // bg-brand-primary / text-brand-primary → #1A1512
          // bg-brand-primary-100 … bg-brand-primary-900
          //
          // WARM DIRECTION (2026-09-02): this token used to be #012B43 navy,
          // carried over from the old WordPress site. The design reference has
          // always been tonyrobbins.com, which is warm, so brightening a cold
          // palette only ever produced a lighter cold. The dark ground is now a
          // warm near-black brown. Suzanne's navy is retained as `brand-blue`
          // below — an identity colour, no longer a background.
          primary: {
            DEFAULT: '#1A1512',
            100: '#EFE8E1',
            200: '#DBCEC2',
            300: '#C0AE9E',
            400: '#9C8878',
            500: '#7A6656',
            600: '#5C4B3E',
            700: '#40332A',
            800: '#2A211B',
            900: '#1A1512',
          },
          // ── Accent (warm amber) ─────────────────────────────────────────
          // bg-brand-accent / text-brand-accent → #A84C07
          // bg-brand-accent-600 is the main CTA colour
          // bg-brand-accent-700 is the hover state
          // bg-brand-accent-400 is the label colour ON DARK sections only
          //
          // Replaces #1719F4 electric blue. accent-600 is deliberately the
          // darker end of the amber ramp so one token passes WCAG AA on BOTH
          // light grounds (5.45 on cream, 4.89 on sand) and carries white text
          // at 5.67 — a brighter amber would have needed a per-background variant.
          accent: {
            DEFAULT: '#A84C07',
            100: '#FDF2E4',
            200: '#FAE0BF',
            300: '#F5C88C',
            400: '#F0A952',
            500: '#D97706',
            600: '#A84C07',
            700: '#8F4108',
            800: '#6E3206',
            900: '#4F2404',
          },
          // ── Warm neutral grounds ────────────────────────────────────────
          // Replace bg-white / bg-gray-50 as the light section backgrounds.
          // cream is the page ground, sand the alternating band.
          // Pure white stays available for cards sitting ON cream, which is
          // where the depth now comes from.
          cream: '#FDFAF6',
          sand: '#F5EDE3',
          // Hairline dividers and card borders on the light grounds.
          // Replaces border-gray-100 / border-gray-200, which read cold on cream.
          border: '#E7DED2',
          // Warm body and muted text — replace text-gray-600 / text-gray-500.
          ink: '#3D342E',
          muted: '#6E5F53',
          // ── Identity ────────────────────────────────────────────────────
          // Suzanne's navy, kept as an identity colour (logo lockups, marks,
          // the occasional deliberate accent). NOT a background.
          blue: '#012B43',
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
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px 0 rgb(217 119 6 / 0.4)' },
          '50%': { boxShadow: '0 0 40px 8px rgb(217 119 6 / 0.6)' },
        },
        'brain-glow': {
          '0%, 100%': { filter: 'drop-shadow(0 0 4px #D97706)' },
          '50%': { filter: 'drop-shadow(0 0 12px #D97706) drop-shadow(0 0 24px #D97706)' },
        },
        'brain-pulse': {
          '0%, 100%': {
            filter: 'drop-shadow(0 0 8px #D97706) drop-shadow(0 0 16px rgba(217,119,6,0.4))',
          },
          '50%': {
            filter: 'drop-shadow(0 0 20px #D97706) drop-shadow(0 0 40px rgba(217,119,6,0.8)) drop-shadow(0 0 60px rgba(217,119,6,0.3))',
          },
        },
      },
      animation: {
        'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
        'brain-glow': 'brain-glow 2s ease-in-out infinite',
        'brain-pulse': 'brain-pulse 2.5s ease-in-out infinite',
      },
    },
  },
} satisfies Partial<Config>

export default config
