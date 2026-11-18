import { STAFF_LOGIN_PATH, STAFF_LOGOUT_PATH, type StaffAccess } from '@/lib/staff/payload-session'

type Refused = Exclude<StaffAccess, { status: 'allowed' }>

/**
 * What a visitor without the Staff role sees on /staff/submissions: no names,
 * no answers, only how to get in. The CMS is a separate app under /cms, so its
 * links are plain anchors (next/link would look for the page in this app).
 */
export function StaffGate({ access }: { access: Refused }) {
  if (access.status === 'unavailable') {
    return (
      <p className="max-w-xl text-base leading-relaxed text-brand-ink">
        Your login could not be checked just now. Please try again in a minute.
      </p>
    )
  }
  if (access.status === 'forbidden') {
    return (
      <div className="max-w-xl text-base leading-relaxed text-brand-ink">
        <p className="mb-4">
          You are logged in to the CMS as {access.viewer.email}, but this account does not have the Staff role, so it
          cannot read quiz or intake answers.
        </p>
        <p className="mb-6">An admin can give it the role in the CMS, under Users.</p>
        <a
          href={STAFF_LOGOUT_PATH}
          className="inline-flex items-center px-6 py-3 rounded-full text-sm font-medium border border-brand-border text-brand-ink transition-all duration-300 hover:bg-white"
        >
          Log out of the CMS
        </a>
      </div>
    )
  }
  return (
    <div className="max-w-xl text-base leading-relaxed text-brand-ink">
      <p className="mb-6">
        These pages are for Suzanne&rsquo;s team. Log in to the CMS with your staff account, then open this link again.
      </p>
      <a
        href={STAFF_LOGIN_PATH}
        className="inline-flex items-center px-6 py-3 rounded-full text-sm font-medium bg-brand-accent-600 text-white transition-all duration-300 hover:bg-brand-accent-700"
      >
        Log in to the CMS
      </a>
    </div>
  )
}
