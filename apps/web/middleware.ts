import { type NextRequest, NextResponse } from 'next/server'

// Routes that require authentication — expanded in Phase 3 when portal is built
const PROTECTED_PREFIXES = ['/portal']

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl

  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  )

  if (isProtected) {
    // Phase 3: replace this stub with Supabase session validation.
    // For now, redirect unauthenticated users to the home page.
    // The session check will read the Supabase auth cookie and verify it server-side.
    const sessionCookie = request.cookies.get('sb-access-token')

    if (!sessionCookie) {
      const loginUrl = new URL('/', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
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
