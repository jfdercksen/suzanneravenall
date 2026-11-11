/**
 * The import run itself, loaded by ../migrate-wordpress.ts (the entry).
 *
 * The shared core lives in apps/web, a package with no "type" field, so how a
 * loader sees it depends on the Node version and the loader: on the box (Node
 * 20) both tsx and swc load it as CommonJS and an ESM named import fails at
 * link time; on Node 22+ it is detected as ESM and its extension-less imports
 * fail instead (11 Nov, see the worklog). So it is not imported as source at
 * all: loadCore bundles it (with the converter and the Lexical helpers) into
 * one plain ESM file with esbuild, which tsx brings along, and imports that.
 * Same code as the local dry run, one unambiguous module format everywhere.
 */

import { existsSync } from 'node:fs'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { build } from 'esbuild'
import { JSDOM } from 'jsdom'
import { getPayload, type RequiredDataFromCollectionSlug } from 'payload'
import config from '../../../payload.config'

type Core = typeof import('../../../../web/scripts/wordpress/migrate')

/** The shared core source, from apps/payload/src/scripts/wordpress. */
export const CORE_ENTRY = fileURLToPath(new URL('../../../../web/scripts/wordpress/migrate.ts', import.meta.url))

/**
 * Bundles the shared core into one ESM file in a private temp folder, loads it
 * and removes the folder (the module stays loaded). The core imports only
 * relative files and node builtins, so nothing is left external.
 */
export async function loadCore(): Promise<Core> {
  if (!existsSync(CORE_ENTRY)) {
    throw new Error(`the shared migration core is missing at ${CORE_ENTRY} (apps/web must be in the image, as in the payload-tools target)`)
  }
  const dir = await mkdtemp(join(tmpdir(), 'wordpress-migration-'))
  try {
    const outfile = join(dir, 'core.mjs')
    await build({
      entryPoints: [CORE_ENTRY],
      bundle: true,
      platform: 'node',
      format: 'esm',
      target: 'node20',
      outfile,
      logLevel: 'error',
    })
    return unpackCore(await import(pathToFileURL(outfile).href))
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}

/** The shared core as loaded: CommonJS (module.exports on .default) or ESM. */
export function unpackCore(loaded: unknown): Core {
  const ns = loaded as Core & { default?: Core }
  const core = ns.default && typeof ns.default.migrate === 'function' ? ns.default : ns
  if (typeof core.migrate !== 'function') throw new Error('the WordPress migration core did not load (no migrate export)')
  return core
}

/** The core builds plain Lexical JSON; Payload's generated types describe it more loosely. */
const asBlogPost = (data: unknown) => data as RequiredDataFromCollectionSlug<'blog-posts'>

/** Runs the migration. Returns true when every selected post and image made it. */
export async function run(dryRun: boolean): Promise<boolean> {
  const { WP_URL_DEFAULT, makeParser, migrate } = await loadCore()
  const payload = await getPayload({ config })

  const result = await migrate({
    wpUrl: (process.env.WP_URL ?? WP_URL_DEFAULT).replace(/\/+$/, ''),
    dryRun,
    only: new Set((process.env.ONLY ?? '').split(',').map((s) => s.trim()).filter(Boolean)),
    // The shared parser (never closes the window: see makeParser in the core).
    parse: makeParser(JSDOM),
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
        if (dryRun) return `dry:${file.filename}`
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
        if (dryRun) return 'dry-run'
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
  return (result.summary.notMigrated as unknown[]).length === 0 && result.posts.every((p) => p.images.missing.length === 0)
}
