// @vitest-environment node
import { describe, it, expect, vi, afterEach } from 'vitest'
import { ThinkificClient, ThinkificError } from './thinkific'
import {
  courseAccessSubject,
  emptyEnrolmentState,
  enrolOrderInThinkific,
  orderHasCourses,
  parseOrderForThinkific,
  type EnrolmentState,
} from './thinkific-enrolment'
import { makeFakeThinkific } from './test-utils-thinkific'
import { loadWorkflow } from './n8n-test-harness'
import type { OrderSnapshot } from './orders'

const noSleep = () => Promise.resolve()
const quiet = { info: vi.fn(), warn: vi.fn(), error: vi.fn() }

function client(fake: ReturnType<typeof makeFakeThinkific>, extra: Partial<ConstructorParameters<typeof ThinkificClient>[0]> = {}) {
  return new ThinkificClient({ apiKey: 'TOKEN', fetchImpl: fake.fetchImpl, sleep: noSleep, logger: quiet, ...extra })
}

function order(overrides: Partial<OrderSnapshot> = {}): OrderSnapshot {
  return {
    id: 'order_01',
    display_id: 21,
    total: 0,
    customer: { email: '  QA.Buyer@Example.com ', first_name: 'QA', last_name: 'SelfTest' },
    billing_address: { first_name: 'Bill', last_name: 'Ing' },
    shipping_address: null,
    items: [
      { title: 'Line A', variant: { title: 'Default', product: { title: 'Program 1 Self Study', metadata: { thinkific_course_id: '1284792' } } } },
      { title: 'Line B', variant: { title: 'Default', product: { title: 'A Book', metadata: { product_type: 'book' } } } },
      { title: 'Line C', variant: { title: 'Live', product: { title: 'Program 2', metadata: { thinkific_course_id: 1300000 } } } },
    ],
    ...overrides,
  }
}

const wf = loadWorkflow('medusa-thinkific-enrollment.json')
const n8nEnv = { N8N_WEBHOOK_SECRET: 's3cret', THINKIFIC_API_KEY: 'TOKEN' }

function n8nParse(o: OrderSnapshot) {
  return wf.run('Parse: Order + Extract Course IDs', {
    input: { headers: { 'x-webhook-secret': 's3cret' }, body: o },
    env: n8nEnv,
  })
}

afterEach(() => {
  vi.useRealTimers()
})

// ---------------------------------------------------------------------------
// Parity with infra/n8n/workflows/medusa-thinkific-enrollment.json
// ---------------------------------------------------------------------------

