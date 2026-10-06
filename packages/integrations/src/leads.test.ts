// @vitest-environment node
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, it, expect, vi } from 'vitest'
import { VtigerClient } from './vtiger'
import {
  existingContactElement,
  findContactQuery,
  leadEventElement,
  newContactElement,
  normaliseLead,
  syncLeadToVtiger,
} from './leads'
import { makeFakeVtiger } from './test-utils'

// ---------------------------------------------------------------------------
// Parity with the n8n workflow as fixed in git (86ea858 / KI054): run the
// workflow's own Code nodes and compare their output with ours.
// ---------------------------------------------------------------------------

type N8nNode = { name: string; type: string; parameters: Record<string, unknown> }
const workflowPath = fileURLToPath(new URL('../../../infra/n8n/workflows/lead-magnet-to-vtiger.json', import.meta.url))
const workflow = JSON.parse(readFileSync(workflowPath, 'utf8')) as { nodes: N8nNode[] }

function nodeParams(name: string): Record<string, unknown> {
  const node = workflow.nodes.find((n) => n.name === name)
  if (!node) throw new Error(`n8n node not found: ${name}`)
  return node.parameters
}

/** Runs one n8n Code node with stubbed $ / $input / $env. Returns the first item's json. */
function runCodeNode(
  name: string,
  ctx: { input: unknown; nodes?: Record<string, unknown>; env?: Record<string, string> },
): Record<string, unknown> {
  const code = nodeParams(name).jsCode as string
  const $ = (node: string) => ({ first: () => ({ json: ctx.nodes?.[node] }) })
  const $input = { first: () => ({ json: ctx.input }) }
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  const fn = new Function('$', '$input', '$env', 'require', code) as (...a: unknown[]) => Array<{ json: Record<string, unknown> }>
  const out = fn($, $input, ctx.env ?? {}, () => ({}))
  return out[0]!.json
}

const n8nEnv = { VTIGER_URL: 'https://crm.test', VTIGER_USERNAME: 'u', VTIGER_ACCESS_KEY: 'k' }

function n8nPrepared(body: Record<string, unknown>) {
  return runCodeNode('Prepare: Extract Submission Data', { input: { body }, env: n8nEnv })
}

