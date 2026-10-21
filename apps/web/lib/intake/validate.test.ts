import { describe, it, expect } from 'vitest'
import { ACKNOWLEDGEMENT_KEY, MAX_TEXT, answerText, validateSubmission } from './validate'
import type { IntakeForm } from './types'

const FORM: IntakeForm = {
  id: '1',
  formKey: 'standard',
  title: 'Client intake form',
  active: true,
  isDefault: true,
  services: [],
  intro: null,
  acknowledgement: 'I acknowledge.',
  recipientEmail: null,
  fields: [
    { id: 'h1', type: 'heading', label: 'Personal details', helpText: null, options: [], required: false, withDetail: false },
    { id: 'name', type: 'text', label: 'Full name', helpText: null, options: [], required: true, withDetail: false },
    { id: 'mail', type: 'email', label: 'Email', helpText: null, options: [], required: false, withDetail: false },
    { id: 'dob', type: 'date', label: 'Date of birth', helpText: null, options: [], required: false, withDetail: false },
    { id: 'h2', type: 'heading', label: 'Health', helpText: null, options: [], required: false, withDetail: false },
    { id: 'mh', type: 'select', label: 'Mental disorders?', helpText: null, options: ['Yes', 'No', 'Other'], required: false, withDetail: true },
    { id: 'feel', type: 'checkbox-group', label: 'Feelings', helpText: null, options: ['Panic', 'Overwhelm', 'Sad'], required: false, withDetail: false },
    { id: 'ready', type: 'scale', label: 'Ready to change', helpText: null, options: [], required: true, withDetail: false },
    { id: 'notes', type: 'textarea', label: 'Anything else', helpText: null, options: [], required: false, withDetail: false },
  ],
}

const VALID = {
  acknowledged: true,
  answers: {
    name: { value: '  Johan QA Test ' },
    mail: { value: 'johan@aiautomations.co.za' },
    dob: { value: '1980-02-29' },
    mh: { value: 'Other', detail: 'Mild anxiety' },
    feel: { value: ['Sad', 'Panic'] },
    ready: { value: '8' },
  },
}

describe('validateSubmission', () => {
  it('accepts a valid form and keeps the form order, sections and details', () => {
    const result = validateSubmission(FORM, VALID)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.answers.acknowledged).toBe(true)
    expect(result.answers.items.map((i) => i.fieldId)).toEqual(['name', 'mail', 'dob', 'mh', 'feel', 'ready', 'notes'])
    const byId = Object.fromEntries(result.answers.items.map((i) => [i.fieldId, i])) as Record<string, (typeof result.answers.items)[number]>
    expect(byId.name?.value).toBe('Johan QA Test')
    expect(byId.name?.section).toBe('Personal details')
    expect(byId.mh?.section).toBe('Health')
    expect(byId.mh?.detail).toBe('Mild anxiety')
    // Options come back in the form's order, not the click order.
    expect(byId.feel?.value).toEqual(['Panic', 'Sad'])
    expect(byId.notes?.value).toBe('')
  })

  it('reports every required question that is empty', () => {
    const result = validateSubmission(FORM, { acknowledged: true, answers: {} })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(Object.keys(result.errors).sort()).toEqual(['name', 'ready'])
  })

  it('requires the acknowledgement when the form has one', () => {
    const result = validateSubmission(FORM, { ...VALID, acknowledged: false })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors[ACKNOWLEDGEMENT_KEY]).toBeDefined()
  })

  it('does not ask for an acknowledgement the form does not have', () => {
    const result = validateSubmission({ ...FORM, acknowledgement: null }, { ...VALID, acknowledged: false })
    expect(result.ok).toBe(true)
  })

  it.each([
    ['mail', { value: 'not-an-email' }],
    ['dob', { value: '2026-02-30' }],
    ['dob', { value: '1 Feb 1980' }],
    ['mh', { value: 'Maybe' }],
    ['feel', { value: ['Panic', 'Bored'] }],
    ['ready', { value: '11' }],
    ['ready', { value: '7.5' }],
    ['name', { value: 'x'.repeat(MAX_TEXT + 1) }],
  ])('rejects a bad %s answer %j', (id, answer) => {
    const result = validateSubmission(FORM, { ...VALID, answers: { ...VALID.answers, [id]: answer } })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors[id]).toBeDefined()
  })

  it('ignores answers to questions the form does not have, and odd types', () => {
    const result = validateSubmission(FORM, {
      ...VALID,
      answers: { ...VALID.answers, injected: { value: 'x' }, notes: { value: 42 }, ['__proto__']: { value: 'x' } },
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.answers.items.find((i) => i.fieldId === 'injected')).toBeUndefined()
    expect(result.answers.items.find((i) => i.fieldId === 'notes')?.value).toBe('')
  })

  it('drops details on a question without a details box', () => {
    const result = validateSubmission(FORM, { ...VALID, answers: { ...VALID.answers, name: { value: 'A', detail: 'sneaky' } } })
    expect(result.ok && result.answers.items.find((i) => i.fieldId === 'name')?.detail).toBeFalsy()
  })
})

describe('answerText', () => {
  it('formats lists and scales for the team mail', () => {
    expect(answerText({ fieldId: 'a', type: 'checkbox-group', label: 'x', value: ['Panic', 'Sad'] })).toBe('Panic, Sad')
    expect(answerText({ fieldId: 'b', type: 'scale', label: 'x', value: '8' })).toBe('8 / 10')
    expect(answerText({ fieldId: 'c', type: 'scale', label: 'x', value: '' })).toBe('')
  })
})
