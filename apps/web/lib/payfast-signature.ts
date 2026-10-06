import { createHash } from 'crypto'

// PayFast signature, as PayFast's own PHP sample builds it: the fields in the
// order they are sent (NOT sorted; sorting is only for their REST API), empty
// values skipped, each value trimmed and encoded like PHP urlencode, then
// &passphrase=... when one is set, and the MD5 of that string.
// Used for the checkout form and for the ITN, where "the order sent" is the
// order of the fields in the ITN body. One difference: the checkout form
// leaves empty fields out, but the ITN signature covers EVERY field PayFast
// posts, empty ones included (PayFast's ITN sample does not skip them), so
// the ITN handler passes includeEmpty.

/** PHP urlencode: spaces as +, and !'()*~ percent-encoded too. */
export function pfEncode(value: string): string {
  return encodeURIComponent(value)
    .replace(/[!'()*~]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase())
    .replace(/%20/g, '+')
}

export function payfastSignature(
  params: Record<string, string>,
  passphrase: string,
  opts: { includeEmpty?: boolean } = {}
): string {
  const pairs = Object.entries(params)
    .filter(([, v]) => v != null && (opts.includeEmpty || v !== ''))
    .map(([k, v]) => `${k}=${pfEncode(String(v).trim())}`)
  if (passphrase) pairs.push(`passphrase=${pfEncode(passphrase.trim())}`)
  return createHash('md5').update(pairs.join('&')).digest('hex')
}
