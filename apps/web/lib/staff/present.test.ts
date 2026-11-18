import { describe, it, expect } from 'vitest'
import type { Quiz } from '@/app/explore/quizzes/types'
import { formatSast, intakeAnswerGroups, marketingChoiceText, personName, quizAnswerRows } from './present'

const QUIZ = {
  slug: 'nervous-system',
  title: 'Nervous System Pattern',
  questions: [
    { id: 1, text: 'I feel on edge', category: 'fight' },
    { id: 2, text: 'I overthink', category: 'flight' },
  ],
} as unknown as Quiz

describe('quizAnswerRows', () => {
  it('pairs every question with its scale answer, in question order', () => {
    expect(quizAnswerRows(QUIZ, { '2': 0, '1': 4 })).toEqual([
      { question: 'I feel on edge', answer: 'Almost Always (4 of 4)' },
      { question: 'I overthink', answer: 'Never (0 of 4)' },
    ])
  })

  it('marks unanswered questions and keeps answers to ids the quiz no longer has', () => {
    expect(quizAnswerRows(QUIZ, { '1': 2, '9': 1 })).toEqual([
      { question: 'I feel on edge', answer: 'Sometimes (2 of 4)' },
      { question: 'I overthink', answer: 'Not answered' },
      { question: 'Question 9 (no longer in this diagnostic)', answer: 'Rarely (1 of 4)' },
    ])
  })

  it('still shows the answers when the quiz is gone', () => {
    expect(quizAnswerRows(undefined, { '3': 3 })).toEqual([{ question: 'Question 3', answer: 'Often (3 of 4)' }])
  })
})

describe('intakeAnswerGroups', () => {
  it('groups answers under their headings with the wording as answered', () => {
    const groups = intakeAnswerGroups({
      acknowledged: true,
      items: [
        { fieldId: 'a', type: 'text', label: 'Your goal', value: 'Calm', section: 'About you' },
        { fieldId: 'b', type: 'checkbox-group', label: 'Health information', value: ['Panic', 'Sad'], detail: ' Since May ', section: 'Health' },
        { fieldId: 'c', type: 'scale', label: 'Stress level', value: '8', section: 'Health' },
        { fieldId: 'd', type: 'textarea', label: 'Anything else', value: '' },
      ],
    })
    expect(groups).toEqual([
      { section: 'About you', items: [{ question: 'Your goal', answer: 'Calm' }] },
      {
        section: 'Health',
        items: [
          { question: 'Health information', answer: 'Panic, Sad', detail: 'Since May' },
          { question: 'Stress level', answer: '8 / 10' },
        ],
      },
      { section: null, items: [{ question: 'Anything else', answer: 'Not answered' }] },
    ])
  })

  it('is empty without answers', () => {
    expect(intakeAnswerGroups(null)).toEqual([])
  })
})

describe('marketingChoiceText, formatSast, personName', () => {
  it('reads the stored choice', () => {
    const at = '2026-11-18T08:00:00Z'
    expect(marketingChoiceText({ marketing_opt_in: true, marketing_channels: ['sms', 'email'], marketing_choice_at: at })).toBe(
      'Opted in: SMS, Email',
    )
    expect(marketingChoiceText({ marketing_opt_in: false, marketing_channels: [], marketing_choice_at: at })).toBe('Not opted in')
    expect(marketingChoiceText({ marketing_opt_in: false, marketing_channels: null, marketing_choice_at: null })).toBe(
      'No choice recorded',
    )
  })

  it('formats times in SAST and names people', () => {
    expect(formatSast('2026-11-18T12:05:00Z')).toBe(`${new Intl.DateTimeFormat('en-ZA', {
      timeZone: 'Africa/Johannesburg',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date('2026-11-18T12:05:00Z'))} SAST`)
    expect(formatSast('2026-11-18T12:05:00Z')).toContain('14:05')
    expect(formatSast(null)).toBe('Not recorded')
    expect(formatSast('garbage')).toBe('Not recorded')
    expect(personName(' Jane ', null, 'x@y.z')).toBe('Jane')
    expect(personName(null, '', 'x@y.z')).toBe('x@y.z')
  })
})
