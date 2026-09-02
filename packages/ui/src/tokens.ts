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
  /** Primary brand colour — warm ink. Used for nav, footer, dark section backgrounds. */
  primary: '#1A1512',
  /** CTA / accent colour — warm amber. Used for all buttons, links, highlights. */
  accent: '#A84C07',
  /** Button hover state for warm amber. */
  accentHover: '#8F4108',
  /** Accent variant for labels sitting ON dark sections. */
  accentOnDark: '#F0A952',
  /** Amber accent — used sparingly for badges and highlights. */
  amber: '#ffba00',
  black: '#000000',
  white: '#FFFFFF',
  /** Suzanne's navy — identity colour only (logo lockups, marks). NOT a background. */
  blue: '#012B43',
  /** Body text on light backgrounds */
  textDark: '#3D342E',
  /** Muted / secondary text */
  textMuted: '#6E5F53',
  /** Dividers and subtle borders */
  border: '#E7DED2',
  /** Light page background — cream */
  backgroundLight: '#FDFAF6',
  /** Alternating light section band — sand */
  backgroundSand: '#F5EDE3',
} as const

// ---------------------------------------------------------------------------
// Primary (warm ink) tint scale — based on #1A1512
// Lower numbers are lighter tints; higher numbers are darker shades.
// brand-primary-900 is the confirmed dark ground (warm direction, 2026-09-02).
// ---------------------------------------------------------------------------

export const primaryScale = {
  100: '#EFE8E1',
  200: '#DBCEC2',
  300: '#C0AE9E',
  400: '#9C8878',
  500: '#7A6656',
  600: '#5C4B3E',
  700: '#40332A',
  800: '#2A211B',
  900: '#1A1512',
} as const

// ---------------------------------------------------------------------------
// Accent (warm amber) tint scale — based on #A84C07
// brand-accent-600 is the confirmed CTA colour.
// brand-accent-700 is the confirmed hover state.
// ---------------------------------------------------------------------------

export const accentScale = {
  100: '#FDF2E4',
  200: '#FAE0BF',
  300: '#F5C88C',
  400: '#F0A952',
  500: '#D97706',
  600: '#A84C07',
  700: '#8F4108',
  800: '#6E3206',
  900: '#4F2404',
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
