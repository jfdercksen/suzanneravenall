/**
 * create-staff-user.ts: creates ONE CMS account with Role = Staff (KI125),
 * for when the admin screen cannot be used (KI135). The person running it
 * types the password at a hidden prompt; it is never an argument, an
 * environment variable or a line in the shell history, and is never printed.
 *
 * Run on the box from infra/, interactively (-it is required). Rebuild the
 * tools image first if this script changed (docker compose --profile tools
 * build payload-tools):
 *   docker compose --profile tools run --rm -it \
 *     -e STAFF_EMAIL=someone@example.com -e STAFF_NAME="First Last" \
 *     payload-tools npx payload run src/scripts/create-staff-user.ts
 *   echo $?
 *
 * Refuses, writing nothing: no terminal, a bad email or name, a password
 * under 12 characters or not typed the same twice, or an existing user with
 * that email (change that user's Role in the CMS instead). Needs the Staff
 * role in the database first: infra/scripts/migrations/payload-20261118-staff-role.sql.
 *
 * Always ends with one line, "Created: ..." or "Not created: ...", written
 * synchronously (lib/scriptResult.ts; 24 Nov 2026 a run ended silently).
 * Exit 0 only when the account was created.
 */

import readline from 'readline'
import { Writable } from 'stream'
import { createScriptResult, installScriptResult } from './lib/scriptResult'

// A module (top-level await below), with nothing to export.
export {}

const EMAIL = (process.env.STAFF_EMAIL ?? '').trim().toLowerCase()
const NAME = (process.env.STAFF_NAME ?? '').trim()
const MIN_PASSWORD = 12

const result = createScriptResult(
  'Not created: no result was reported. Check CMS, Users before trying again',
)
installScriptResult(result, 'Not created:')

result.step('Create a CMS Staff account (reads quiz, intake and Novice answers on the website)')

/** Reads one line from the terminal without echoing it. */
function askHidden(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const silent = new Writable({ write: (_chunk, _enc, done) => done() })
    const rl = readline.createInterface({ input: process.stdin, output: silent, terminal: true })
    process.stdout.write(prompt)
    rl.question('', (answer) => {
      rl.close()
      process.stdout.write('\n')
      resolve(answer)
    })
  })
}

try {
  if (!process.stdin.isTTY) {
    result.fail('Not created: run it interactively with "docker compose ... run --rm -it" so the password can be typed')
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(EMAIL)) {
    result.fail('Not created: set STAFF_EMAIL to the person’s email address')
  } else if (NAME.length < 2) {
    result.fail('Not created: set STAFF_NAME to the person’s name')
  } else {
    const password = await askHidden(`Password for ${EMAIL} (not shown, at least ${MIN_PASSWORD} characters): `)
    const again = await askHidden('Type it again: ')
    // The terminal is not needed any more; let the process end normally.
    process.stdin.pause()
    if (password.length < MIN_PASSWORD) {
      result.fail(`Not created: the password has fewer than ${MIN_PASSWORD} characters`)
    } else if (password !== again) {
      result.fail('Not created: the two passwords differ')
    } else {
      result.step('Connecting to the CMS database...')
      const { getPayload } = await import('payload')
      const { default: config } = await import('../../payload.config')
      const payload = await getPayload({ config })
      result.step(`Checking for an existing account for ${EMAIL}...`)
      const existing = await payload.find({ collection: 'users', where: { email: { equals: EMAIL } }, limit: 1, overrideAccess: true })
      if (existing.docs.length > 0) {
        result.fail(`Not created: a user with ${EMAIL} already exists; change its Role to Staff in the CMS, Users`)
      } else {
        result.step('Creating the account...')
        await payload.create({ collection: 'users', data: { email: EMAIL, password, name: NAME, role: 'staff' }, overrideAccess: true })
        result.ok(`Created: ${EMAIL}, Role = Staff. They log in at /cms/admin, then open /staff/novice.`)
      }
    }
  }
} catch (error: unknown) {
  // The message names the step that failed; the password is never part of it.
  result.fail(`Not created: ${error instanceof Error ? error.message : 'unknown error'}`)
}
process.exit(result.code())
