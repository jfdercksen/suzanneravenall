import { describe, it, expect } from 'vitest'
import { chooseForm, serviceIntroduction, toIntakeForm } from './forms'
import type { IntakeForm } from './types'
import { INTAKE_FORM_SEEDS } from '../../../payload/src/seed/intakeForms'

// The seeds as Payload would serve them: ids on the documents and array rows.
const SEEDED: IntakeForm[] = INTAKE_FORM_SEEDS.map((seed, i) =>
  toIntakeForm({
    ...seed,
    id: i + 1,
    fields: seed.fields.map((f, j) => ({ ...f, id: `f${i}-${j}` })),
    services: seed.services.map((s, j) => ({ ...s, id: `s${i}-${j}` })),
  }),
).filter((f): f is IntakeForm => f !== null)

function formKeyFor(handle: string, session = true): string | null {
  return chooseForm(SEEDED, { handle, title: handle, session })?.form.formKey ?? null
}

describe('chooseForm with the seeded forms (README mapping)', () => {
  it.each([
    ['rapid-repatterning-session', 'standard'],
    ['resonance-repatterning-session', 'standard'],
    ['rapid-transformation-therapy-session', 'standard'],
    ['exploring-the-alpha-mind-45-minutes', 'standard'],
    ['coaching-support-package', 'standard'],
    ['executive-coaching-30-mins', 'executive-transformational-coaching'],
    ['transformation-coaching-60-mins', 'executive-transformational-coaching'],
    ['akashic-clearing-session', 'akashic-coaching'],
    ['energetic-clearing-completed-remotely', 'energy-clearing'],
  ])('gives %s the %s form', (handle, formKey) => {
    expect(formKeyFor(handle)).toBe(formKey)
  })

  it('gives Group Family Coaching the default form while its own form is an inactive placeholder', () => {
    expect(formKeyFor('group-family-coaching-60-mins')).toBe('standard')
  })

  it('gives a product on an inactive placeholder form the default form even if its category is not a session', () => {
    expect(formKeyFor('group-family-coaching-60-mins', false)).toBe('standard')
  })

  it('gives Group Family Coaching its own form once the team switches it on', () => {
    const switchedOn = SEEDED.map((f) => (f.formKey === 'group-family-coaching' ? { ...f, active: true } : f))
    expect(chooseForm(switchedOn, { handle: 'group-family-coaching-60-mins', title: 'x', session: true })?.form.formKey).toBe(
      'group-family-coaching',
    )
  })

  it('gives an unlisted private session the default form, named after the product', () => {
    const choice = chooseForm(SEEDED, { handle: 'new-session', title: 'New Session', session: true })
    expect(choice?.form.formKey).toBe('standard')
    expect(choice?.serviceName).toBe('New Session')
  })

  it('gives a product that is not a session and on no form nothing', () => {
    expect(formKeyFor('group-session-money-mastery', false)).toBeNull()
    expect(formKeyFor('resonance-repatterning-program-1-fundamentals-live-via-zoom', false)).toBeNull()
  })

  it('gives a listed product its form even when it is not a session by category (team opt-in)', () => {
    expect(formKeyFor('energetic-clearing-completed-remotely', false)).toBe('energy-clearing')
  })

  it('uses the service label from the form, not the product title', () => {
    const choice = chooseForm(SEEDED, { handle: 'akashic-clearing-session', title: 'Akashic Coaching', session: true })
    expect(choice?.serviceName).toBe('Akashic Coaching Session')
  })

  it('returns nothing when no default form is active', () => {
    const noDefault = SEEDED.map((f) => ({ ...f, isDefault: false }))
    expect(chooseForm(noDefault, { handle: 'new-session', title: 'x', session: true })).toBeNull()
  })

  it('seeds exactly one default form and every form with an acknowledgement', () => {
    expect(SEEDED.filter((f) => f.isDefault)).toHaveLength(1)
    expect(SEEDED.every((f) => f.acknowledgement)).toBe(true)
  })

  it('carries the per-service introduction for the RR form slot', () => {
    const withIntro = SEEDED.map((f) =>
      f.formKey === 'standard'
        ? {
            ...f,
            services: f.services.map((s) =>
              s.productHandle === 'rapid-repatterning-session' ? { ...s, introduction: 'About Rapid Repatterning' } : s,
            ),
          }
        : f,
    )
    const standard = withIntro.find((f) => f.formKey === 'standard') as IntakeForm
    expect(serviceIntroduction(standard, 'rapid-repatterning-session')).toBe('About Rapid Repatterning')
    expect(serviceIntroduction(standard, 'resonance-repatterning-session')).toBeNull()
  })
})

describe('toIntakeForm', () => {
  it('drops unusable questions and splits options per line', () => {
    const form = toIntakeForm({
      id: 7,
      formKey: 'k',
      title: 'T',
      fields: [
        { id: 'a', type: 'select', label: 'Pick', options: 'Yes\r\nNo\n\n' },
        { id: 'b', type: 'select', label: 'No options', options: '' },
        { id: 'c', type: 'unknown', label: 'Bad type' },
        { id: 'd', type: 'text', label: '' },
      ],
    })
    expect(form?.id).toBe('7')
    expect(form?.fields.map((f) => f.id)).toEqual(['a'])
    expect(form?.fields[0]?.options).toEqual(['Yes', 'No'])
  })

  it('rejects a document without a key or title', () => {
    expect(toIntakeForm({ id: 1, title: 'x' })).toBeNull()
    expect(toIntakeForm(null)).toBeNull()
  })
})
