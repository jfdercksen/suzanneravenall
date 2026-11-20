import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import { createClient } from '@/utils/supabase/server'
import { getServiceRoleClient } from '@/lib/quiz/subscriber'
import { memberApplication, type NoviceApplication } from './applications'

/**
 * Who is calling a /api/portal/novice route: the signed-in member (their own
 * session cookie) and their application. The service-role client is only
 * used after the application is proven to be theirs.
 */
export type MemberContext =
  | { ok: true; user: User; admin: SupabaseClient; app: NoviceApplication }
  | { ok: false; response: NextResponse }

export async function memberContext(applicationId: string): Promise<MemberContext> {
  const supabase = createClient(await cookies())
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

  const admin = getServiceRoleClient()
  if (!admin) return { ok: false, response: NextResponse.json({ error: 'Server configuration error' }, { status: 500 }) }

  const app = await memberApplication(admin, user.id, applicationId)
  if (!app) return { ok: false, response: NextResponse.json({ error: 'Not found' }, { status: 404 }) }
  return { ok: true, user, admin, app }
}
