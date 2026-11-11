/**
 * WordPress → Payload blog migration: the IMPORT, with Payload's Local API.
 *
 * Runs inside the payload-tools container on the REVIEW box (never production):
 * it loads the real Payload config and writes with overrideAccess, so it needs
 * no admin login and no secret typed anywhere; DATABASE_URL and PAYLOAD_SECRET
 * come from the container env (infra/.env), and uploads land on the shared
 * payload_uploads volume the Payload server reads.
 *
 * Supported command (from infra/, tsx loader; --use-swc works too):
 *   cd /var/www/suzanneravenall/suzanneravenall/infra
 *   docker compose --profile tools build payload-tools
 *   # dry run (default): reads WordPress and Payload; writes no post and no media.
 *   # (Payload's own start-up still runs: onInit seeds the intake forms only into
 *   # an empty collection, and NODE_ENV=production keeps schema push off.)
 *   docker compose --profile tools run --rm payload-tools npx payload run src/scripts/migrate-wordpress.ts
 *   # import
 *   docker compose --profile tools run --rm -e DRY_RUN=false payload-tools npx payload run src/scripts/migrate-wordpress.ts
 *
 * Idempotent: posts are matched on slug (update in place), media on a
 * deterministic filename (never uploaded twice). The core (scope, AWeber
 * extraction, conversion) is shared with the local dry run:
 * apps/web/scripts/wordpress/migrate.ts.
 *
 * Loading (fixed 11 Nov after the review box run printed nothing and exited 0):
 *   - `payload run` imports this file and exits as soon as the import resolves,
 *     so the run is awaited at the top level (a bare run() was cut off);
 *   - the run module is imported dynamically inside try/catch, so a load
 *     failure prints the error and exits 1 instead of passing silently;
 *   - the shared core is unpacked from its CommonJS default export
 *     (wordpress/run.ts explains why).
 * Exit codes: 0 only when every selected post and image made it, 1 otherwise.
 */

// A module (top-level await below), with nothing to export.
export {}

const DRY_RUN = process.env.DRY_RUN !== 'false'

// Printed before anything loads, so a run that stops early is never silent.
console.log(`WordPress → Payload blog migration: ${DRY_RUN ? 'DRY RUN (nothing written)' : 'IMPORT'} with the Local API`)

/**
 * Exits once stdout and stderr have drained (`docker compose run` pipes them,
 * and a bare exit can cut the summary off). Awaited: when this file's import
 * resolves, the payload CLI exits 0 by itself, so the exit must happen first.
 */
async function exitAfterFlush(code: number): Promise<never> {
  await new Promise<void>((resolve) => process.stdout.write('', () => process.stderr.write('', () => resolve())))
  process.exit(code)
}

let exitCode = 1
try {
  const { run } = await import('./wordpress/run')
  const complete = await run(DRY_RUN)
  if (!complete) console.error('WordPress → Payload blog migration INCOMPLETE: see "notMigrated" and "missing images" above')
  exitCode = complete ? 0 : 1
} catch (error: unknown) {
  console.error('WordPress → Payload blog migration FAILED:')
  console.error(error)
}
await exitAfterFlush(exitCode)
