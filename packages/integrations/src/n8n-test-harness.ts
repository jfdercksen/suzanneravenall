/**
 * Runs the JavaScript of an n8n workflow's Code nodes in tests, with stubbed
 * $, $input, $env and this.helpers, so parity tests compare the workflow's
 * own output with ours. Tests only, never imported at runtime.
 */

import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const nodeRequire = createRequire(import.meta.url)

type N8nNode = { name: string; type: string; parameters: Record<string, unknown> }

export function loadWorkflow(file: string) {
  const path = fileURLToPath(new URL(`../../../infra/n8n/workflows/${file}`, import.meta.url))
  const workflow = JSON.parse(readFileSync(path, 'utf8')) as { nodes: N8nNode[]; connections: Record<string, unknown> }

  function params(name: string): Record<string, unknown> {
    const node = workflow.nodes.find((n) => n.name === name)
    if (!node) throw new Error(`n8n node not found: ${name}`)
    return node.parameters
  }

  type Ctx = {
    input: unknown
    nodes?: Record<string, unknown>
    env?: Record<string, string>
    helpers?: { httpRequest: (req: Record<string, unknown>) => Promise<unknown> }
  }

  function args(ctx: Ctx) {
    const $ = (node: string) => ({ first: () => ({ json: ctx.nodes?.[node] }) })
    const $input = { first: () => ({ json: ctx.input }) }
    return [$, $input, ctx.env ?? {}, (mod: string) => (mod === 'crypto' ? nodeRequire('node:crypto') : {})] as const
  }

  /** Synchronous Code node; returns the first item's json. */
  function run(name: string, ctx: Ctx): Record<string, unknown> {
    const code = params(name).jsCode as string
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const fn = new Function('$', '$input', '$env', 'require', code) as (...a: unknown[]) => Array<{ json: Record<string, unknown> }>
    return fn.call({ helpers: ctx.helpers }, ...args(ctx))[0]!.json
  }

  /** Code node with top-level await (n8n wraps every Code node in an async function). */
  async function runAsync(name: string, ctx: Ctx): Promise<Record<string, unknown>> {
    const code = params(name).jsCode as string
    const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor as new (...a: string[]) => (
      ...a: unknown[]
    ) => Promise<Array<{ json: Record<string, unknown> }>>
    const fn = new AsyncFunction('$', '$input', '$env', 'require', code)
    return (await fn.call({ helpers: ctx.helpers }, ...args(ctx)))[0]!.json
  }

  return { workflow, params, run, runAsync }
}
