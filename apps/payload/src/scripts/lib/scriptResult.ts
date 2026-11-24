import { writeSync } from 'fs'

/**
 * Result lines for the interactive CMS scripts (create-staff-user,
 * list-staff-users), written so they always reach the terminal.
 *
 * 24 Nov 2026: in a `docker compose run --rm -it` run, create-staff-user
 * printed its two password prompts and then nothing, no "Created:" and no
 * "Not created:", and no account existed. console.log/console.error are
 * asynchronous on a pipe or TTY in some setups and are lost when something
 * calls process.exit before they flush. Here every line is written with
 * fs.writeSync, to stdout (and failures to stderr too), and a process 'exit'
 * hook prints a fallback line and forces a non-zero exit code if the script
 * ends without a result, whoever ended it.
 */

export type Writer = (fd: 1 | 2, text: string) => void

const syncWriter: Writer = (fd, text) => {
  try {
    writeSync(fd, text)
  } catch {
    // Nothing more can be done if the terminal is gone.
  }
}

export interface ScriptResult {
  /** A progress line on stdout ("Checking ...") so a stop shows where it happened. */
  step: (line: string) => void
  /** The success line; sets exit code 0. */
  ok: (line: string) => void
  /** The failure line, on stdout and stderr; sets exit code 1. */
  fail: (line: string) => void
  /** The exit code to use: 0 only after ok(). */
  code: () => number
  /** What the 'exit' hook does: the fallback line when no result was given, and the code to exit with. */
  onExit: (exitCode: number) => number
}

export function createScriptResult(fallback: string, write: Writer = syncWriter): ScriptResult {
  let done: 'ok' | 'fail' | null = null
  return {
    step: (line) => write(1, `${line}\n`),
    ok: (line) => {
      done = 'ok'
      write(1, `${line}\n`)
    },
    fail: (line) => {
      done = 'fail'
      write(1, `${line}\n`)
      write(2, `${line}\n`)
    },
    code: () => (done === 'ok' ? 0 : 1),
    onExit: (exitCode) => {
      if (done === null) {
        const line = `${fallback} (the script stopped before it finished, exit code ${exitCode}).\n`
        write(1, line)
        write(2, line)
        return exitCode === 0 ? 1 : exitCode
      }
      return done === 'ok' ? exitCode : exitCode === 0 ? 1 : exitCode
    },
  }
}

/** Hooks the result into the process: the exit fallback and uncaught errors. */
export function installScriptResult(result: ScriptResult, failPrefix: string): void {
  process.on('exit', (exitCode) => {
    process.exitCode = result.onExit(exitCode)
  })
  const crash = (error: unknown) => {
    result.fail(`${failPrefix} ${error instanceof Error ? error.message : 'unknown error'}`)
    process.exit(1)
  }
  process.on('uncaughtException', crash)
  process.on('unhandledRejection', crash)
}
