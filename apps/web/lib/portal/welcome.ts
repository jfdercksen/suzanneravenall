/**
 * "Welcome" on a member's first session, "Welcome back" after (KI077: a
 * brand-new member was greeted "Welcome back").
 *
 * Supabase signs a new member in when they confirm their address (or at once
 * when no confirmation is needed), so on the first session last_sign_in_at is
 * the confirmation moment. Any later sign-in moves it on. The first session
 * keeps "Welcome" while the member moves around the portal.
 */
const SAME_MOMENT_MS = 60_000

interface SignInTimes {
  created_at?: string | null
  email_confirmed_at?: string | null
  last_sign_in_at?: string | null
}

export function isFirstSession(user: SignInTimes): boolean {
  const last = user.last_sign_in_at ? Date.parse(user.last_sign_in_at) : NaN
  const first = Date.parse(user.email_confirmed_at ?? user.created_at ?? '')
  if (Number.isNaN(last) || Number.isNaN(first)) return false
  return Math.abs(last - first) < SAME_MOMENT_MS
}

export function welcomeHeading(firstName: string, firstSession: boolean): string {
  const greeting = firstSession ? 'Welcome' : 'Welcome back'
  return firstName ? `${greeting}, ${firstName}` : greeting
}
