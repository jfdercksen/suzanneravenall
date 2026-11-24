import { describe, expect, it } from 'vitest'
import { createScriptResult, type Writer } from './scriptResult'

function capture() {
  const out: string[] = []
  const err: string[] = []
  const write: Writer = (fd, text) => (fd === 1 ? out : err).push(text)
  return { out, err, write }
}

describe('createScriptResult (create-staff-user ended silently, 24 Nov 2026)', () => {
  it('writes the success line to stdout and exits 0', () => {
    const c = capture()
    const r = createScriptResult('Not created: no result', c.write)
    r.step('Creating the account...')
    r.ok('Created: a@b.com, Role = Staff.')
    expect(c.out).toEqual(['Creating the account...\n', 'Created: a@b.com, Role = Staff.\n'])
    expect(c.err).toEqual([])
    expect(r.code()).toBe(0)
    expect(r.onExit(0)).toBe(0)
  })

  it('writes a failure to stdout and stderr and exits 1', () => {
    const c = capture()
    const r = createScriptResult('Not created: no result', c.write)
    r.fail('Not created: the two passwords differ')
    expect(c.out).toEqual(['Not created: the two passwords differ\n'])
    expect(c.err).toEqual(['Not created: the two passwords differ\n'])
    expect(r.code()).toBe(1)
  })

  it('prints the fallback and forces a non-zero code when the process ends with no result, even on exit 0', () => {
    const c = capture()
    const r = createScriptResult('Not created: no result was reported. Check CMS, Users', c.write)
    r.step('Connecting to the CMS database...')
    expect(r.onExit(0)).toBe(1)
    expect(c.out.at(-1)).toBe('Not created: no result was reported. Check CMS, Users (the script stopped before it finished, exit code 0).\n')
    expect(c.err.at(-1)).toContain('stopped before it finished')
  })

  it('keeps a non-zero exit code, and never turns a failure into exit 0', () => {
    const c = capture()
    const r = createScriptResult('x', c.write)
    expect(r.onExit(7)).toBe(7)
    r.fail('Not created: boom')
    expect(r.onExit(0)).toBe(1)
  })

  it('prints no fallback once a result was given', () => {
    const c = capture()
    const r = createScriptResult('FALLBACK', c.write)
    r.ok('Created: x')
    r.onExit(0)
    expect(c.out.join('')).not.toContain('FALLBACK')
  })
})
