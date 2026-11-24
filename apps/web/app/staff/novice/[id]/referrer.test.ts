import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { describe, expect, it } from 'vitest'

/**
 * KI138 (24 Nov 2026): under Referrer-Policy no-referrer a browser sends
 * "Origin: null" on a form post (Fetch spec, serializing a request origin),
 * so the decision route's same-origin check refused every Approve with 403.
 * The pages carrying the decision form must use a policy that keeps the
 * Origin for same-origin requests. Read from source: the page module pulls in
 * server-only code that a unit test cannot load.
 */
const here = dirname(fileURLToPath(import.meta.url))
const pages = {
  application: readFileSync(join(here, 'page.tsx'), 'utf8'),
  list: readFileSync(join(here, '..', 'page.tsx'), 'utf8'),
}

describe('Novice staff pages referrer policy (KI138)', () => {
  for (const [name, source] of Object.entries(pages)) {
    it(`the ${name} page uses same-origin, never no-referrer`, () => {
      expect(source).toMatch(/referrer: 'same-origin'/)
      expect(source).not.toMatch(/referrer: 'no-referrer'/)
    })
  }

  it('the application page still posts the decision form to the Origin-checked route', () => {
    expect(pages.application).toMatch(/method="post"|method='post'|method=\{?["']post["']/i)
    expect(pages.application).toContain('/decision')
  })
})
