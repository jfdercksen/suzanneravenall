import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('@/lib/log', () => ({ logError: vi.fn(), logWarn: vi.fn() }))

import {
  isInPerson,
  cancelIntakesForOrder,
  createIntakesForOrder,
  loadIntakePage,
  runIntakeReminders,
  submitIntake,
  type IntakeDeps,
} from './service'
import { reminderDelays } from './schedule'
import type * as storeModule from './store'
import type { IntakeForm, IntakeRecord } from './types'

const MIN = 60_000
const DAY = 86_400_000
const T0 = new Date('2026-10-21T08:00:00Z')

const STANDARD: IntakeForm = {
  id: '1',
  formKey: 'standard',
  title: 'Client intake form',
  active: true,
  isDefault: true,
  services: [{ productHandle: 'rapid-repatterning-session', label: 'Rapid Repatterning Session', introduction: 'RR intro' }],
  intro: 'Please fill in the form.',
  acknowledgement: 'I acknowledge.',
  recipientEmail: null,
  fields: [{ id: 'name', type: 'text', label: 'Full name', helpText: null, options: [], required: true, withDetail: false }],
}
const EXEC: IntakeForm = {
  ...STANDARD,
  id: '2',
  formKey: 'executive-transformational-coaching',
  isDefault: false,
  services: [{ productHandle: 'executive-coaching-30-mins', label: 'Executive Coaching Session', introduction: null }],
}

/** An in-memory intake_submissions with the same conditional-update rules as store.ts. */
function memoryStore() {
  const rows: IntakeRecord[] = []
  let seq = 0
  const s = {
    rows,
    upsertIntakeRecord: async (row: storeModule.NewIntakeRecord) => {
      const existing = rows.find((r) => r.order_id === row.order_id && r.service_key === row.service_key)
      if (existing) return { record: { ...existing }, created: false }
      const record: IntakeRecord = {
        ...row,
        id: `id${++seq}`,
        status: 'pending',
        intake_sent_at: null,
        reminders_sent: 0,
        last_reminder_at: null,
        answers: null,
        completed_at: null,
        cancelled_at: null,
        team_notified_at: null,
        send_failures: 0,
        created_at: clock.now.toISOString(),
      }
      rows.push(record)
      return { record: { ...record }, created: true }
    },
    claimIntakeSend: async (id: string, now: Date) => {
      const r = rows.find((x) => x.id === id && x.status === 'pending' && !x.intake_sent_at)
      if (!r) return false
      r.intake_sent_at = now.toISOString()
      return true
    },
    releaseIntakeSend: async (id: string) => {
      const r = rows.find((x) => x.id === id)
      if (r) r.intake_sent_at = null
    },
    recordSendFailure: async (id: string, previous: number) => {
      const r = rows.find((x) => x.id === id && x.send_failures === previous)
      if (r) r.send_failures = previous + 1
      return previous + 1
    },
    getIntakeByToken: async (token: string) => {
      const r = rows.find((x) => x.token === token)
      return r ? { ...r } : null
    },
    listUnsentIntakes: async (olderThan: Date, now: Date) =>
      rows
        .filter(
          (r) =>
            r.status === 'pending' &&
            !r.intake_sent_at &&
            r.send_failures < 5 &&
            new Date(r.created_at) < olderThan &&
            new Date(r.expires_at) > now,
        )
        .map((r) => ({ ...r })),
    listDueReminders: async (now: Date) =>
      rows
        .filter(
          (r) =>
            r.status === 'pending' &&
            r.intake_sent_at &&
            r.send_failures < 5 &&
            r.next_reminder_at &&
            new Date(r.next_reminder_at) <= now &&
            new Date(r.expires_at) > now,
        )
        .map((r) => ({ ...r })),
    claimReminder: async (id: string, n: number, next: Date | null, now: Date) => {
      const r = rows.find((x) => x.id === id && x.status === 'pending' && x.reminders_sent === n - 1)
      if (!r) return false
      r.reminders_sent = n
      r.next_reminder_at = next ? next.toISOString() : null
      r.last_reminder_at = now.toISOString()
      return true
    },
    releaseReminder: async (id: string, n: number, dueAt: string | null, lastAt: string | null) => {
      const r = rows.find((x) => x.id === id && x.status === 'pending' && x.reminders_sent === n)
      if (r) Object.assign(r, { reminders_sent: n - 1, next_reminder_at: dueAt, last_reminder_at: lastAt })
    },
    endReminders: async (id: string) => {
      const r = rows.find((x) => x.id === id && x.status === 'pending')
      if (r) r.next_reminder_at = null
    },
    cancelOrderIntakes: async (orderId: string, now: Date) => {
      const open = rows.filter((r) => r.order_id === orderId && r.status === 'pending')
      for (const r of open) Object.assign(r, { status: 'cancelled', cancelled_at: now.toISOString(), next_reminder_at: null })
      return open.length
    },
    completeIntake: async (token: string, answers: IntakeRecord['answers'], now: Date) => {
      const r = rows.find((x) => x.token === token && x.status === 'pending' && new Date(x.expires_at) > now)
      if (!r) return null
      Object.assign(r, { status: 'completed', answers, completed_at: now.toISOString(), next_reminder_at: null })
      return { ...r }
    },
    listTeamPending: async (olderThan: Date) =>
      rows
        .filter(
          (r) =>
            r.status === 'completed' &&
            !r.team_notified_at &&
            r.send_failures < 5 &&
            r.completed_at &&
            new Date(r.completed_at) < olderThan,
        )
        .map((r) => ({ ...r })),
    claimTeamNotify: async (id: string, now: Date) => {
      const r = rows.find((x) => x.id === id && !x.team_notified_at)
      if (!r) return false
      r.team_notified_at = now.toISOString()
      return true
    },
    releaseTeamNotify: async (id: string) => {
      const r = rows.find((x) => x.id === id)
      if (r) r.team_notified_at = null
    },
    endOrderReminders: async (orderId: string) => {
      const open = rows.filter((r) => r.order_id === orderId && r.status === 'pending' && r.next_reminder_at)
      for (const r of open) r.next_reminder_at = null
      return open.length
    },
    listOtherIntakesForEmail: async (email: string, excludeOrderId: string) =>
      rows
        .filter((r) => r.customer_email.toLowerCase() === email.trim().toLowerCase() && r.order_id !== excludeOrderId && r.status !== 'cancelled')
        .sort((a, b) => a.purchased_at.localeCompare(b.purchased_at))
        .map((r) => ({ ...r })),
  }
  return s
}

