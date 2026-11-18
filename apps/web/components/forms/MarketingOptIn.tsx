'use client'

import Link from 'next/link'
import {
  MARKETING_CHANNELS,
  MARKETING_CHANNEL_LABELS,
  type MarketingChannel,
  type MarketingChoice,
} from '@/lib/consent/marketing'

interface MarketingOptInProps {
  /** Prefix for the element ids, unique on the page. */
  idPrefix: string
  value: MarketingChoice
  onChange: (next: MarketingChoice) => void
  /** dark: on black or a picture (white text); light: on cream or sand. */
  tone?: 'light' | 'dark'
  /** Shown under the channels, e.g. "Choose at least one". */
  error?: string
  /** False where the form already links the Privacy Notice (checkout). */
  showPrivacyLink?: boolean
  disabled?: boolean
  className?: string
}

/**
 * The Privacy Notice link and the marketing opt-in for every enquiry,
 * booking and sign-up form (POPIA, Suzanne's rules of 8 Nov 2026). The box is
 * unticked by default and never required; ticking it shows the channels.
 * Wording changes need a new MARKETING_FORM_VERSION (lib/consent/marketing.ts).
 */
export function MarketingOptIn({
  idPrefix,
  value,
  onChange,
  tone = 'light',
  error,
  showPrivacyLink = true,
  disabled = false,
  className = '',
}: MarketingOptInProps) {
  const dark = tone === 'dark'
  const textClass = dark ? 'text-white/80' : 'text-brand-muted'
  const labelClass = dark ? 'text-white' : 'text-brand-ink'
  const linkClass = dark
    ? 'underline underline-offset-2 text-white hover:text-white/80'
    : 'underline underline-offset-2 text-brand-ink hover:text-brand-primary'
  const boxClass = dark ? 'mt-0.5 w-4 h-4 flex-shrink-0 accent-white' : 'mt-0.5 w-4 h-4 flex-shrink-0 accent-brand-accent-600'
  const errorClass = dark ? 'text-red-400' : 'text-red-600'
  const errorId = `${idPrefix}-marketing-error`

  function toggleOptIn(checked: boolean) {
    onChange(checked ? { optIn: true, channels: value.channels } : { optIn: false, channels: [] })
  }

  function toggleChannel(channel: MarketingChannel, checked: boolean) {
    const chosen = new Set(value.channels)
    if (checked) chosen.add(channel)
    else chosen.delete(channel)
    onChange({ optIn: true, channels: MARKETING_CHANNELS.filter((c) => chosen.has(c)) })
  }

  return (
    <div className={`text-left text-xs leading-relaxed ${textClass} ${className}`}>
      {showPrivacyLink && (
        <p className="mb-2">
          See our{' '}
          <Link href="/legal/privacy" className={linkClass}>
            Privacy Notice
          </Link>{' '}
          for how we use your details.
        </p>
      )}
      <label htmlFor={`${idPrefix}-marketing`} className={`flex items-start gap-2.5 cursor-pointer ${labelClass}`}>
        <input
          id={`${idPrefix}-marketing`}
          type="checkbox"
          checked={value.optIn}
          disabled={disabled}
          onChange={(e) => toggleOptIn(e.target.checked)}
          className={boxClass}
        />
        <span>Keep me updated with news, programmes and offers (optional).</span>
      </label>
      {value.optIn && (
        <fieldset
          className="mt-2 ml-6"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
        >
          <legend className={`mb-1 ${textClass}`}>How would you like to hear from us?</legend>
          <div className="flex flex-wrap gap-x-5 gap-y-1.5">
            {MARKETING_CHANNELS.map((channel) => (
              <label
                key={channel}
                htmlFor={`${idPrefix}-marketing-${channel}`}
                className={`inline-flex items-center gap-2 cursor-pointer ${labelClass}`}
              >
                <input
                  id={`${idPrefix}-marketing-${channel}`}
                  type="checkbox"
                  checked={value.channels.includes(channel)}
                  disabled={disabled}
                  onChange={(e) => toggleChannel(channel, e.target.checked)}
                  className={boxClass.replace('mt-0.5 ', '')}
                />
                {MARKETING_CHANNEL_LABELS[channel]}
              </label>
            ))}
          </div>
          {error && (
            <p id={errorId} role="alert" className={`mt-1 ${errorClass}`}>
              {error}
            </p>
          )}
        </fieldset>
      )}
    </div>
  )
}
