import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/middleware'

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

  return expireLegacyCookies(request, supabaseResponse)
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
