import { z } from 'zod'
import { MARKETING_CHANNELS, MARKETING_CHANNEL_REQUIRED } from './marketing'

/**
 * The marketing choice as a route accepts it. Optional on every route: a page
 * cached from before the opt-in sends none, and that is stored as "not opted
 * in" (see marketingRecord).
 */
export const MarketingChoiceSchema = z
  .object({
    optIn: z.boolean(),
    channels: z.array(z.enum(MARKETING_CHANNELS)).max(MARKETING_CHANNELS.length),
  })
  .refine((v) => !v.optIn || v.channels.length > 0, { message: MARKETING_CHANNEL_REQUIRED })
