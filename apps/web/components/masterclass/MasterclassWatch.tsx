'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  MASTERCLASS_OFFER,
  MASTERCLASS_PROGRAMME,
  MASTERCLASS_VIDEO_URL,
} from '@/lib/masterclass'
import { MASTERCLASS_TITLE } from './MasterclassContent'

/**
 * The viewing page, as the current site's /masterclass-viewing/: the
 * recording, and the next step revealed once it has been watched to the end
 * (Shayna, 7 Oct). The offer itself waits on Suzanne's team (MASTERCLASS_OFFER).
 */
export default function MasterclassWatch() {
  const [finished, setFinished] = useState(false)

  return (
    <section className="w-full bg-brand-primary-900 pt-32 pb-20 lg:pt-40 lg:pb-28">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-xs uppercase tracking-[0.3em] font-medium text-white/70 mb-4">
          Free Masterclass
        </p>
        <h1 className="text-3xl lg:text-5xl font-medium tracking-tight text-white mb-4">
          {MASTERCLASS_TITLE}
        </h1>
        <p className="text-white/70 text-lg mb-10">
          Watch the entire masterclass to the end to unlock your next step.
        </p>

        <div className="rounded-card overflow-hidden bg-black shadow-2xl">
          <video
            src={MASTERCLASS_VIDEO_URL}
            controls
            playsInline
            preload="metadata"
            controlsList="nodownload"
            onEnded={() => setFinished(true)}
            className="w-full aspect-video"
          >
            Your browser cannot play this video.
          </video>
        </div>

        {finished && (
          <div
            role="status"
            className="mt-10 rounded-card bg-white p-8 lg:p-10 text-center"
          >
            <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-3">
              Thank you for watching
            </p>
            <h2 className="text-2xl lg:text-3xl font-medium text-brand-primary mb-4">
              Go deeper with {MASTERCLASS_PROGRAMME.name}
            </h2>
            {MASTERCLASS_OFFER && (
              <p className="text-brand-ink mb-6">
                {MASTERCLASS_OFFER.text}{' '}
                <span className="font-mono font-semibold">{MASTERCLASS_OFFER.code}</span>
              </p>
            )}
            <Link
              href={MASTERCLASS_PROGRAMME.path}
              className="inline-flex items-center justify-center rounded-button bg-brand-accent-600 hover:bg-brand-accent-700 text-white px-8 py-4 font-medium text-sm uppercase tracking-widest transition-all duration-300"
            >
              View the programme &rarr;
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
