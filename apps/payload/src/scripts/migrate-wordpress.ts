/**
 * WordPress → Payload blog migration: the IMPORT, with Payload's Local API.
 *
 * Runs inside the payload-tools container on the REVIEW box (never production):
 * it loads the real Payload config and writes with overrideAccess, so it needs
 * no admin login and no secret typed anywhere; DATABASE_URL and PAYLOAD_SECRET
 * come from the container env (infra/.env), and uploads land on the shared
 * payload_uploads volume the Payload server reads.
 *
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
 */

import { JSDOM } from 'jsdom'
import { getPayload, type RequiredDataFromCollectionSlug } from 'payload'
import config from '../../payload.config'
import { WP_URL_DEFAULT, migrate } from '../../../web/scripts/wordpress/migrate'

const DRY_RUN = process.env.DRY_RUN !== 'false'

/** The core builds plain Lexical JSON; Payload's generated types describe it more loosely. */
const asBlogPost = (data: unknown) => data as RequiredDataFromCollectionSlug<'blog-posts'>

async function run(): Promise<void> {
  const payload = await getPayload({ config })
  console.log(`WordPress → Payload blog migration: ${DRY_RUN ? 'DRY RUN (nothing written)' : 'IMPORT'} with the Local API`)

  const result = await migrate({
    wpUrl: (process.env.WP_URL ?? WP_URL_DEFAULT).replace(/\/+$/, ''),
    dryRun: DRY_RUN,
    only: new Set((process.env.ONLY ?? '').split(',').map((s) => s.trim()).filter(Boolean)),
    parse: (html) => new JSDOM(html).window.document,
    media: {
      find: async (filename) => {
        const found = await payload.find({
          collection: 'media',
          where: { filename: { equals: filename } },
          limit: 1,
          depth: 0,
          overrideAccess: true,
        })
        return found.docs[0]?.id
      },
      create: async (file, alt) => {
        if (DRY_RUN) return `dry:${file.filename}`
        const doc = await payload.create({
          collection: 'media',
          data: { alt },
          file: { data: file.data, mimetype: file.mimetype, name: file.filename, size: file.data.length },
          overrideAccess: true,
        })
        return doc.id
      },
    },
    posts: {
      upsert: async (slug, data) => {
        const existing = await payload.find({
          collection: 'blog-posts',
          where: { slug: { equals: slug } },
          limit: 1,
          depth: 0,
          overrideAccess: true,
        })
        if (DRY_RUN) return 'dry-run'
        const doc = existing.docs[0]
        if (doc) {
          await payload.update({ collection: 'blog-posts', id: doc.id, data: asBlogPost(data), overrideAccess: true })
          return 'updated'
        }
        await payload.create({ collection: 'blog-posts', data: asBlogPost(data), overrideAccess: true })
        return 'created'
      },
    },
    log: (line) => console.log(line),
  })

  console.log(JSON.stringify(result.summary, null, 2))
  for (const post of result.posts) {
    if (post.images.missing.length > 0) console.log(`missing images in ${post.slug}: ${JSON.stringify(post.images.missing)}`)
  }
  // Not green when a post or an image did not make it.
  const incomplete = (result.summary.notMigrated as unknown[]).length > 0 || result.posts.some((p) => p.images.missing.length > 0)
  process.exit(incomplete ? 1 : 0)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
