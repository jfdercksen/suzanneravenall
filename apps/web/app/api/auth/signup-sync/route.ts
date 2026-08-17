import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { logError } from '@/lib/log'

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    )
  }

  // Verify the caller has a valid session and is acting on their own account
  const cookieStore = await cookies()
  const supabase = createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)
        )
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (
    typeof body !== 'object' ||
    body === null ||
    typeof (body as Record<string, unknown>).userId !== 'string' ||
    !UUID_RE.test((body as Record<string, unknown>).userId as string)
  ) {
    return NextResponse.json({ error: 'Invalid userId' }, { status: 400 })
  }

  const { userId } = body as { userId: string }

  // Callers can only create a subscription for themselves
  if (userId !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Service role client — bypasses RLS so we can write to member_subscriptions
  const adminSupabase = createServerClient(supabaseUrl, serviceRoleKey, {
    cookies: { getAll: () => [], setAll: () => {} },
  })

  // Look up the free tier UUID (slugs are stable; IDs are not hard-coded)
  const { data: freeTier, error: tierError } = await adminSupabase
    .from('membership_tiers')
    .select('id')
    .eq('slug', 'free')
    .single()

  if (tierError || !freeTier) {
    return NextResponse.json(
      { error: 'Free membership tier not found' },
      { status: 500 }
    )
  }

  // Idempotent — return existing record if already created
  const { data: existing } = await adminSupabase
    .from('member_subscriptions')
    .select('id')
    .eq('user_id', userId)
    .eq('tier_id', freeTier.id)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ subscriptionId: existing.id }, { status: 200 })
  }

  const { data: subscription, error: insertError } = await adminSupabase
    .from('member_subscriptions')
    .insert({
      user_id: userId,
      tier_id: freeTier.id,
      status: 'active',
      start_date: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (insertError) {
    logError('[signup-sync] insert error:', insertError)
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    )
  }

  return NextResponse.json({ subscriptionId: subscription.id }, { status: 201 })
}