const clock = { now: T0 }
let mem: ReturnType<typeof memoryStore>
let deps: IntakeDeps
let tokenSeq = 0
const sendRequest = vi.fn<IntakeDeps['sendRequest']>()
const sendCompleted = vi.fn<IntakeDeps['sendCompleted']>()
const alert = vi.fn<IntakeDeps['alert']>()

function token(n: number): string {
  return `tok${String(n).padStart(40, '0')}`
}

beforeEach(() => {
  clock.now = T0
  tokenSeq = 0
  mem = memoryStore()
  sendRequest.mockReset().mockResolvedValue('msg')
  sendCompleted.mockReset().mockResolvedValue('msg')
  alert.mockReset().mockResolvedValue(undefined)
  deps = {
    store: mem as unknown as typeof storeModule,
    loadForms: async () => [STANDARD, EXEC],
    loadForm: async (id) => [STANDARD, EXEC].find((f) => f.id === id) ?? null,
    loadVariantTitles: async () => new Map([['rapid-repatterning-session', ['90 min in-person', '90 min in-person']]]),
    sendRequest,
    sendCompleted,
    alert,
    newToken: () => token(++tokenSeq),
    delays: () => reminderDelays({}),
    now: () => clock.now,
  }
})

const ORDER = {
  orderId: 'order_1',
  displayId: '501',
  email: 'johan@aiautomations.co.za',
  firstName: 'Johan',
  lastName: 'QA Test',
  lines: [
    { handle: 'rapid-repatterning-session', title: 'Rapid Repatterning Session', session: true },
    // A package line of the same service: shares the one form.
    { handle: 'rapid-repatterning-session', title: 'Rapid Repatterning Session', session: true },
    { handle: 'executive-coaching-30-mins', title: 'Executive Coaching Session', session: true },
    { handle: 'money-mastery-group-session', title: 'Money Mastery', session: false },
  ],
}

