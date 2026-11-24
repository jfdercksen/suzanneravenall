/**
 * list-staff-users.ts: prints every CMS account with Role = Staff (the only
 * role that opens /staff/submissions and /staff/novice), so the team can check
 * it is exactly the people meant (Suzanne's brief of 20 Nov 2026: Suzanne and
 * Shayna, nobody else). Read only; prints email, name and creation date, never
 * a password or token.
 *
 * Run on the box from infra/:
 *   docker compose --profile tools run --rm payload-tools npx payload run src/scripts/list-staff-users.ts
 *
 * Optional: EXPECT_STAFF="a@x.com,b@y.com" makes it exit 1 unless the Staff
 * accounts are exactly those addresses (any order, any case).
 */

import { createScriptResult, installScriptResult } from './lib/scriptResult'

// A module (top-level await below), with nothing to export.
export {}

// Lines written synchronously, with a fallback if the run ends without a result (lib/scriptResult.ts).
const result = createScriptResult('Could not list: no result was reported')
installScriptResult(result, 'Could not list:')

try {
  result.step('Connecting to the CMS database...')
  const { getPayload } = await import('payload')
  const { default: config } = await import('../../payload.config')
  const payload = await getPayload({ config })
  const found = await payload.find({
    collection: 'users',
    where: { role: { equals: 'staff' } },
    limit: 100,
    overrideAccess: true,
    sort: 'email',
  })
  if (found.hasNextPage) throw new Error('more than 100 Staff accounts; this check reads only the first 100')
  const rows = found.docs as Array<{ email?: string; name?: string; createdAt?: string }>
  result.step(`Staff accounts: ${rows.length}`)
  for (const row of rows) {
    result.step(`  ${row.email ?? '(no email)'} | ${row.name ?? ''} | created ${row.createdAt ?? 'unknown'}`)
  }

  const expected = (process.env.EXPECT_STAFF ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  if (expected.length === 0) {
    result.ok('Listed.')
  } else {
    const actual = rows.map((r) => (r.email ?? '').toLowerCase())
    const missing = expected.filter((e) => !actual.includes(e))
    const extra = actual.filter((e) => !expected.includes(e))
    if (missing.length === 0 && extra.length === 0) {
      result.ok('MATCH: the Staff accounts are exactly the expected addresses.')
    } else {
      const parts = [missing.length ? `Missing: ${missing.join(', ')}` : '', extra.length ? `Not expected (change their Role in the CMS, Users): ${extra.join(', ')}` : ''].filter(Boolean)
      result.fail(`NO MATCH. ${parts.join('. ')}`)
    }
  }
} catch (error: unknown) {
  result.fail(`Could not list: ${error instanceof Error ? error.message : 'unknown error'}`)
}
process.exit(result.code())
