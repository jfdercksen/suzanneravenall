/**
 * Per-automation cutover switch (docs/n8n-migration-plan.md section 5).
 *   n8n  - the old n8n webhook does the work
 *   code - our own code does the work
 *   off  - nobody does it
 * Exactly one path runs per call, so n8n and code never both fire.
 * Read at call time, so a flip is an env change plus a container recreate.
 */

export type AutomationMode = 'n8n' | 'code' | 'off'

const MODES: readonly AutomationMode[] = ['n8n', 'code', 'off']

/**
 * Reads the first set env var of `names`. Unknown values fall back to
 * `fallback` with a warning, so a typo can never switch both paths on.
 */
export function automationMode(
  names: string[],
  fallback: AutomationMode,
  env: Record<string, string | undefined> = process.env,
): AutomationMode {
  for (const name of names) {
    const raw = (env[name] ?? '').trim().toLowerCase()
    if (!raw) continue
    if ((MODES as readonly string[]).includes(raw)) return raw as AutomationMode
    console.warn(`[automation] ${name}="${raw}" is not one of ${MODES.join(', ')}; using "${fallback}"`)
    return fallback
  }
  return fallback
}
