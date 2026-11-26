/**
 * The logo search engines show for the Organization JSON-LD on the homepage.
 * It must be a file that exists under public/ (go-live audit, 26 Nov 2026: the old
 * path /logos/suzanne-ravenall-logo.svg did not exist). The black logo, because
 * search results show it on a white ground.
 */
export const SITE_LOGO_PATH = '/logos/logo-black.svg'

export function siteLogoUrl(siteOrigin = 'https://suzanneravenall.com'): string {
  return `${siteOrigin.replace(/\/+$/, '')}${SITE_LOGO_PATH}`
}
