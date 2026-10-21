"use client"

import type { IntakeField } from '@/lib/intake/types'
import { MAX_DETAIL, MAX_TEXT, MAX_TEXTAREA } from '@/lib/intake/validate'

/** One question of the intake form, in whatever input its type needs. */

export interface QuestionValue {
  value: string | string[]
  detail: string
}

interface IntakeQuestionProps {
  field: IntakeField
  answer: QuestionValue
  error: string | undefined
  onChange: (next: QuestionValue) => void
}

const INPUT =
  'w-full rounded-md border bg-white px-4 py-3 text-base text-brand-ink transition-all duration-300 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary'

const SCALE = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']

export default function IntakeQuestion({ field, answer, error, onChange }: IntakeQuestionProps) {
  const id = `q-${field.id}`
  const border = error ? 'border-red-600' : 'border-brand-border'
  const describedBy = [field.helpText ? `${id}-help` : null, error ? `${id}-error` : null].filter(Boolean).join(' ') || undefined
  const text = typeof answer.value === 'string' ? answer.value : ''
  const picked = Array.isArray(answer.value) ? answer.value : []
  const setValue = (value: string | string[]) => onChange({ ...answer, value })
  const isGroup = field.type === 'checkbox-group' || field.type === 'scale'

  const label = (
    <>
      {field.label}
      {field.required ? (
        <span className="ml-1 text-red-600" aria-hidden="true">
          *
        </span>
      ) : null}
      {field.required ? <span className="sr-only"> (required)</span> : null}
    </>
  )

  function control() {
    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            id={id}
            rows={4}
            maxLength={MAX_TEXTAREA}
            value={text}
            onChange={(e) => setValue(e.target.value)}
            aria-invalid={!!error}
            aria-describedby={describedBy}
            className={`${INPUT} ${border}`}
          />
        )
      case 'select':
        return (
          <select
            id={id}
            value={text}
            onChange={(e) => setValue(e.target.value)}
            aria-invalid={!!error}
            aria-describedby={describedBy}
            className={`${INPUT} ${border}`}
          >
            <option value="">Choose one</option>
            {field.options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        )
      case 'checkbox-group':
        return (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-3">
            {field.options.map((option) => {
              const checked = picked.includes(option)
              return (
                <label key={option} className="flex items-start gap-3 text-base text-brand-ink cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() =>
                      setValue(checked ? picked.filter((p) => p !== option) : field.options.filter((o) => o === option || picked.includes(o)))
                    }
                    className="mt-1 h-4 w-4 shrink-0 accent-brand-primary"
                  />
                  <span>{option}</span>
                </label>
              )
            })}
          </div>
        )
      case 'scale':
        return (
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
            {SCALE.map((n) => {
              const selected = text === n
              return (
                <label
                  key={n}
                  className={`flex h-11 items-center justify-center rounded-md border text-sm font-medium cursor-pointer transition-all duration-300 focus-within:ring-2 focus-within:ring-brand-primary focus-within:ring-offset-2 ${
                    selected
                      ? 'border-brand-primary bg-brand-primary-900 text-white'
                      : `${border} bg-white text-brand-ink hover:bg-brand-sand`
                  }`}
                >
                  <input
                    type="radio"
                    name={id}
                    value={n}
                    checked={selected}
                    onChange={() => setValue(n)}
                    className="sr-only"
                  />
                  {n}
                </label>
              )
            })}
          </div>
        )
      default:
        return (
          <input
            id={id}
            type={field.type === 'email' ? 'email' : field.type === 'date' ? 'date' : 'text'}
            maxLength={field.type === 'date' ? undefined : MAX_TEXT}
            value={text}
            onChange={(e) => setValue(e.target.value)}
            aria-invalid={!!error}
            aria-describedby={describedBy}
            autoComplete="off"
            className={`${INPUT} ${border}`}
          />
        )
    }
  }

  return (
    <div id={`${id}-wrap`} className="scroll-mt-32">
      {isGroup ? (
        <fieldset aria-describedby={describedBy}>
          <legend className="mb-2 text-base font-medium text-brand-ink">{label}</legend>
          {field.helpText ? (
            <p id={`${id}-help`} className="mb-3 text-sm text-brand-muted">
              {field.helpText}
            </p>
          ) : null}
          {control()}
        </fieldset>
      ) : (
        <>
          <label htmlFor={id} className="mb-2 block text-base font-medium text-brand-ink">
            {label}
          </label>
          {field.helpText ? (
            <p id={`${id}-help`} className="mb-3 text-sm text-brand-muted">
              {field.helpText}
            </p>
          ) : null}
          {control()}
        </>
      )}
      {field.withDetail ? (
        <div className="mt-3">
          <label htmlFor={`${id}-detail`} className="mb-1 block text-sm text-brand-muted">
            Details
          </label>
          <textarea
            id={`${id}-detail`}
            rows={2}
            maxLength={MAX_DETAIL}
            value={answer.detail}
            onChange={(e) => onChange({ ...answer, detail: e.target.value })}
            className={`${INPUT} border-brand-border`}
          />
        </div>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="mt-2 text-sm text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  )
}
