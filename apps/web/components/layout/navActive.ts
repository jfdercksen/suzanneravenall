// Root path only matches itself; every other href also matches its own sub-routes
// so e.g. /resources stays highlighted on /resources/articles.
// The pathname never carries a hash or query, so those are stripped from the
// href first: /services#private is active on /services (site check M7).
export function isActivePath(pathname: string, href: string): boolean {
  const path = href.split(/[?#]/)[0] || '/'
  if (path === '/') return pathname === '/'
  return pathname === path || pathname.startsWith(`${path}/`)
}
