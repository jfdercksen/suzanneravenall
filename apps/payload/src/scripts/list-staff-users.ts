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

// A module (top-level await below), with nothing to export.
export {}

async function exitAfterFlush(code: number): Promise<never> {
  await new Promise<void>((resolve) => process.stdout.write('', () => process.stderr.write('', () => resolve())))
  process.exit(code)
}

let exitCode = 1
try {
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
  console.log(`Staff accounts: ${rows.length}`)
  for (const row of rows) {
    console.log(`  ${row.email ?? '(no email)'} | ${row.name ?? ''} | created ${row.createdAt ?? 'unknown'}`)
  }

  const expected = (process.env.EXPECT_STAFF ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  if (expected.length === 0) {
    exitCode = 0
  } else {
    const actual = rows.map((r) => (r.email ?? '').toLowerCase())
    const missing = expected.filter((e) => !actual.includes(e))
    const extra = actual.filter((e) => !expected.includes(e))
    if (missing.length === 0 && extra.length === 0) {
      console.log('MATCH: the Staff accounts are exactly the expected addresses.')
      exitCode = 0
    } else {
      if (missing.length) console.error(`Missing: ${missing.join(', ')}`)
      if (extra.length) console.error(`Not expected (change their Role in the CMS, Users): ${extra.join(', ')}`)
    }
  }
} catch (error: unknown) {
  console.error('Could not list:', error instanceof Error ? error.message : 'unknown error')
}
await exitAfterFlush(exitCode)
