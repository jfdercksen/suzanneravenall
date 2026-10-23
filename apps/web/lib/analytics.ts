// Google Analytics helpers for the root layout (site check B17).
//
// Two go-live problems live here:
//   1. A placeholder measurement ID (G-XXXXXXXXXX) passes the plain GA4
//      format check, so the site loaded gtag and sent hits to a fake
//      property. isUsableGaId() rejects placeholders as well as malformed IDs,
//      and the layout renders no GA script at all when it returns false.
//   2. The quiz-invite link carries a private ?token= (an access token used as
//      a credential, see lib/quiz/subscriber.ts). GA records the full page URL
//      by default, so every token would be sent to Google. The init script
//      strips the query string from page_location (and page_referrer) on
//      /explore/<slug>/quiz and on any URL with a token param.

// GA4 IDs must be G- followed by uppercase alphanumerics. This also guards the
// inline script below against injection if the env var is ever compromised.
const GA_ID_PATTERN = /^G-[A-Z0-9]+$/
// Placeholder IDs as shipped in .env examples: all X's (G-XXXXXXXXXX) or all
// zeros. Neither is a real property.
const GA_PLACEHOLDER_PATTERN = /^G-(X+|0+)$/

export function isUsableGaId(id: string | undefined | null): id is string {
  if (!id) return false
  return GA_ID_PATTERN.test(id) && !GA_PLACEHOLDER_PATTERN.test(id)
}

// Pages whose query string must never reach analytics.
const PRIVATE_PATH_PATTERN = /^\/explore\/[^/]+\/quiz\/?$/
// email=: the order mail's portal links (/portal/signup?email=, H-13) must not
// send the buyer's address to GA or Clarity.
const TOKEN_PARAM_PATTERN = /[?&](token|email)=/i
// Pages whose PATH carries a secret (the intake form link /intake/<token>,
// the booking link /book/<token>): the token is replaced, whatever follows it
// is dropped. The bare /book page (the book) carries none and is left alone.
const TOKEN_PATH_PATTERN = /^([a-z][a-z0-9+.-]*:\/\/[^/]*)?\/(intake|book)\/[^?#]+/i

// Returns the URL with its query string and fragment removed when it belongs
// to a private page or carries a token param; otherwise returns it unchanged.
// The same logic is inlined (ES5) into the GA init script, which cannot import
// modules; lib/analytics.test.ts runs both against the same cases.
export function sanitiseAnalyticsUrl(href: string): string {
  if (!href) return href
  const tokenPath = TOKEN_PATH_PATTERN.exec(href)
  if (tokenPath) return `${tokenPath[1] ?? ''}/${(tokenPath[2] ?? '').toLowerCase()}/redacted`
  const queryStart = href.search(/[?#]/)
  if (queryStart === -1) return href
  const base = href.slice(0, queryStart)
  const path = base.replace(/^[a-z][a-z0-9+.-]*:\/\/[^/]*/i, '') || '/'
  if (PRIVATE_PATH_PATTERN.test(path) || TOKEN_PARAM_PATTERN.test(href)) {
    return base
  }
  return href
}

// Builds the inline gtag init script. Returns '' for an unusable ID so callers
// can skip rendering entirely. page_location / page_referrer are only passed
// when sanitising actually changed them, so ordinary pages keep GA's default
// behaviour.
export function buildGaInitScript(gaId: string): string {
  if (!isUsableGaId(gaId)) return ''
  return `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    var PRIVATE_PATH_PATTERN = ${PRIVATE_PATH_PATTERN.toString()};
    var TOKEN_PARAM_PATTERN = ${TOKEN_PARAM_PATTERN.toString()};
    var TOKEN_PATH_PATTERN = ${TOKEN_PATH_PATTERN.toString()};
    var sanitise = function (href) {
      if (!href) return href;
      var tokenPath = TOKEN_PATH_PATTERN.exec(href);
      if (tokenPath) return (tokenPath[1] || '') + '/' + tokenPath[2].toLowerCase() + '/redacted';
      var queryStart = href.search(/[?#]/);
      if (queryStart === -1) return href;
      var base = href.slice(0, queryStart);
      var path = base.replace(/^[a-z][a-z0-9+.-]*:\\/\\/[^/]*/i, '') || '/';
      if (PRIVATE_PATH_PATTERN.test(path) || TOKEN_PARAM_PATTERN.test(href)) {
        return base;
      }
      return href;
    };
    var gaConfig = {};
    var loc = window.location.href;
    var ref = document.referrer;
    if (sanitise(loc) !== loc) gaConfig.page_location = sanitise(loc);
    if (ref && sanitise(ref) !== ref) gaConfig.page_referrer = sanitise(ref);
    gtag('js', new Date());
    gtag('config', '${gaId}', gaConfig);
  `
}
