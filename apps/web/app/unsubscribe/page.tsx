import type { Metadata } from 'next'
import { verifyUnsubscribeToken } from '@/lib/email/unsubscribe'
import UnsubscribeConfirm from './UnsubscribeConfirm'

export const metadata: Metadata = {
  title: 'Unsubscribe | Dr. Suzanne Ravenall',
  description: 'Unsubscribe from Ravenall Institute marketing emails.',
  robots: { index: false, follow: false },
}

// The token is verified per-request — never cache this page.
export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ token?: string }>
}

export default async function UnsubscribePage({ searchParams }: PageProps) {
  const { token } = await searchParams
  const email = verifyUnsubscribeToken(token)

  return (
    <section className="py-20 lg:py-32 bg-white min-h-[60vh]">
      <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-4">
          Email Preferences
        </p>
        {email && token ? (
          <UnsubscribeConfirm token={token} email={email} />
        ) : (
          <div>
            <h1 className="text-3xl lg:text-4xl font-light text-gray-900 mb-6">
              This link is not valid
            </h1>
            <p className="text-gray-600 leading-relaxed mb-3">
              This unsubscribe link is incomplete or has been altered. Please use the
              unsubscribe link at the bottom of any marketing email we have sent you.
            </p>
            <p className="text-gray-600 leading-relaxed">
              If the problem persists, contact us at{' '}
              <a href="mailto:sravenall@suzanneravenall.com" className="text-brand-accent underline">
                sravenall@suzanneravenall.com
              </a>{' '}
              and we will remove you manually.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
