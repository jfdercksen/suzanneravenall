'use client'

import Cal, { getCalApi } from '@calcom/embed-react'
import { useEffect, useState } from 'react'

const CAL_URL = process.env.NEXT_PUBLIC_CAL_URL ?? 'https://cal.suzanneravenall.com'
const CAL_LINK = 'suzanneravenall/discovery-call'
const EMBED_JS_URL = `${CAL_URL}/embed/embed.js`

/** The plain Cal booking page, for when the embed cannot load. */
export const CAL_BOOKING_PAGE_URL = `${CAL_URL}/${CAL_LINK}`

// Own namespace, so this inline embed never shares a Cal instance with the
// /services modal embed. On a shared (default) instance, navigating in-app from
// /services to /contact threw "iframe doesn't exist. createIframe must be
// called before doInIframe" from embed.js (site check A2).
export const CAL_INLINE_NAMESPACE = 'discovery-inline'

/** Show the fallback if the booking calendar has not loaded by then. */
export const CAL_INLINE_TIMEOUT_MS = 8_000

type Status = 'loading' | 'ready' | 'failed'

type CalApi = Awaited<ReturnType<typeof getCalApi>>

export default function CalInlineBooking() {
  const [status, setStatus] = useState<Status>('loading')

  useEffect(() => {
    let active = true
    let api: CalApi | undefined
    const onReady = () => {
      if (active) setStatus('ready')
    }
    const onFailed = () => {
      if (active) setStatus((s) => (s === 'ready' ? s : 'failed'))
    }
    // A blocked embed.js (ad blocker, mixed content, DNS failure) never fires
    // either event, so the timeout is what reveals the fallback then.
    const timer = setTimeout(onFailed, CAL_INLINE_TIMEOUT_MS)

    getCalApi({ namespace: CAL_INLINE_NAMESPACE, embedJsUrl: EMBED_JS_URL })
      .then((cal) => {
        if (!active) return
        api = cal
        cal('on', { action: 'linkReady', callback: onReady })
        cal('on', { action: 'linkFailed', callback: onFailed })
      })
      .catch(onFailed)

    return () => {
      active = false
      clearTimeout(timer)
      api?.('off', { action: 'linkReady', callback: onReady })
      api?.('off', { action: 'linkFailed', callback: onFailed })
    }
  }, [])

  const failed = status === 'failed'

  return (
    <>
      {failed && (
        <div role="status" className="rounded-lg border border-brand-border bg-white/60 p-5 text-sm text-brand-muted leading-relaxed">
          <p className="mb-4">The booking calendar did not load here. You can still book your call:</p>
          <a
            href={CAL_BOOKING_PAGE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-full px-6 py-3 bg-brand-accent hover:bg-brand-accent-700 text-white text-xs uppercase tracking-widest font-medium rounded-button transition-colors duration-300"
          >
            Open the booking page
          </a>
          <p className="mt-4">
            Or{' '}
            <a href="#message" className="text-brand-accent hover:underline">
              send us a message
            </a>{' '}
            or email{' '}
            <a href="mailto:sravenall@suzanneravenall.com" className="text-brand-accent hover:underline">
              sravenall@suzanneravenall.com
            </a>
            .
          </p>
        </div>
      )}

      {/* Stays mounted when the fallback shows, so a slow embed can still
          finish loading, but collapses instead of leaving an empty box. */}
      <div
        className="rounded-lg overflow-hidden -mx-2"
        style={failed ? { height: 0 } : undefined}
        aria-hidden={failed || undefined}
        data-testid="cal-inline-container"
      >
        <Cal
          namespace={CAL_INLINE_NAMESPACE}
          calLink={CAL_LINK}
          embedJsUrl={EMBED_JS_URL}
          config={{ theme: 'light', layout: 'month_view' }}
          style={{ width: '100%', height: '600px', overflow: 'auto' }}
        />
      </div>
    </>
  )
}
