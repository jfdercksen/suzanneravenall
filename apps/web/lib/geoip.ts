import { readFileSync, statSync } from 'fs'
import { Reader, type CountryResponse } from 'maxmind'

// The visitor's country from their IP address (D021): South Africa = ZAR,
// anywhere else = USD. The database is DB-IP "IP to Country Lite" (CC BY 4.0,
// credited in the privacy policy), downloaded monthly on the box by
// infra/scripts/geoip/update-dbip.sh into infra/geoip/ and mounted read-only
// into the web container. MaxMind-format file, so the maxmind reader reads it.
//
// Server only (fs): the middleware runs on the edge and cannot use this.

const DEFAULT_PATH = '/data/geoip/dbip-country-lite.mmdb'
// Pick up the monthly refresh without a restart.
const RECHECK_MS = 60 * 60 * 1000

interface HeaderReader {
  get(name: string): string | null
}

let reader: Reader<CountryResponse> | null = null
let loadedMtime = 0
let checkedAt = 0

function getReader(): Reader<CountryResponse> | null {
  const now = Date.now()
  // Without a database yet (container started before the first download),
  // look again soon rather than in an hour.
  if (now - checkedAt < (reader ? RECHECK_MS : 30_000)) return reader
  checkedAt = now
  const path = process.env.GEOIP_DB_PATH || DEFAULT_PATH
  try {
    const mtime = statSync(path).mtimeMs
    if (!reader || mtime !== loadedMtime) {
      reader = new Reader<CountryResponse>(readFileSync(path))
      loadedMtime = mtime
    }
  } catch {
    // No database (local dev, or not downloaded yet): fall back to the
    // browser signals in lib/visitor-region.ts. Keep the last good reader.
  }
  return reader
}

/**
 * The client IP as our own nginx saw it. X-Real-IP is set by nginx from the
 * TCP peer, so a visitor cannot forge it; X-Forwarded-For is only a fallback
 * (its last entry is the one nginx appended).
 */
export function clientIp(headers: HeaderReader): string {
  const real = headers.get('x-real-ip')?.trim()
  if (real) return real
  const forwarded = headers.get('x-forwarded-for')?.split(',').map((s) => s.trim()).filter(Boolean) ?? []
  return forwarded[forwarded.length - 1] ?? ''
}

/** ISO country code (upper case) for the request's IP, or '' when unknown. */
export function ipCountry(headers: HeaderReader): string {
  const ip = clientIp(headers)
  if (!ip) return ''
  const db = getReader()
  if (!db) return ''
  try {
    return db.get(ip)?.country?.iso_code?.toUpperCase() ?? ''
  } catch {
    // Not a valid IP string.
    return ''
  }
}

/** Test hook: forget the cached database. */
export function resetGeoipForTests(): void {
  reader = null
  loadedMtime = 0
  checkedAt = 0
}
