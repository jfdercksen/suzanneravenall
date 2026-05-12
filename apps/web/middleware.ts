import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/middleware'

const PROTECTED_PREFIXES = ['/portal']

// These paths live under /portal but do not require authentication
const PUBLIC_PORTAL_PATHS = [
  '/portal/login',
  '/portal/signup',
  '/portal/callback',
  '/portal/forgot-password',
  '/portal/reset-password',
]

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
        return NextResponse.redirect(loginUrl)
      }
    }
  }

  return supabaseResponse
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