describe('returning clients get no intake mail (D023, any service)', () => {
  const SESSION = [{ handle: 'rapid-repatterning-session', title: 'Rapid Repatterning Session', session: true }]
  const first = { ...ORDER, orderId: 'order_a', displayId: '601', email: 'johan+intake1a@aiautomations.co.za', lines: SESSION }

  it('a first-time client gets the mail and the reminder schedule', async () => {
    const result = await createIntakesForOrder(first, deps)
    expect(result.skipped).toBeUndefined()
    expect(sendRequest).toHaveBeenCalledTimes(1)
    expect(mem.rows[0]!.next_reminder_at).not.toBeNull()
  })

  it('(a) an earlier session order found by Medusa: no record, no mail, the reason logged', async () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => undefined)
    const result = await createIntakesForOrder({ ...first, priorSessionOrder: '#433' }, deps)
    expect(result).toMatchObject({ records: [], failed: 0, skipped: 'earlier session order #433' })
    expect(mem.rows).toEqual([])
    expect(sendRequest).not.toHaveBeenCalled()
    expect(info.mock.calls.join(' ')).toContain('returning client (earlier session order #433)')
    expect(info.mock.calls.join(' ')).not.toContain('intake1a')
    info.mockRestore()
  })

  it('(a) an earlier order of another service on record, address in another case: skipped', async () => {
    await createIntakesForOrder({ ...first, lines: [{ handle: 'executive-coaching-30-mins', title: 'Executive Coaching Session', session: true }] }, deps)
    clock.now = new Date(T0.getTime() + 3_600_000)
    const second = await createIntakesForOrder(
      { ...first, orderId: 'order_b', displayId: '602', email: 'Johan+Intake1A@AiAutomations.co.za', placedAt: clock.now },
      deps,
    )
    expect(second.skipped).toBe('earlier session order #601')
    expect(mem.rows.map((r) => r.order_id)).toEqual(['order_a'])
    expect(sendRequest).toHaveBeenCalledTimes(1)
  })

  it('(a) a cancelled earlier order does not count', async () => {
    await createIntakesForOrder(first, deps)
    await cancelIntakesForOrder('order_a', deps)
    clock.now = new Date(T0.getTime() + 3_600_000)
    const second = await createIntakesForOrder({ ...first, orderId: 'order_b', displayId: '602', placedAt: clock.now }, deps)
    expect(second.skipped).toBeUndefined()
    expect(sendRequest).toHaveBeenCalledTimes(2)
  })

  it('(b) a completed intake form and no earlier order: skipped', async () => {
    const other = 'johan+intake1c@aiautomations.co.za'
    await createIntakesForOrder({ ...first, orderId: 'order_old', displayId: '590', email: other }, deps)
    Object.assign(mem.rows[0]!, { status: 'completed', completed_at: T0.toISOString() })
    sendRequest.mockClear()
    // Dated before that record, so only the completed-form branch can match.
    const placedAt = new Date(T0.getTime() - 3_600_000)
    const result = await createIntakesForOrder({ ...first, orderId: 'order_c', displayId: '603', email: other, placedAt }, deps)
    expect(result.skipped).toBe('completed intake form for order #590')
    expect(sendRequest).not.toHaveBeenCalled()
  })

  it('a form already made for the order (Medusa lookup failed then) stops reminding when the order turns out returning', async () => {
    await createIntakesForOrder(first, deps)
    const later = await createIntakesForOrder({ ...first, priorSessionOrder: '#433' }, deps)
    expect(later.skipped).toBe('earlier session order #433')
    expect(mem.rows[0]!.next_reminder_at).toBeNull()
  })

  it('an earlier form whose mail never went does not make the client returning', async () => {
    sendRequest.mockRejectedValueOnce(new Error('Brevo down'))
    await createIntakesForOrder(first, deps)
    clock.now = new Date(T0.getTime() + 3_600_000)
    const second = await createIntakesForOrder({ ...first, orderId: 'order_b', displayId: '602', placedAt: clock.now }, deps)
    expect(second.skipped).toBeUndefined()
  })

  it('a re-post of the first order still counts as first-time (its own record is not "earlier")', async () => {
    await createIntakesForOrder(first, deps)
    const again = await createIntakesForOrder(first, deps)
    expect(again.skipped).toBeUndefined()
    expect(again.records[0]).toMatchObject({ created: false, mailed: true })
  })

  it('the reminder run ends the reminders of the record of a returning client and sends none', async () => {
    // Two records made before the rule (or racing it): the second order's reminders stop, the first's go on.
    await createIntakesForOrder(first, deps)
    const later = new Date(T0.getTime() + 3_600_000)
    mem.rows.push({ ...mem.rows[0]!, id: 'id_b', token: token(99), order_id: 'order_b', order_display_id: '602', purchased_at: later.toISOString() })
    sendRequest.mockClear()
    const info = vi.spyOn(console, 'info').mockImplementation(() => undefined)
    clock.now = new Date(T0.getTime() + 2 * DAY)
    const run = await runIntakeReminders(deps)
    info.mockRestore()
    expect(run.reminders).toBe(1)
    expect(run.skipped).toBe(1)
    expect(sendRequest.mock.calls.map(([r]) => r.order_id)).toEqual(['order_a'])
    expect(mem.rows.find((r) => r.id === 'id_b')!.next_reminder_at).toBeNull()
  })
})

