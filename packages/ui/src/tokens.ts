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
  /** Dark ground — black (tonyrobbins.com --tr-black). Nav, footer, dark sections. */
  primary: '#000000',
  /** CTA fill on light grounds — near-black (TR shadcn --primary). */
  accent: '#171717',
  /** CTA hover. */
  accentHover: '#000000',
  /** Label colour ON dark grounds (TR --tr-white-2). */
  accentOnDark: '#DADBDF',
  /** Amber — legacy badge colour, book page only. Due for removal in its page pass. */
  amber: '#ffba00',
  black: '#000000',
  white: '#FFFFFF',
  /** Suzanne's navy — identity colour only (logo lockups, marks). NOT a background. */
  blue: '#012B43',
  /** Body text on light backgrounds (TR --foreground) */
  textDark: '#0A0A0A',
  /** Muted / secondary text (TR computed muted paragraph colour) */
  textMuted: '#696969',
  /** Dividers and subtle borders (TR --border) */
  border: '#E5E5E5',
  /** Light page background — white (historical token name: cream) */
  backgroundLight: '#FFFFFF',
  /** Alternating light section band — light grey (TR --tr-white-1; historical name: sand) */
  backgroundSand: '#F6F6F7',
} as const

// ---------------------------------------------------------------------------
// Primary (black) scale — design standard 2026-09-15, see docs/DESIGN-STANDARD.md
// Lower numbers are lighter; higher numbers are darker.
// brand-primary-900 is the dark ground.
// ---------------------------------------------------------------------------

export const primaryScale = {
  100: '#F6F6F7',
  200: '#DADBDF',
  300: '#A3A3A3',
  400: '#737373',
  500: '#525252',
  600: '#303134',
  700: '#232325',
  800: '#171717',
  900: '#000000',
} as const

// ---------------------------------------------------------------------------
// Accent scale — near-black CTA ramp (tonyrobbins.com has no colour accent)
// brand-accent-600 is the CTA fill on light grounds.
// brand-accent-700 is the hover state.
// brand-accent-400 is the label colour on dark grounds.
// ---------------------------------------------------------------------------

export const accentScale = {
  100: '#F6F6F7',
  200: '#EEEEF0',
  300: '#E5E5E5',
  400: '#DADBDF',
  500: '#737373',
  600: '#171717',
  700: '#000000',
  800: '#000000',
  900: '#000000',
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
