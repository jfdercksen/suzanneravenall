/**
 * The marketing opt-in on every enquiry, booking and sign-up form (POPIA,
 * Suzanne's rules of 8 Nov 2026): a separate box, unticked by default and
 * never required. When it is ticked the visitor picks one or more channels.
 *
 * Pure and browser-safe: the forms and the server routes share it. The Zod
 * schema for the routes is in ./schema.ts.
 */

/**
 * The version of the opt-in wording and layout a choice was made on. Change
 * it whenever MarketingOptIn's wording changes, so every stored choice can be
 * matched to the text the visitor saw.
 */
export const MARKETING_FORM_VERSION = 'marketing-opt-in-v1-2026-11-18'

export const MARKETING_CHANNELS = ['email', 'whatsapp', 'sms'] as const
export type MarketingChannel = (typeof MARKETING_CHANNELS)[number]

export const MARKETING_CHANNEL_LABELS: Record<MarketingChannel, string> = {
  email: 'Email',
  whatsapp: 'WhatsApp',
  sms: 'SMS',
}

export interface MarketingChoice {
  optIn: boolean
  channels: MarketingChannel[]
}

/** The default: box unticked, no channel. */
export const NO_MARKETING: MarketingChoice = { optIn: false, channels: [] }

export const MARKETING_CHANNEL_REQUIRED = 'Choose at least one: email, WhatsApp or SMS.'

/** The message to show when the box is ticked without a channel; undefined when the choice is complete. */
export function marketingChoiceError(choice: MarketingChoice): string | undefined {
  return choice.optIn && choice.channels.length === 0 ? MARKETING_CHANNEL_REQUIRED : undefined
}

function isChannel(value: unknown): value is MarketingChannel {
  return typeof value === 'string' && (MARKETING_CHANNELS as readonly string[]).includes(value)
}

/**
 * A choice as it is stored: channels known, unique and in a fixed order, and
 * opted in only when at least one channel is chosen. Anything missing or
 * malformed is "not opted in".
 */
export function normaliseMarketingChoice(input: Partial<MarketingChoice> | null | undefined): MarketingChoice {
  if (!input || input.optIn !== true || !Array.isArray(input.channels)) return { optIn: false, channels: [] }
  const chosen = new Set(input.channels.filter(isChannel))
  const channels = MARKETING_CHANNELS.filter((c) => chosen.has(c))
  return channels.length > 0 ? { optIn: true, channels } : { optIn: false, channels: [] }
}

/** The four columns on leads, quiz_subscribers and intake_submissions. */
export interface MarketingRecord {
  marketing_opt_in: boolean
  marketing_channels: MarketingChannel[]
  /** When the visitor made the choice (either way); null when the form did not send one. */
  marketing_choice_at: string | null
  marketing_form_version: string | null
}

/**
 * The record to store with a submission. `choice` undefined means the form
 * sent no choice (a page cached from before the opt-in): stored as not opted
 * in, with no timestamp or version, so it is never mistaken for a "no".
 */
export function marketingRecord(choice: Partial<MarketingChoice> | null | undefined, now: Date): MarketingRecord {
  if (!choice) {
    return { marketing_opt_in: false, marketing_channels: [], marketing_choice_at: null, marketing_form_version: null }
  }
  const normalised = normaliseMarketingChoice(choice)
  return {
    marketing_opt_in: normalised.optIn,
    marketing_channels: normalised.channels,
    marketing_choice_at: now.toISOString(),
    marketing_form_version: MARKETING_FORM_VERSION,
  }
}

/** One line for a staff mail: "Opted in: Email, SMS" or "Not opted in". */
export function marketingSummary(choice: Partial<MarketingChoice> | null | undefined): string {
  const normalised = normaliseMarketingChoice(choice)
  if (!normalised.optIn) return 'Not opted in'
  return `Opted in: ${normalised.channels.map((c) => MARKETING_CHANNEL_LABELS[c]).join(', ')}`
}

/**
 * The choice as Medusa cart metadata (string values only; it reaches the order
 * with the cart). An empty value deletes the key in Medusa's merge, so a
 * buyer who unticks the box leaves no channels behind.
 */
export function marketingCartMetadata(choice: MarketingChoice, now: Date): Record<string, string> {
  const normalised = normaliseMarketingChoice(choice)
  return {
    marketing_opt_in: normalised.optIn ? 'true' : 'false',
    marketing_channels: normalised.channels.join(','),
    marketing_choice_at: now.toISOString(),
    marketing_form_version: MARKETING_FORM_VERSION,
  }
}