describe('parity with infra/n8n/workflows/lead-magnet-to-vtiger.json', () => {
  it('the webhook body the route sends normalises the same way', () => {
    const body = { email: '  Jane.Doe@Example.COM ', firstName: 'Jane', source: 'masterclass' }
    const prep = n8nPrepared(body)
    const ours = normaliseLead({ email: body.email, firstName: body.firstName, source: body.source })
    expect(ours.email).toBe(prep.email)
    expect(ours.firstName).toBe(prep.firstName)
    expect(ours.lastName).toBe(prep.lastName)
    expect(ours.source).toBe(prep.source)
  })

  it('looks the contact up with the same VTQL (dedupe by email, trailing semicolon)', () => {
    const prep = { ...n8nPrepared({ email: "o'neil@example.com", firstName: 'O', source: 'community' }) }
    const session = runCodeNode('Prepare: Session', {
      input: { success: true, result: { sessionName: 's', userId: '19x1' } },
      nodes: { 'Prepare: Build Login Hash': prep },
    })
    const queryTemplate = (
      (nodeParams('Vtiger: Check Contact Exists').queryParameters as { parameters: Array<{ name: string; value: string }> })
        .parameters.find((p) => p.name === 'query')!.value
    )
    const n8nQuery = queryTemplate.replace(/^=/, '').replace('{{ $json.safeEmail }}', String(session.safeEmail))
    expect(findContactQuery(normaliseLead({ email: "o'neil@example.com", source: 'community' }).email)).toBe(n8nQuery)
  })

  it('new contact: same module and the same fields (leadsource Lead Magnet, stage New Lead, assigned user)', () => {
    const body = { email: 'new@example.com', firstName: 'Nia', source: 'masterclass' }
    const session = { ...n8nPrepared(body), sessionName: 's', safeEmail: body.email, userId: '19x1' }
    const n8n = runCodeNode('Prepare: New Contact Payload', { input: {}, nodes: { 'Prepare: Session': session } })

    const ours = newContactElement(normaliseLead(body), '19x1')
    expect(ours).toEqual(JSON.parse(n8n.element as string))
    expect(nodeParams('Vtiger: Upsert Contact').bodyParameters).toMatchObject({
      parameters: expect.arrayContaining([{ name: 'elementType', value: 'Contacts' }]),
    })
  })

  it.each([
    ['blank lead source and lastname', { id: '12x188', firstname: 'QA', lastname: '', email: 'qa@example.com', leadsource: '', assigned_user_id: '19x5' }],
    ['lead source already set', { id: '12x188', firstname: 'QA', lastname: 'SelfTest', email: 'qa@example.com', leadsource: 'Shop', assigned_user_id: '19x5' }],
    ['no assigned user on the record', { id: '12x188', firstname: 'QA', lastname: 'SelfTest', email: 'qa@example.com', leadsource: 'Shop' }],
  ])('existing contact (%s): same fields as the n8n update node', (_label, existing) => {
    const body = { email: 'qa@example.com', firstName: 'Quinn', source: 'newsletter' }
    const session = { ...n8nPrepared(body), sessionName: 's', safeEmail: body.email, userId: '19x1' }
    const n8n = runCodeNode('Prepare: Update Existing Contact', {
      input: {},
      nodes: {
        'Prepare: Session': session,
        'Vtiger: Check Contact Exists': { success: true, result: [existing] },
      },
    })

    const ours = existingContactElement(existing, normaliseLead(body), '19x1')
    expect(ours).toEqual(JSON.parse(n8n.element as string))
  })

  it('Event: same type, subject, description, owner, link, duration and status', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-06T08:30:00Z'))
    try {
      const body = { email: 'lead@example.com', firstName: 'Lee', source: 'homepage' }
      const prep = { ...n8nPrepared(body), userId: '19x1', contactId: '12x900' }
      const n8n = JSON.parse(runCodeNode('Prepare: Activity Payload', { input: prep }).element as string) as Record<string, string>

      const ours = leadEventElement(normaliseLead(body), '12x900', '19x1', new Date()) as Record<string, string>
      // Times: n8n mixed a UTC date with the container's local time; ours is UTC for both.
      const { time_start: _a, time_end: _b, ...n8nRest } = n8n
      const { time_start, time_end, ...oursRest } = ours
      expect(oursRest).toEqual(n8nRest)
      expect(time_start).toBe('08:30:00')
      expect(time_end).toBe('08:30:00')
      expect(nodeParams('Vtiger: Create Activity').bodyParameters).toMatchObject({
        parameters: expect.arrayContaining([{ name: 'elementType', value: 'Events' }]),
      })
    } finally {
      vi.useRealTimers()
    }
  })

  it('Event subject is capped at 255 characters like n8n', () => {
    const lead = normaliseLead({ email: 'a@b.co', source: 'x'.repeat(400) })
    expect(leadEventElement(lead, '12x1', '19x1', new Date()).subject).toHaveLength(255)
  })

  it('adds the quiz result to the Event description (n8n dropped it)', () => {
    const lead = normaliseLead({ email: 'a@b.co', source: 'freeze-quiz', quizResult: 'freeze' })
    expect(leadEventElement(lead, '12x1', '19x1', new Date()).description).toBe(
      'Source: freeze-quiz. Email: a@b.co. Quiz result: freeze',
    )
  })
})

// ---------------------------------------------------------------------------
// syncLeadToVtiger end to end against the fake webservice
// ---------------------------------------------------------------------------

function clientFor(fake: ReturnType<typeof makeFakeVtiger>) {
  return new VtigerClient({
    url: 'https://crm.test',
    username: 'u',
    accessKey: 'k',
    fetchImpl: fake.fetchImpl,
    sleep: () => Promise.resolve(),
    logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  })
}

