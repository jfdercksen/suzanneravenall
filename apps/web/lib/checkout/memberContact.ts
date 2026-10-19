/**
 * The signed-in member's contact details, read to prefill the checkout contact
 * step (KI077). Same source and name split as the account page: the Supabase
 * user's email, and full_name and phone from user_metadata (written at signup
 * and by the account form).
 */
export interface MemberContact {
  firstName: string
  lastName: string
  email: string
  phone: string
}

interface MemberUser {
  email?: string | null
  user_metadata?: Record<string, unknown> | null
}

function metaString(meta: Record<string, unknown> | null | undefined, key: string): string {
  const value = meta?.[key]
  return typeof value === 'string' ? value.trim() : ''
}

export function contactFromUser(user: MemberUser): MemberContact {
  const nameParts = metaString(user.user_metadata, 'full_name').split(/\s+/).filter(Boolean)
  return {
    firstName: nameParts[0] ?? '',
    lastName: nameParts.slice(1).join(' '),
    email: user.email ?? '',
    phone: metaString(user.user_metadata, 'phone'),
  }
}

/** Null for a guest, or when the session cannot be read: checkout then starts empty. */
export async function readMemberContact(): Promise<MemberContact | null> {
  try {
    // Lazy import keeps @supabase/ssr + supabase-js out of the checkout's
    // first-load JS (KI016); a guest pays one small extra request.
    const { createClient } = await import('@/utils/supabase/client')
    const {
      data: { user },
    } = await createClient().auth.getUser()
    return user ? contactFromUser(user) : null
  } catch {
    return null
  }
}
