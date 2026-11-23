/**
 * create-staff-user.ts: creates ONE CMS account with Role = Staff (KI125),
 * for when the admin screen cannot be used (KI135). The person running it
 * types the password at a hidden prompt; it is never an argument, an
 * environment variable or a line in the shell history, and is never printed.
 *
 * Run on the box from infra/, interactively (-it is required):
 *   docker compose --profile tools run --rm -it \
 *     -e STAFF_EMAIL=someone@example.com -e STAFF_NAME="First Last" \
 *     payload-tools npx payload run src/scripts/create-staff-user.ts
 *
 * Refuses, writing nothing: no terminal, a bad email or name, a password
 * under 12 characters or not typed the same twice, or an existing user with
 * that email (change that user's Role in the CMS instead). Needs the Staff
 * role in the database first: infra/scripts/migrations/payload-20261118-staff-role.sql.
 * Exit 0 only when the account was created.
 */

import readline from 'readline'
import { Writable } from 'stream'

// A module (top-level await below), with nothing to export.
export {}

const EMAIL = (process.env.STAFF_EMAIL ?? '').trim().toLowerCase()
const NAME = (process.env.STAFF_NAME ?? '').trim()
const MIN_PASSWORD = 12

console.log('Create a CMS Staff account (reads quiz, intake and Novice answers on the website)')

async function exitAfterFlush(code: number): Promise<never> {
  await new Promise<void>((resolve) => process.stdout.write('', () => process.stderr.write('', () => resolve())))
  process.exit(code)
}

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

function refuse(reason: string): void {
  console.error(`Not created: ${reason}`)
}

let exitCode = 1
try {
  if (!process.stdin.isTTY) {
    refuse('run it interactively with "docker compose ... run --rm -it" so the password can be typed')
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(EMAIL)) {
    refuse('set STAFF_EMAIL to the person’s email address')
  } else if (NAME.length < 2) {
    refuse('set STAFF_NAME to the person’s name')
  } else {
    const password = await askHidden(`Password for ${EMAIL} (not shown, at least ${MIN_PASSWORD} characters): `)
    const again = await askHidden('Type it again: ')
    if (password.length < MIN_PASSWORD) {
      refuse(`the password has fewer than ${MIN_PASSWORD} characters`)
    } else if (password !== again) {
      refuse('the two passwords differ')
    } else {
      const { getPayload } = await import('payload')
      const { default: config } = await import('../../payload.config')
      const payload = await getPayload({ config })
      const existing = await payload.find({ collection: 'users', where: { email: { equals: EMAIL } }, limit: 1, overrideAccess: true })
      if (existing.docs.length > 0) {
        refuse(`a user with ${EMAIL} already exists; change its Role to Staff in the CMS, Users`)
      } else {
        await payload.create({ collection: 'users', data: { email: EMAIL, password, name: NAME, role: 'staff' }, overrideAccess: true })
        console.log(`Created: ${EMAIL}, Role = Staff. They log in at /cms/admin, then open /staff/novice.`)
        exitCode = 0
      }
    }
  }
} catch (error: unknown) {
  // The message names the step that failed; the password is never part of it.
  console.error('Not created:', error instanceof Error ? error.message : 'unknown error')
}
await exitAfterFlush(exitCode)
