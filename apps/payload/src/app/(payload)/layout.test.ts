import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { describe, expect, it } from 'vitest'

/**
 * KI004 (CSS half, 23 Nov 2026): the admin rendered unstyled because the
 * (payload) layout never imported Payload's base stylesheet. The served CSS
 * then held only component rules, no :root theme variables and no font.
 * The after-deploy check of the served CSS is in infra/DEPLOYMENT.md.
 */
const here = dirname(fileURLToPath(import.meta.url))
const layout = readFileSync(join(here, 'layout.tsx'), 'utf8')

describe('Payload admin layout', () => {
  it("imports Payload's base admin stylesheet, as Payload's own template does", () => {
    expect(layout).toMatch(/^import '@payloadcms\/next\/css'$/m)
  })

  it('renders through Payload RootLayout with the server functions, as the template does', () => {
    expect(layout).toContain("from '@payloadcms/next/layouts'")
    expect(layout).toMatch(/<RootLayout config=\{config\} importMap=\{importMap\} serverFunction=\{serverFunction\}>/)
  })
})