describe('createIntakesForOrder', () => {
  it('creates one record per service, not per line, and mails each link once', async () => {
    const result = await createIntakesForOrder(ORDER, deps)
    expect(result.failed).toBe(0)
    expect(mem.rows.map((r) => [r.service_key, r.form_key])).toEqual([
      ['rapid-repatterning-session', 'standard'],
      ['executive-coaching-30-mins', 'executive-transformational-coaching'],
    ])
    expect(sendRequest).toHaveBeenCalledTimes(2)
    expect(sendRequest.mock.calls.every(([, reminder]) => reminder === 0)).toBe(true)
    expect(mem.rows.every((r) => r.intake_sent_at)).toBe(true)
    expect(mem.rows[0]!.next_reminder_at).toBe(new Date(T0.getTime() + DAY).toISOString())
    expect(mem.rows[0]!.service_name).toBe('Rapid Repatterning Session')
  })

  it('marks a service in-person only when every variant bought says so', async () => {
    await createIntakesForOrder(ORDER, deps)
    expect(mem.rows.find((r) => r.service_key === 'rapid-repatterning-session')?.in_person).toBe(true)
    expect(mem.rows.find((r) => r.service_key === 'executive-coaching-30-mins')?.in_person).toBe(false)
  })

  it('still mails the form, as online, when the Medusa lookup fails', async () => {
    deps.loadVariantTitles = async () => {
      throw new Error('medusa down')
    }
    const result = await createIntakesForOrder({ ...ORDER, lines: [ORDER.lines[0]!] }, deps)
    expect(result.failed).toBe(0)
    expect(sendRequest).toHaveBeenCalledTimes(1)
    expect(mem.rows[0]!.in_person).toBe(false)
  })

  it('does nothing new when the order is posted again', async () => {
    await createIntakesForOrder(ORDER, deps)
    const again = await createIntakesForOrder(ORDER, deps)
    expect(again.records.every((r) => !r.created && r.mailed)).toBe(true)
    expect(mem.rows).toHaveLength(2)
    expect(sendRequest).toHaveBeenCalledTimes(2)
  })

  it('reports a failed mail and resends only that one on the retry', async () => {
    sendRequest.mockRejectedValueOnce(new Error('Brevo down'))
    const first = await createIntakesForOrder(ORDER, deps)
    expect(first.failed).toBe(1)
    const retry = await createIntakesForOrder(ORDER, deps)
    expect(retry.failed).toBe(0)
    expect(sendRequest).toHaveBeenCalledTimes(3)
    expect(mem.rows.every((r) => r.intake_sent_at)).toBe(true)
  })

  it('counts the reminders from the order time, not from when the record was made', async () => {
    const placedAt = new Date(T0.getTime() - 3 * 3_600_000) // swept three hours after the purchase
    await createIntakesForOrder({ ...ORDER, placedAt, lines: [ORDER.lines[0]!] }, deps)
    expect(mem.rows[0]!.purchased_at).toBe(placedAt.toISOString())
    expect(mem.rows[0]!.next_reminder_at).toBe(new Date(placedAt.getTime() + DAY).toISOString())
  })

  it('never sends the first mail twice when the order route and the sweep overlap', async () => {
    const [a, b] = await Promise.all([createIntakesForOrder(ORDER, deps), createIntakesForOrder(ORDER, deps)])
    expect(a.failed + b.failed).toBe(0)
    expect(sendRequest).toHaveBeenCalledTimes(2) // one per service, not four
  })

  it('counts a session with no form to send as a failure, so Medusa alerts', async () => {
    deps.loadForms = async () => [EXEC]
    const result = await createIntakesForOrder({ ...ORDER, lines: [ORDER.lines[0]!] }, deps)
    expect(result.failed).toBe(1)
    expect(mem.rows).toHaveLength(0)
  })

  it('stops trying a mail after five failures and tells staff once', async () => {
    sendRequest.mockRejectedValue(new Error('Brevo: invalid address'))
    await createIntakesForOrder({ ...ORDER, lines: [ORDER.lines[0]!] }, deps)
    for (let i = 1; i <= 8; i += 1) {
      clock.now = new Date(T0.getTime() + i * 3_600_000)
      await runIntakeReminders(deps)
    }
    expect(sendRequest).toHaveBeenCalledTimes(5)
    expect(mem.rows[0]!.send_failures).toBe(5)
    expect(alert).toHaveBeenCalledTimes(1)
    expect(JSON.stringify(alert.mock.calls[0]![0])).not.toContain('johan@')
  })

  it('creates nothing for an order without a session or listed product', async () => {
    const result = await createIntakesForOrder({ ...ORDER, lines: [ORDER.lines[3]!] }, deps)
    expect(result.records).toEqual([])
    expect(sendRequest).not.toHaveBeenCalled()
  })
})

