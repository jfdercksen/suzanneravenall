import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/middleware'
import {
  CURRENCY_AUTO_COOKIE,
  CURRENCY_COOKIE,
  CURRENCY_COOKIE_MAX_AGE,
  detectCurrency,
  parseCurrency,
} from '@/lib/visitor-region'

const PROTECTED_PREFIXES = ['/portal']

// Session cookies from the hosted-Supabase era (pre-migration). Combined with the
// new session they can push the Cookie header past nginx's buffer size, so expire
// them on every response until they have washed out of members' browsers.
const LEGACY_COOKIE_PREFIX = 'sb-mjhwonoekokxyisfljtj-'

// These paths live under /portal but do not require authentication
const PUBLIC_PORTAL_PATHS = [
  '/portal/login',
  '/portal/signup',
  '/portal/callback',
  '/portal/forgot-password',
  '/portal/reset-password',
]

function expireLegacyCookies(request: NextRequest, response: NextResponse): NextResponse {
  for (const cookie of request.cookies.getAll()) {
    if (cookie.name.startsWith(LEGACY_COOKIE_PREFIX)) {
      response.cookies.delete(cookie.name)
    }
  }
  return response
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl

  // Refresh the Supabase session on every request so cookies stay valid
  const { supabase, supabaseResponse } = createClient(request)

  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname === prefix || pathname.startsWith(prefix + '/')
  )

  if (isProtected) {
    const isPublicPortalPath = PUBLIC_PORTAL_PATHS.some((p) =>
      pathname.startsWith(p)
    )

    if (!isPublicPortalPath) {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        const loginUrl = new URL('/portal/login', request.url)
        const safeRedirect =
          pathname.startsWith('/') && !pathname.startsWith('//')
            ? pathname
            : '/portal/dashboard'
        loginUrl.searchParams.set('redirect', safeRedirect)
        return expireLegacyCookies(request, NextResponse.redirect(loginUrl))
      }
    }
  }

  return rememberCurrency(request, expireLegacyCookies(request, supabaseResponse))
}

// First visit: store the currency guess (D021) so the cart, the shop and the
// product page all read the same answer. The auto flag marks it as a guess the
// client may correct once; a choice made with the switcher replaces both.
// The master switch is applied where the cookie is read, not here.
function rememberCurrency(request: NextRequest, response: NextResponse): NextResponse {
  if (parseCurrency(request.cookies.get(CURRENCY_COOKIE)?.value)) return response
  // Pages only: not API calls (webhooks, ITNs) and not files (images, fonts).
  const { pathname } = request.nextUrl
  if (pathname.startsWith('/api/') || /\.[a-z0-9]+$/i.test(pathname)) return response
  const secure = request.headers.get('x-forwarded-proto') === 'https' || request.nextUrl.protocol === 'https:'
  const options = { path: '/', maxAge: CURRENCY_COOKIE_MAX_AGE, sameSite: 'lax' as const, secure }
  response.cookies.set(CURRENCY_COOKIE, detectCurrency(request.headers), options)
  response.cookies.set(CURRENCY_AUTO_COOKIE, '1', options)
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimisation)
     * - favicon.ico, sitemap.xml, robots.txt
     * - api/health (must be publicly accessible for Docker health checks)
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|api/health).*)',
  ],
}
