/**
 * WordPress → Payload blog migration: LOCAL DRY RUN (reads only, no Payload).
 *
 * Checks every post, AWeber page and image the import would use, and writes
 *   - scripts/output/wordpress-migration-report.json (gitignored), and
 *   - data/wordpress-redirects.json (old root URL → /blog/<slug>, read by
 *     next.config.mjs; commit it).
 * The import itself runs inside the payload-tools container with Payload's
 * Local API: apps/payload/src/scripts/migrate-wordpress.ts.
 *
 * Run from apps/web:  npx tsx scripts/migrate-wordpress.ts
 * Optional: ONLY=slug-a,slug-b
 */

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { JSDOM } from 'jsdom'
import { WP_URL_DEFAULT, migrate } from './wordpress/migrate'

// Re-exported for the tests.
export { APP_ROUTES, blogSlug, decide, mediaFilename, redirectSource, redirectSources } from './wordpress/migrate'

const HERE = dirname(fileURLToPath(import.meta.url))

async function main(): Promise<void> {
  console.log('WordPress → Payload blog migration: local DRY RUN (no Payload, nothing written to it)')
  const result = await migrate({
    wpUrl: (process.env.WP_URL ?? WP_URL_DEFAULT).replace(/\/+$/, ''),
    dryRun: true,
    only: new Set((process.env.ONLY ?? '').split(',').map((s) => s.trim()).filter(Boolean)),
    parse: (html) => new JSDOM(html).window.document,
    media: { find: async () => undefined, create: async (file) => `dry:${file.filename}` },
    posts: { upsert: async () => 'dry-run' },
    log: (line) => console.log(line),
  })
  mkdirSync(join(HERE, 'output'), { recursive: true })
  writeFileSync(join(HERE, 'output', 'wordpress-migration-report.json'), JSON.stringify(result, null, 2))
  // The committed redirect list comes only from a full, clean run: an ONLY subset
  // or a post that failed (AWeber down) would cut redirects out of it.
  const failed = (result.summary.notMigrated as unknown[]).length
  if (process.env.ONLY) console.log('ONLY set: data/wordpress-redirects.json left as it is')
  else if (failed > 0) console.log(`${failed} post(s) not migrated: data/wordpress-redirects.json left as it is`)
  else writeFileSync(join(HERE, '..', 'data', 'wordpress-redirects.json'), `${JSON.stringify(result.redirects, null, 2)}\n`)
  console.log(JSON.stringify(result.summary, null, 2))
  if (failed > 0) process.exitCode = 1
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