describe('runIntakeReminders', () => {
  async function at(ms: number) {
    clock.now = new Date(T0.getTime() + ms)
    return runIntakeReminders(deps)
  }

  it('sends reminders on day 1, 3, 5, 8, 11 and 14, then stops', async () => {
    await createIntakesForOrder({ ...ORDER, lines: [ORDER.lines[0]!] }, deps)
    sendRequest.mockClear()
    const sentOn: number[] = []
    for (let hour = 1; hour <= 20 * 24; hour += 1) {
      const res = await at(hour * 3_600_000)
      if (res.reminders > 0) sentOn.push(hour / 24)
    }
    expect(sentOn).toEqual([1, 3, 5, 8, 11, 14])
    expect(sendRequest.mock.calls.map(([, n]) => n)).toEqual([1, 2, 3, 4, 5, 6])
    expect(mem.rows[0]!.reminders_sent).toBe(6)
    expect(mem.rows[0]!.next_reminder_at).toBeNull()
  })

  it('stops as soon as the form is in', async () => {
    await createIntakesForOrder({ ...ORDER, lines: [ORDER.lines[0]!] }, deps)
    sendRequest.mockClear()
    await at(DAY) // reminder 1
    await at(3 * DAY) // reminder 2
    clock.now = new Date(T0.getTime() + 4 * DAY)
    expect(await submitIntake(mem.rows[0]!.token, { acknowledged: true, answers: { name: { value: 'Johan' } } }, deps)).toEqual({
      status: 'completed',
    })
    for (let d = 5; d <= 20; d += 1) await at(d * DAY)
    expect(sendRequest.mock.calls.map(([, n]) => n)).toEqual([1, 2])
  })

  it('never sends the same reminder twice when two runs overlap', async () => {
    await createIntakesForOrder({ ...ORDER, lines: [ORDER.lines[0]!] }, deps)
    sendRequest.mockClear()
    clock.now = new Date(T0.getTime() + DAY)
    const [a, b] = await Promise.all([runIntakeReminders(deps), runIntakeReminders(deps)])
    expect(a.reminders + b.reminders).toBe(1)
    expect(a.skipped + b.skipped).toBe(1)
    expect(sendRequest).toHaveBeenCalledTimes(1)
  })

  it('gives a reminder back when its mail fails, and sends it on the next run', async () => {
    await createIntakesForOrder({ ...ORDER, lines: [ORDER.lines[0]!] }, deps)
    sendRequest.mockClear().mockRejectedValueOnce(new Error('Brevo down'))
    const failed = await at(DAY)
    expect(failed.failed).toBe(1)
    expect(mem.rows[0]!.reminders_sent).toBe(0)
    const ok = await at(DAY + 3_600_000)
    expect(ok.reminders).toBe(1)
    expect(sendRequest.mock.calls.map(([, n]) => n)).toEqual([1, 1])
  })

  it('stops reminders for a cancelled order', async () => {
    await createIntakesForOrder({ ...ORDER, lines: [ORDER.lines[0]!] }, deps)
    sendRequest.mockClear()
    expect(await cancelIntakesForOrder('order_1', deps)).toBe(1)
    for (let d = 1; d <= 15; d += 1) await at(d * DAY)
    expect(sendRequest).not.toHaveBeenCalled()
    expect((await loadIntakePage(mem.rows[0]!.token, deps)).state).toBe('expired')
  })

  it('retries a first mail that never went, after the grace period', async () => {
    sendRequest.mockRejectedValueOnce(new Error('Brevo down'))
    await createIntakesForOrder({ ...ORDER, lines: [ORDER.lines[0]!] }, deps)
    expect((await at(5 * MIN)).firstMails).toBe(0)
    expect((await at(15 * MIN)).firstMails).toBe(1)
    expect(mem.rows[0]!.intake_sent_at).not.toBeNull()
  })

  it('retries a team mail that failed at submit', async () => {
    await createIntakesForOrder({ ...ORDER, lines: [ORDER.lines[0]!] }, deps)
    sendCompleted.mockRejectedValueOnce(new Error('Brevo down'))
    expect((await submitIntake(mem.rows[0]!.token, { acknowledged: true, answers: { name: { value: 'J' } } }, deps)).status).toBe(
      'completed',
    )
    expect(mem.rows[0]!.team_notified_at).toBeNull()
    expect((await at(10 * MIN)).teamMails).toBe(1)
    expect(mem.rows[0]!.team_notified_at).not.toBeNull()
    expect((await at(20 * MIN)).teamMails).toBe(0)
  })
})

