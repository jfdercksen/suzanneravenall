import { readdirSync, readFileSync, statSync } from 'fs'
import { join, relative, resolve, dirname, sep } from 'path'
import { describe, expect, it } from 'vitest'

/**
 * KI089: Medusa's workflow loader imports every file in src/workflows outside
 * the require cache, so a second import of the same file from a route,
 * subscriber or job composes the workflow twice. On 20 Oct 2026 that left
 * every cart completion half done (order created, no payment, store route
 * 409). A workflow with a caller of its own lives beside that caller instead.
 *
 * Only relative specifiers can reach src/workflows: the one tsconfig path
 * alias is @suzanne/integrations.
 */

const SRC = resolve(__dirname, '..')
const WORKFLOWS = join(SRC, 'workflows')

const insideWorkflows = (path: string) => path === WORKFLOWS || path.startsWith(WORKFLOWS + sep)

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return name === '__tests__' ? [] : sourceFiles(path)
    return /\.(ts|tsx|js|mjs|cjs|mts|cts)$/.test(name) && !/\.(test|spec)\.\w+$/.test(name) ? [path] : []
  })
}

/** Every module specifier in a file: `from '...'`, bare `import '...'`, `import(...)`, `require(...)`. */
export function importsOf(text: string): string[] {
  return [...text.matchAll(/(?:\bfrom\s*|\bimport\s*\(?\s*|\brequire\s*\(\s*)['"]([^'"]+)['"]/g)].map((m) => m[1])
}

/** Imports from a file outside src/workflows that land inside it. */
export function workflowImports(file: string, specs: string[]): string[] {
  if (insideWorkflows(file)) return []
  return specs.filter((spec) => spec.startsWith('.') && insideWorkflows(resolve(dirname(file), spec)))
}

describe('workflow imports', () => {
  it('no source file outside src/workflows imports from src/workflows', () => {
    const offenders = sourceFiles(SRC).flatMap((file) =>
      workflowImports(file, importsOf(readFileSync(file, 'utf8'))).map((spec) => `${relative(SRC, file)} -> ${spec}`)
    )
    expect(offenders).toEqual([])
  })

  it('catches named, bare, dynamic and require imports into src/workflows', () => {
    const route = join(SRC, 'api', 'admin', 'x', 'route.ts')
    const text = [
      `import { a } from "../../../workflows/a"`,
      `import "../../../workflows/b"`,
      `const c = await import('../../../workflows/c')`,
      `const d = require("../../../workflows/d")`,
      `import { e } from "../../../workflows-old/e"`,
      `import { f } from "@medusajs/core-flows"`,
    ].join('\n')
    expect(workflowImports(route, importsOf(text))).toEqual([
      '../../../workflows/a',
      '../../../workflows/b',
      '../../../workflows/c',
      '../../../workflows/d',
    ])
  })

  it('lets files inside src/workflows import each other', () => {
    expect(workflowImports(join(WORKFLOWS, 'a.ts'), ['./b'])).toEqual([])
  })
})
