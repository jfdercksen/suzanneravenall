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
          // DESIGN STANDARD (2026-09-15): values are read off the live
          // tonyrobbins.com CSS, not guessed. Source for every value is in
          // docs/DESIGN-STANDARD.md. The site is monochrome: black, white and
          // one light grey, with colour coming from photography. The warm
          // palette (2 Sep) and the navy/electric blue before it are both gone.
          // Token NAMES are kept so ~100 files do not churn; cream and sand are
          // historical names for white and light grey.
          //
          // ── Primary (black ramp) ───────────────────────────────────────
          // 900/DEFAULT = TR --tr-black, 800 = shadcn --primary (#171717),
          // 700 = --tr-black-1, 600 = --tr-black-2, 400 = --muted-foreground,
          // 200 = --tr-white-2, 100 = --tr-white-1. 300 and 500 are derived.
          primary: {
            DEFAULT: '#000000',
            100: '#F6F6F7',
            200: '#DADBDF',
            300: '#A3A3A3',
            400: '#737373',
            500: '#525252',
            600: '#303134',
            700: '#232325',
            800: '#171717',
            900: '#000000',
          },
          // ── Accent (the CTA and the label colour) ───────────────────────
          // TR has no brand accent: its buttons and eyebrow labels are black
          // on light and white on dark. So the "accent" is near-black.
          // bg-brand-accent-600  CTA fill on LIGHT grounds (white text 17.9:1)
          // bg-brand-accent-700  hover
          // text-brand-accent-400  label colour ON DARK grounds (15.2:1)
          // On dark grounds and imagery a CTA is bg-white text-brand-primary,
          // never bg-brand-accent (near-black on black disappears).
          accent: {
            DEFAULT: '#171717',
            100: '#F6F6F7',
            200: '#EEEEF0',
            300: '#E5E5E5',
            400: '#DADBDF',
            500: '#737373',
            600: '#171717',
            700: '#000000',
            800: '#000000',
            900: '#000000',
          },
          // ── Light grounds ───────────────────────────────────────────────
          // cream = page ground (TR --tr-white #FFFFFF)
          // sand  = alternating band and card fill (TR --tr-white-1 #F6F6F7)
          cream: '#FFFFFF',
          sand: '#F6F6F7',
          // Hairline dividers and card borders (TR --border).
          border: '#E5E5E5',
          // Body text (TR --foreground) and muted text (TR computed muted
          // paragraph colour; 5.49:1 on white, 5.08:1 on sand).
          ink: '#0A0A0A',
          muted: '#696969',
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
        // Glows are white light, not a hue: the palette has no colour accent,
        // and these only ever run on dark grounds.
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px 0 rgb(255 255 255 / 0.25)' },
          '50%': { boxShadow: '0 0 40px 8px rgb(255 255 255 / 0.4)' },
        },
        'brain-glow': {
          '0%, 100%': { filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.6))' },
          '50%': { filter: 'drop-shadow(0 0 12px rgba(255,255,255,0.7)) drop-shadow(0 0 24px rgba(255,255,255,0.4))' },
        },
        'brain-pulse': {
          '0%, 100%': {
            filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.6)) drop-shadow(0 0 16px rgba(255,255,255,0.25))',
          },
          '50%': {
            filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.7)) drop-shadow(0 0 40px rgba(255,255,255,0.45)) drop-shadow(0 0 60px rgba(255,255,255,0.2))',
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