describe('submitIntake and the page', () => {
  beforeEach(async () => {
    await createIntakesForOrder({ ...ORDER, lines: [ORDER.lines[0]!] }, deps)
  })

  it('opens the form with the service introduction', async () => {
    const page = await loadIntakePage(mem.rows[0]!.token, deps)
    expect(page.state).toBe('open')
    if (page.state === 'open') expect(page.introduction).toBe('RR intro')
  })

  it('returns question errors and saves nothing on an invalid form', async () => {
    const result = await submitIntake(mem.rows[0]!.token, { acknowledged: false, answers: {} }, deps)
    expect(result.status).toBe('invalid')
    expect(mem.rows[0]!.status).toBe('pending')
    expect(sendCompleted).not.toHaveBeenCalled()
  })

  it('saves once, mails the team once, and then shows the used link as done', async () => {
    const t = mem.rows[0]!.token
    const body = { acknowledged: true, answers: { name: { value: 'Johan QA Test' } } }
    expect(await submitIntake(t, body, deps)).toEqual({ status: 'completed' })
    expect(await submitIntake(t, body, deps)).toEqual({ status: 'already_completed' })
    expect(sendCompleted).toHaveBeenCalledTimes(1)
    expect(mem.rows[0]!.answers?.items[0]).toMatchObject({ label: 'Full name', value: 'Johan QA Test' })
    expect((await loadIntakePage(t, deps)).state).toBe('completed')
  })

  it('refuses an expired link', async () => {
    clock.now = new Date(T0.getTime() + 61 * DAY)
    expect((await submitIntake(mem.rows[0]!.token, { acknowledged: true, answers: { name: { value: 'J' } } }, deps)).status).toBe(
      'expired',
    )
    expect((await loadIntakePage(mem.rows[0]!.token, deps)).state).toBe('expired')
  })

  it('treats a malformed or unknown token as not found', async () => {
    expect((await loadIntakePage('short', deps)).state).toBe('not_found')
    expect((await loadIntakePage(token(999), deps)).state).toBe('not_found')
    expect((await submitIntake('../etc', {}, deps)).status).toBe('not_found')
  })

  it('falls back to the form now covering the service when the sent form was deleted', async () => {
    deps.loadForm = async () => null
    const page = await loadIntakePage(mem.rows[0]!.token, deps)
    expect(page.state === 'open' && page.form.formKey).toBe('standard')
  })
})

describe('isInPerson', () => {
  it.each([
    [['90 min in-person'], true],
    [['90 min In Person', '60 min in-person'], true],
    [['90 min in-person', '90 min online'], false],
    [['Package of 04 (60 min online)'], false],
    [['30 min'], false],
    [[], false],
    [undefined, false],
  ])('%j -> %s', (titles, expected) => {
    expect(isInPerson(titles as string[] | undefined)).toBe(expected)
  })
})
