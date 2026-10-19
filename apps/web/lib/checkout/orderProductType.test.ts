import { describe, expect, it } from 'vitest'
import { orderProductType, type OrderLineForType } from './orderProductType'
import { confirmationNextSteps } from './confirmationSteps'

const line = (
  handle: string,
  categories: string[] = [],
  variantMeta: Record<string, unknown> | null = null,
  productMeta: Record<string, unknown> | null = null
): OrderLineForType => ({
  variant: { metadata: variantMeta, product: { handle, metadata: productMeta, categories: categories.map((h) => ({ handle: h })) } },
})

describe('orderProductType (mirror of order-placed.ts)', () => {
  it('reads a private session from its category', () => {
    expect(orderProductType([line('rapid-repatterning-session', ['private-sessions'])])).toBe('session')
  })

  it('makes a course line self-paced whatever its category says', () => {
    expect(orderProductType([line('getting-unstuck-self-study', ['life-enhancing-self-paced'], { thinkific_course_id: '1284792' })])).toBe('self-paced')
  })

  it('keeps a live programme that also enrols a course as live-course', () => {
    expect(orderProductType([line('rr-program-1-live-via-zoom', ['rp-live'], { thinkific_course_id: '1349879' })])).toBe('live-course')
  })

  it('reads a live seat without a course as live', () => {
    expect(orderProductType([line('rr-program-1-live-via-zoom', ['rp-live'])])).toBe('live')
  })

  it('reads mentorship before anything else', () => {
    expect(orderProductType([line('practitioner-mentorship-session', ['private-sessions'])])).toBe('mentorship')
  })

  it('reads a group handle as group, not session', () => {
    expect(orderProductType([line('shedding-excess-weight-group-session')])).toBe('group')
  })

  it('reads a download-only order as download', () => {
    expect(orderProductType([line('bringing-your-energy-back', ['digital-downloads'], null, { download_file: 'audio/x.mp3' })])).toBe('download')
  })

  it('falls back to other for a book or an unknown product', () => {
    expect(orderProductType([line('the-latest-book-by-suzanne', ['books'])])).toBe('other')
    expect(orderProductType([])).toBe('other')
  })

  it('ignores inherited object keys as category handles', () => {
    expect(orderProductType([line('x', ['constructor'])])).toBe('other')
  })
})

describe('confirmationNextSteps', () => {
  it('gives each product type its own steps', () => {
    expect(confirmationNextSteps('session')).toMatch(/book your session/)
    expect(confirmationNextSteps('self-paced')).toMatch(/course access email/)
    expect(confirmationNextSteps('live')).toMatch(/Zoom details/)
    expect(confirmationNextSteps('live-course')).toMatch(/course access email.*Zoom details/)
    expect(confirmationNextSteps('download')).toMatch(/download links/)
    expect(confirmationNextSteps('mentorship')).toMatch(/nothing to book/)
  })

  it('does not promise a session booking for other orders', () => {
    expect(confirmationNextSteps('other')).not.toMatch(/session/)
    expect(confirmationNextSteps(null)).not.toMatch(/session/)
  })
})