describe('syncLeadToVtiger', () => {
  it('creates a new contact and one Event when the email is unknown', async () => {
    const fake = makeFakeVtiger()
    const res = await syncLeadToVtiger(clientFor(fake), { email: 'New@Example.com', firstName: 'Nia', source: 'masterclass' })

    expect(res.created).toBe(true)
    expect(res.contactId).toMatch(/^12x/)
    expect(res.eventId).toMatch(/^18x/)
    expect(fake.ops()).toEqual(['getchallenge', 'login', 'query', 'create', 'create'])
    expect(fake.created.map((c) => c.elementType)).toEqual(['Contacts', 'Events'])
    expect(fake.created[0]!.element).toMatchObject({ email: 'new@example.com', leadsource: 'Lead Magnet', cf_pipeline_stage: 'New Lead' })
    expect(fake.created[1]!.element).toMatchObject({ contact_id: res.contactId, subject: 'Website form - masterclass' })
  })

  it('dedupes by email: an existing contact is revised, not created again, and keeps its other fields', async () => {
    const fake = makeFakeVtiger({
      contacts: [{ id: '12x188', firstname: 'QA', lastname: 'SelfTest', email: 'qa@example.com', leadsource: '', mobile: '0820000000', assigned_user_id: '19x5' }],
    })
    const res = await syncLeadToVtiger(clientFor(fake), { email: 'qa@example.com', firstName: 'Quinn', source: 'community' })

    expect(res).toMatchObject({ created: false, contactId: '12x188' })
    expect(fake.ops()).toEqual(['getchallenge', 'login', 'query', 'revise', 'create'])
    expect(fake.contacts).toHaveLength(1)
    expect(fake.contacts[0]).toMatchObject({ leadsource: 'Lead Magnet', mobile: '0820000000', firstname: 'QA' })
    expect(fake.created.map((c) => c.elementType)).toEqual(['Events'])
  })

  it('a second submission with the same email updates the same contact', async () => {
    const fake = makeFakeVtiger()
    const c = clientFor(fake)
    const first = await syncLeadToVtiger(c, { email: 'twice@example.com', source: 'homepage' })
    const second = await syncLeadToVtiger(c, { email: 'TWICE@example.com', source: 'newsletter' })
    expect(second.contactId).toBe(first.contactId)
    expect(fake.contacts).toHaveLength(1)
  })

  it('falls back to read-merge-update when the instance has no revise', async () => {
    const fake = makeFakeVtiger({
      unknownOperations: ['revise'],
      contacts: [{ id: '12x188', firstname: 'QA', lastname: 'SelfTest', email: 'qa@example.com', mobile: '082', assigned_user_id: '19x5' }],
    })
    await syncLeadToVtiger(clientFor(fake), { email: 'qa@example.com', source: 'community' })
    expect(fake.ops()).toContain('update')
    const update = fake.calls.find((c) => c.operation === 'update')!
    expect(JSON.parse(update.params.element!)).toMatchObject({ id: '12x188', mobile: '082', leadsource: 'Lead Magnet', lastname: 'SelfTest' })
  })

  it('propagates a Vtiger failure to the caller', async () => {
    const fake = makeFakeVtiger({
      failures: { create: [new Response(JSON.stringify({ success: false, error: { code: 'MANDATORY_FIELDS_MISSING', message: 'lastname' } }))] },
    })
    await expect(syncLeadToVtiger(clientFor(fake), { email: 'x@example.com', source: 'homepage' })).rejects.toThrow(
      /MANDATORY_FIELDS_MISSING/,
    )
  })

  it('dry run: no network, fake ids', async () => {
    const fetchImpl = vi.fn()
    const c = new VtigerClient({ url: 'https://crm.test', username: 'u', accessKey: 'k', dryRun: true, fetchImpl, logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } })
    const res = await syncLeadToVtiger(c, { email: 'x@example.com', source: 'homepage' })
    expect(fetchImpl).not.toHaveBeenCalled()
    expect(res.created).toBe(true)
    expect(res.contactId).toMatch(/^dryrun-Contacts-/)
    expect(res.eventId).toMatch(/^dryrun-Events-/)
  })
})
