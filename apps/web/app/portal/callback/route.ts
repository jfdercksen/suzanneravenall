import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  // Use the configured site URL rather than deriving from request.url.
  // In Docker behind Nginx, request.url resolves to http://0.0.0.0:3000
  // because Next.js uses the server's bind address, not the forwarded Host header.
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ??
    `${request.nextUrl.protocol}//${request.nextUrl.host}`
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/portal/dashboard'

  if (!code) {
    return NextResponse.redirect(`${origin}/portal/login?error=missing-code`)
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

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

  const { data: exchangeData, error } =
    await supabase.auth.exchangeCodeForSession(code)

  if (error || !exchangeData.session) {
    return NextResponse.redirect(
      `${origin}/portal/login?error=auth-callback-failed`
    )
  }

  const { session } = exchangeData

  // Detect password-reset flow via AMR (Authentication Method Reference).
  // Using session.user.amr is safer than the user-supplied `type` query param
  // because AMR is part of the signed JWT — it cannot be forged by an attacker.
  const amr = session.user.app_metadata?.provider === 'email'
    ? (session.amr as Array<{ method: string }> | undefined)
    : undefined
  const isRecovery = amr?.some((entry) => entry.method === 'recovery') ?? false

  // On first email confirmation, ensure the user has a free-tier subscription.
  // We do this here (server-side, after verified session exchange) rather than
  // from the client signup page, because the client has no session before
  // confirmation and cannot authenticate a write to member_subscriptions.
  if (serviceRoleKey) {
    const adminSupabase = createServerClient(supabaseUrl, serviceRoleKey, {
      cookies: { getAll: () => [], setAll: () => {} },
    })

    const { data: existing } = await adminSupabase
      .from('member_subscriptions')
      .select('id')
      .eq('user_id', session.user.id)
      .maybeSingle()

    if (!existing) {
      const { data: freeTier } = await adminSupabase
        .from('membership_tiers')
        .select('id')
        .eq('slug', 'free')
        .single()

      if (freeTier) {
        await adminSupabase.from('member_subscriptions').insert({
          user_id: session.user.id,
          tier_id: freeTier.id,
          status: 'active',
          start_date: new Date().toISOString(),
        })
      }
    }
  }

  if (isRecovery) {
    return NextResponse.redirect(`${origin}/portal/reset-password`)
  }

  return NextResponse.redirect(`${origin}${next}`)
}
