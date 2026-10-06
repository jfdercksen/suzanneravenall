import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

function accessTokenAmr(accessToken: string): string[] {
  try {
    const payload = accessToken.split('.')[1] ?? ''
    const json = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      amr?: Array<{ method?: string } | string>
    }
    return (json.amr ?? []).map((e) => (typeof e === 'string' ? e : e.method ?? ''))
  } catch {
    return []
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  // Use the configured site URL rather than deriving from request.url.
  // In Docker behind Nginx, request.url resolves to http://0.0.0.0:3000
  // because Next.js uses the server's bind address, not the forwarded Host header.
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ??
    `${request.nextUrl.protocol}//${request.nextUrl.host}`
  const code = searchParams.get('code')
  const rawNext = searchParams.get('next') ?? '/portal/dashboard'
  const next =
    rawNext.startsWith('/') && !rawNext.startsWith('//')
      ? rawNext
      : '/portal/dashboard'

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

  // Detect the password-reset flow via the AMR (Authentication Method
  // Reference) claim. AMR lives in the access token, not on the Session
  // object: reading session.amr was always undefined, so every reset link
  // logged the member in and skipped the new-password step (6 Oct live test).
  // The token comes straight from GoTrue's code exchange above, server to
  // server, so its payload is trusted here; the user-supplied `type` query
  // param is still ignored.
  const isRecovery = accessTokenAmr(session.access_token).includes('recovery')

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
