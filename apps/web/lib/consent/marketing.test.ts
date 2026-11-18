import { describe, it, expect } from 'vitest'
import {
  MARKETING_CHANNEL_REQUIRED,
  MARKETING_FORM_VERSION,
  marketingCartMetadata,
  marketingChoiceError,
  marketingRecord,
  marketingSummary,
  normaliseMarketingChoice,
} from './marketing'
import { MarketingChoiceSchema } from './schema'

const NOW = new Date('2026-11-18T08:00:00.000Z')

describe('marketing opt-in record (POPIA)', () => {
  it('stores a ticked box with its channels in a fixed order, the time and the wording version', () => {
    expect(marketingRecord({ optIn: true, channels: ['sms', 'email', 'sms'] }, NOW)).toEqual({
      marketing_opt_in: true,
      marketing_channels: ['email', 'sms'],
      marketing_choice_at: '2026-11-18T08:00:00.000Z',
      marketing_form_version: MARKETING_FORM_VERSION,
    })
  })

  it('stores an unticked box as a dated "no" with no channels', () => {
    expect(marketingRecord({ optIn: false, channels: ['email'] }, NOW)).toEqual({
      marketing_opt_in: false,
      marketing_channels: [],
      marketing_choice_at: '2026-11-18T08:00:00.000Z',
      marketing_form_version: MARKETING_FORM_VERSION,
    })
  })

  it('stores no choice (an old cached page) as not opted in, with no time or version', () => {
    expect(marketingRecord(undefined, NOW)).toEqual({
      marketing_opt_in: false,
      marketing_channels: [],
      marketing_choice_at: null,
      marketing_form_version: null,
    })
  })

  it('never reads a ticked box without a known channel as a yes', () => {
    expect(normaliseMarketingChoice({ optIn: true, channels: [] })).toEqual({ optIn: false, channels: [] })
    expect(normaliseMarketingChoice({ optIn: true, channels: ['fax' as 'email'] })).toEqual({ optIn: false, channels: [] })
    expect(normaliseMarketingChoice(null)).toEqual({ optIn: false, channels: [] })
  })

  it('asks for a channel only when the box is ticked', () => {
    expect(marketingChoiceError({ optIn: true, channels: [] })).toBe(MARKETING_CHANNEL_REQUIRED)
    expect(marketingChoiceError({ optIn: true, channels: ['whatsapp'] })).toBeUndefined()
    expect(marketingChoiceError({ optIn: false, channels: [] })).toBeUndefined()
  })

  it('summarises the choice for a staff mail', () => {
    expect(marketingSummary({ optIn: true, channels: ['whatsapp', 'email'] })).toBe('Opted in: Email, WhatsApp')
    expect(marketingSummary({ optIn: false, channels: [] })).toBe('Not opted in')
    expect(marketingSummary(undefined)).toBe('Not opted in')
  })

  it('writes cart metadata as strings, with an empty channel list when not opted in', () => {
    expect(marketingCartMetadata({ optIn: true, channels: ['sms'] }, NOW)).toEqual({
      marketing_opt_in: 'true',
      marketing_channels: 'sms',
      marketing_choice_at: '2026-11-18T08:00:00.000Z',
      marketing_form_version: MARKETING_FORM_VERSION,
    })
    expect(marketingCartMetadata({ optIn: false, channels: [] }, NOW)).toMatchObject({
      marketing_opt_in: 'false',
      marketing_channels: '',
    })
  })
})

describe('MarketingChoiceSchema', () => {
  it('accepts an unticked box and a ticked box with channels', () => {
    expect(MarketingChoiceSchema.safeParse({ optIn: false, channels: [] }).success).toBe(true)
    expect(MarketingChoiceSchema.safeParse({ optIn: true, channels: ['email', 'whatsapp', 'sms'] }).success).toBe(true)
  })

  it('refuses a ticked box without a channel, unknown channels and non-boolean ticks', () => {
    expect(MarketingChoiceSchema.safeParse({ optIn: true, channels: [] }).success).toBe(false)
    expect(MarketingChoiceSchema.safeParse({ optIn: true, channels: ['post'] }).success).toBe(false)
    expect(MarketingChoiceSchema.safeParse({ optIn: 'true', channels: ['email'] }).success).toBe(false)
  })
})