describe('parity with medusa-thinkific-enrollment.json', () => {
  it.each([
    ['customer names', order()],
    ['guest: names on the billing address', order({ customer: { email: 'g@example.com' } })],
    ['guest: shipping address only', order({ customer: { email: 'g@example.com' }, billing_address: null, shipping_address: { first_name: 'Ship', last_name: '' } })],
    ['no names anywhere: email local part', order({ customer: { email: 'lonely@example.com' }, billing_address: null })],
    ['blank strings are skipped', order({ customer: { email: 'b@example.com', first_name: '  ', last_name: '' }, billing_address: { first_name: 'Real', last_name: '  ' } })],
    ['no course items', order({ items: [{ title: 'Book', variant: { product: { title: 'Book', metadata: {} } } }] })],
    ['title falls back to the line title, then "Course"', order({ items: [
      { title: 'Line title', variant: { product: { metadata: { thinkific_course_id: '5' } } } },
      { variant: { product: { metadata: { thinkific_course_id: '6' } } } },
    ] })],
    ['per-format course on the variant wins over the product', order({ items: [
      { title: 'P2', variant: { title: 'Self Study', metadata: { thinkific_course_id: '2165208' }, product: { title: 'Program 2', metadata: { thinkific_course_id: '1383462' } } } },
      { title: 'P2', variant: { title: 'Live via Zoom', metadata: { thinkific_course_id: '1383462' }, product: { title: 'Program 2', metadata: {} } } },
      { title: 'P3', variant: { title: 'Live Retaker', metadata: {}, product: { title: 'Program 3', metadata: { thinkific_course_id: '1402405' } } } },
    ] })],
  ])('parses the order like the n8n Parse node (%s)', (_label, o) => {
    const n8n = n8nParse(o)
    const ours = parseOrderForThinkific(o)
    expect(ours).toEqual({
      orderId: n8n.orderId,
      email: n8n.email,
      firstName: n8n.firstName,
      lastName: n8n.lastName,
      courseItems: n8n.courseItems,
      hasCourseItems: n8n.hasCourseItems,
    })
    expect(orderHasCourses(o)).toBe(n8n.hasCourseItems)
  })

  it('enrols each format into its own course (Order #69: Program 2 Self Study)', () => {
    const o = order({ items: [
      { title: 'P2', variant: { title: 'Self Study', metadata: { thinkific_course_id: '2165208' }, product: { title: 'Program 2', metadata: {} } } },
      { title: 'P1', variant: { title: 'Self Study', metadata: { thinkific_course_id: 2165207 }, product: { title: 'Program 1', metadata: { thinkific_course_id: '1349879' } } } },
    ] })
    expect(parseOrderForThinkific(o).courseItems).toEqual([
      { thinkific_course_id: 2165208, title: 'Program 2 (Self Study)' },
      { thinkific_course_id: 2165207, title: 'Program 1 (Self Study)' },
    ])
  })

  it('rejects an order without an email, like n8n', () => {
    const o = order({ customer: { email: '' } })
    expect(() => n8nParse(o)).toThrow(/missing customer\.email/)
    expect(() => parseOrderForThinkific(o)).toThrow(/missing customer\.email/)
  })

  it('creates the user with the same body as the n8n Create User node', async () => {
    const o = order()
    const parsed = n8nParse(o)
    // Evaluate the node's {{ expression }} with $('Parse...') stubbed.
    const expr = (wf.params('Thinkific: Create User').jsonBody as string).replace(/^=\{\{\s*/, '').replace(/\s*\}\}$/, '')
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const evaluate = new Function('$', `return ${expr}`) as ($: unknown) => string
    const n8nBody = JSON.parse(evaluate(() => ({ first: () => ({ json: parsed }) })))
    const fake = makeFakeThinkific()
    await enrolOrderInThinkific(client(fake), parseOrderForThinkific(o), emptyEnrolmentState())
    const create = fake.calls.find((c) => c.method === 'POST' && c.path === '/users')!
    expect(create.body).toEqual(n8nBody)
    expect(create.body).toMatchObject({ send_welcome_email: true })
  })

  it('looks the user up and enrols with the same requests and auth header as n8n', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-06T10:00:00Z'))
    const o = order()
    const parsed = n8nParse(o)

    // n8n: Find User request.
    const findQuery = (wf.params('Thinkific: Find User').queryParameters as { parameters: Array<{ name: string }> }).parameters
    expect(findQuery.map((p) => p.name)).toEqual(['query[email]'])
    const authHeader = (wf.params('Thinkific: Find User').headerParameters as { parameters: Array<{ name: string; value: string }> })
      .parameters.find((p) => p.name === 'Authorization')!.value
    expect(authHeader).toBe('=Bearer {{ $env.THINKIFIC_API_KEY }}')

    // n8n: Build Tasks + Enroll, with the HTTP helper recorded.
    const merged = wf.run('Merge: Resolve User ID + Build Tasks', { input: { ...parsed, thinkificApiKey: 'TOKEN', thinkificBaseUrl: 'https://api.thinkific.com/api/public/v1', thinkificUserId: 777 } })
    const n8nRequests: Array<Record<string, unknown>> = []
    const enrolled = await wf.runAsync('Enroll: Per Course (isolated failures)', {
      input: merged,
      helpers: {
        httpRequest: async (req) => {
          n8nRequests.push(req)
          return { statusCode: 201, body: {} }
        },
      },
    })

    // Ours, same user id.
    const fake = makeFakeThinkific({ users: [{ id: 777, email: 'qa.buyer@example.com' }] })
    await enrolOrderInThinkific(client(fake), parseOrderForThinkific(o), emptyEnrolmentState(), { now: () => new Date() })

    const ourEnrols = fake.calls.filter((c) => c.method === 'POST' && c.path === '/enrollments')
    expect(ourEnrols.map((c) => c.body)).toEqual(n8nRequests.map((r) => r.body))
    expect(n8nRequests.every((r) => r.url === 'https://api.thinkific.com/api/public/v1/enrollments' && r.method === 'POST')).toBe(true)
    expect(fake.calls.every((c) => c.auth === 'Bearer TOKEN')).toBe(true)
    expect(fake.calls[0]).toMatchObject({ method: 'GET', path: '/users', query: { 'query[email]': 'qa.buyer@example.com' } })
    expect(enrolled.enrollmentSuccessTitles).toEqual(['Program 1 Self Study', 'Program 2 (Live)'])
  })

  it('builds the same mail subject as the n8n Prepare: Confirmation Email node', () => {
    const n8n = wf.run('Prepare: Confirmation Email', {
      input: { email: 'a@b.co', firstName: 'QA', enrollmentSuccessTitles: ['Program 1 Self Study', 'Program 2'] },
    })
    expect(courseAccessSubject(['Program 1 Self Study', 'Program 2'])).toBe(n8n.emailSubject)
  })
})

