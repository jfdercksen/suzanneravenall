/**
 * Suzanne Ravenall — Design Tokens
 *
 * Single source of truth for all brand design values.
 * Consumed by Tailwind config and any non-Tailwind contexts (e.g. react-pdf, charts).
 *
 * Brand confirmed from site audit (April 2026).
 * Layout patterns adopted from Tony Robbins reference analysis (April 2026).
 */

// ---------------------------------------------------------------------------
// Core brand colours — flat aliases for the most common usage points
// ---------------------------------------------------------------------------

export const colors = {
  /** Primary brand colour — dark navy. Used for nav, footer, dark section backgrounds. */
  primary: '#012B43',
  /** CTA / accent colour — electric blue. Used for all buttons, links, highlights. */
  accent: '#1719F4',
  /** Button hover state for electric blue. */
  accentHover: '#0E11C2',
  /** Amber accent — used sparingly for badges and highlights. */
  amber: '#ffba00',
  black: '#000000',
  white: '#FFFFFF',
  /** Body text on light backgrounds */
  textDark: '#333333',
  /** Muted / secondary text */
  textMuted: '#737373',
  /** Dividers and subtle borders */
  border: '#E5E5E5',
  /** Light page background */
  backgroundLight: '#F9F9F9',
} as const

// ---------------------------------------------------------------------------
// Primary (navy) tint scale — based on #012B43
// Lower numbers are lighter tints; higher numbers are darker shades.
// brand-primary-900 is the confirmed brand colour.
// ---------------------------------------------------------------------------

export const primaryScale = {
  100: '#e6eef2',
  200: '#bdd6e2',
  300: '#8db5c8',
  400: '#5994ae',
  500: '#2e7694',
  600: '#1d5c76',
  700: '#0f4159',
  800: '#022f4b',
  900: '#012B43',
} as const

// ---------------------------------------------------------------------------
// Accent (electric blue) tint scale — based on #1719F4
// brand-accent-600 is the confirmed CTA colour.
// brand-accent-700 is the confirmed hover state.
// ---------------------------------------------------------------------------

export const accentScale = {
  100: '#e8e9fd',
  200: '#c2c3fb',
  300: '#9b9ef9',
  400: '#7578f7',
  500: '#4e52f5',
  600: '#1719F4',
  700: '#0E11C2',
  800: '#0a0d91',
  900: '#070861',
} as const

// ---------------------------------------------------------------------------
// Neutral grey scale — standard utility scale
// ---------------------------------------------------------------------------

export const neutralScale = {
  50: '#F9FAFB',
  100: '#F3F4F6',
  200: '#E5E7EB',
  300: '#D1D5DB',
  400: '#9CA3AF',
  500: '#6B7280',
  600: '#4B5563',
  700: '#374151',
  800: '#1F2937',
  900: '#111827',
} as const

// ---------------------------------------------------------------------------
// Typography
// ---------------------------------------------------------------------------

export const fontFamily = {
  sans: 'Poppins, system-ui, sans-serif',
} as const

export const fontWeight = {
  /** Hero display / oversized callouts — matches Tony Robbins UltraLight hero style */
  display: 200,
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const

export const fontSize = {
  xs: '0.75rem',     // 12px
  sm: '0.875rem',    // 14px
  base: '1rem',      // 16px
  lg: '1.125rem',    // 18px
  xl: '1.25rem',     // 20px
  '2xl': '1.5rem',   // 24px
  '3xl': '1.875rem', // 30px
  '4xl': '2.25rem',  // 36px
  '5xl': '3rem',     // 48px
  '6xl': '3.75rem',  // 60px
} as const

// ---------------------------------------------------------------------------
// Layout — adopted from Tony Robbins reference
// ---------------------------------------------------------------------------

export const layout = {
  /**
   * Standard content container — max-w-7xl mx-auto px-4
   * Use as: className="max-w-7xl mx-auto px-4"
   */
  container: 'max-w-7xl mx-auto px-4',
  /**
   * Card grid — single col mobile → 2 col sm → 3 col lg
   * Only sm and lg breakpoints — no md.
   */
  cardGrid: 'grid gap-6 sm:grid-cols-2 lg:grid-cols-3',
  /** Max content width in rem — equals max-w-7xl (1280px) */
  contentWidth: '80rem',
  /** Standard section vertical padding */
  sectionY: '4rem',
  /** Section vertical padding on mobile */
  sectionYMobile: '2.5rem',
} as const

// ---------------------------------------------------------------------------
// Spacing (standalone constants for non-Tailwind contexts)
// ---------------------------------------------------------------------------

export const spacing = {
  contentWidth: layout.contentWidth,
  sectionY: layout.sectionY,
  sectionYMobile: layout.sectionYMobile,
} as const

// ---------------------------------------------------------------------------
// Component tokens
// ---------------------------------------------------------------------------

export const borderRadius = {
  card: '0.5rem',
  /** CTA buttons use rounded-xl — matches Tony Robbins rounded style */
  button: '0.75rem',
  pill: '9999px',
} as const

export const shadow = {
  card: '0 2px 8px 0 rgb(0 0 0 / 0.08)',
  cardHover: '0 8px 24px 0 rgb(0 0 0 / 0.12)',
} as const

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ColorToken = keyof typeof colors
export type PrimaryScaleStep = keyof typeof primaryScale
export type AccentScaleStep = keyof typeof accentScale
export type NeutralScaleStep = keyof typeof neutralScale