// ---------------------------------------------------------------------------
// Behaviour
// ---------------------------------------------------------------------------

describe('enrolOrderInThinkific', () => {
  it('existing user: no create, enrols every course once', async () => {
    const fake = makeFakeThinkific({ users: [{ id: 5, email: 'qa.buyer@example.com' }] })
    const out = await enrolOrderInThinkific(client(fake), parseOrderForThinkific(order()), emptyEnrolmentState())
    expect(out).toMatchObject({ userId: 5, userCreated: false, failed: [], retry: [] })
    expect(out.granted.map((g) => g.courseId)).toEqual(['1284792', '1300000'])
    expect(fake.calls.some((c) => c.method === 'POST' && c.path === '/users')).toBe(false)
    expect(fake.enrolments).toHaveLength(2)
  })

  it('new user: created with send_welcome_email, then enrolled', async () => {
    const fake = makeFakeThinkific()
    const out = await enrolOrderInThinkific(client(fake), parseOrderForThinkific(order()), emptyEnrolmentState())
    expect(out.userCreated).toBe(true)
    expect(fake.users).toHaveLength(1)
    expect(fake.enrolments.map((e) => e.course_id)).toEqual([1284792, 1300000])
  })

  it('only takes a user whose email really matches (Thinkific search can be fuzzy)', async () => {
    const fake = makeFakeThinkific({ fuzzyUserSearch: true, users: [{ id: 1, email: 'not-qa.buyer@example.com' }] })
    const out = await enrolOrderInThinkific(client(fake), parseOrderForThinkific(order()), emptyEnrolmentState())
    expect(out.userId).not.toBe(1)
    expect(out.userCreated).toBe(true)
  })

  it('the same order twice enrols nothing the second time (state kept)', async () => {
    const fake = makeFakeThinkific()
    const state = emptyEnrolmentState()
    await enrolOrderInThinkific(client(fake), parseOrderForThinkific(order()), state)
    const writes = fake.writes().length
    await enrolOrderInThinkific(client(fake), parseOrderForThinkific(order()), state)
    expect(fake.writes().length).toBe(writes)
  })

  it('a lost state (crash after the POST) still never enrols twice: existing enrolment is found first', async () => {
    const fake = makeFakeThinkific({ users: [{ id: 5, email: 'qa.buyer@example.com' }], enrolments: [{ id: 1, user_id: 5, course_id: 1284792 }] })
    const out = await enrolOrderInThinkific(client(fake), parseOrderForThinkific(order()), emptyEnrolmentState())
    expect(fake.enrolments.filter((e) => e.course_id === 1284792)).toHaveLength(1)
    expect(out.granted.map((g) => g.courseId)).toEqual(['1284792', '1300000'])
  })

  it('an expired enrolment is enrolled again (as n8n would have POSTed)', async () => {
    const fake = makeFakeThinkific({ users: [{ id: 5, email: 'qa.buyer@example.com' }], enrolments: [{ id: 1, user_id: 5, course_id: 1284792, expired: true }] })
    await enrolOrderInThinkific(client(fake), parseOrderForThinkific(order()), emptyEnrolmentState())
    expect(fake.writes().filter((c) => c.path === '/enrollments').map((c) => (c.body as { course_id: number }).course_id)).toEqual([1284792, 1300000])
  })

  it('duplicate course lines are enrolled once', async () => {
    const o = order()
    o.items = [o.items![0]!, o.items![0]!]
    const fake = makeFakeThinkific()
    await enrolOrderInThinkific(client(fake), parseOrderForThinkific(o), emptyEnrolmentState())
    expect(fake.enrolments).toHaveLength(1)
  })

  it('a 4xx on one course is a permanent failure; the other courses still enrol', async () => {
    const fake = makeFakeThinkific({ badCourses: [1284792] })
    const out = await enrolOrderInThinkific(client(fake), parseOrderForThinkific(order()), emptyEnrolmentState())
    expect(out.failed).toEqual([expect.objectContaining({ courseId: '1284792', error: expect.stringContaining('HTTP 422') })])
    expect(out.granted.map((g) => g.courseId)).toEqual(['1300000'])
    expect(out.retry).toEqual([])
  })

  it('Thinkific down for one course: marked for retry, and the retry only redoes that course', async () => {
    const down = () => new Response('busy', { status: 503 })
    const fake = makeFakeThinkific({ failures: { 'POST /enrollments': [down(), down(), down(), down()] } })
    const state: EnrolmentState = emptyEnrolmentState()
    const c = client(fake, { retries: 3 })
    const first = await enrolOrderInThinkific(c, parseOrderForThinkific(order()), state)
    expect(first.retry.map((r) => r.courseId)).toEqual(['1284792'])
    expect(first.granted.map((g) => g.courseId)).toEqual(['1300000'])

    const second = await enrolOrderInThinkific(c, parseOrderForThinkific(order()), state)
    expect(second.retry).toEqual([])
    expect(second.granted.map((g) => g.courseId).sort()).toEqual(['1284792', '1300000'])
    expect(fake.enrolments).toHaveLength(2)
  })

  it('Thinkific down for the user lookup: throws a retriable error and saves nothing', async () => {
    const down = () => new Response('busy', { status: 502 })
    const fake = makeFakeThinkific({ failures: { 'GET /users': [down(), down(), down(), down()] } })
    const state = emptyEnrolmentState()
    const err = await enrolOrderInThinkific(client(fake), parseOrderForThinkific(order()), state).catch((e: unknown) => e)
    expect(err).toMatchObject({ retriable: true })
    expect(state.userId).toBeUndefined()
  })

  it('user creation refused (4xx): throws a non-retriable ThinkificError (n8n fatal branch)', async () => {
    const fake = makeFakeThinkific({ failures: { 'POST /users': [new Response('{"errors":"bad"}', { status: 400 })] } })
    const err = await enrolOrderInThinkific(client(fake), parseOrderForThinkific(order()), emptyEnrolmentState()).catch((e: unknown) => e)
    expect(err).toBeInstanceOf(ThinkificError)
    expect(err).toMatchObject({ retriable: false, status: 400 })
  })

  it('user created by a parallel run between lookup and create (422): uses that user', async () => {
    const fake = makeFakeThinkific()
    const c = client(fake)
    const realFind = c.findUserByEmail.bind(c)
    let first = true
    vi.spyOn(c, 'findUserByEmail').mockImplementation(async (email) => {
      if (first) {
        first = false
        fake.users.push({ id: 42, email: 'qa.buyer@example.com' })
        return null
      }
      return realFind(email)
    })
    const out = await enrolOrderInThinkific(c, parseOrderForThinkific(order()), emptyEnrolmentState())
    expect(out.userId).toBe(42)
  })

  it('saves progress after every step', async () => {
    const fake = makeFakeThinkific()
    const save = vi.fn(async () => {})
    await enrolOrderInThinkific(client(fake), parseOrderForThinkific(order()), emptyEnrolmentState(), { save })
    // user, activated_at, two courses
    expect(save).toHaveBeenCalledTimes(4)
  })

  it('dry run: no network, fake ids, every course "enrolled"', async () => {
    const fetchImpl = vi.fn()
    const c = ThinkificClient.fromEnv({ AUTOMATION_DRY_RUN: 'true' }, { fetchImpl, logger: quiet })
    const out = await enrolOrderInThinkific(c, parseOrderForThinkific(order()), emptyEnrolmentState())
    expect(fetchImpl).not.toHaveBeenCalled()
    expect(out.granted).toHaveLength(2)
    expect(String(out.userId)).toMatch(/^dryrun-/)
    expect(JSON.stringify(quiet.info.mock.calls)).not.toContain('qa.buyer@example.com')
  })
})

describe('ThinkificClient', () => {
  it('fromEnv throws without THINKIFIC_API_KEY outside dry run', () => {
    expect(() => ThinkificClient.fromEnv({})).toThrow(/THINKIFIC_API_KEY/)
  })

  it('retries 429 and 5xx, not other 4xx', async () => {
    const fake = makeFakeThinkific({ failures: { 'GET /users': [new Response('', { status: 429 }), new Response('', { status: 500 })] } })
    await expect(client(fake).findUserByEmail('x@y.co')).resolves.toBeNull()
    expect(fake.calls).toHaveLength(3)

    const fake2 = makeFakeThinkific({ failures: { 'GET /users': [new Response('nope', { status: 401 })] } })
    await expect(client(fake2).findUserByEmail('x@y.co')).rejects.toMatchObject({ status: 401, retriable: false })
    expect(fake2.calls).toHaveLength(1)
  })

  it('network errors are retried, then reported as retriable', async () => {
    const boom = () => new TypeError('fetch failed')
    const fake = makeFakeThinkific({ failures: { 'GET /users': [boom(), boom(), boom(), boom()] } })
    await expect(client(fake).findUserByEmail('x@y.co')).rejects.toMatchObject({ retriable: true, code: 'NETWORK' })
  })
})
