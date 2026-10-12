import { describe, it, expect } from 'vitest'
import { downloadFileOf, downloadsForOrder, isDownloadOnlyOrder } from './storage'

const audio = {
  title: 'Bringing Your Energy Back',
  variant: {
    metadata: null,
    product: { title: 'Bringing Your Energy Back', metadata: { download_file: 'audio/bringing-your-energy-back.mp3' } },
  },
}
const course = {
  title: 'Getting Unstuck (Self Study)',
  variant: { metadata: { thinkific_course_id: '1284792' }, product: { title: 'Getting Unstuck (Self Study)', metadata: null } },
}

describe('downloadFileOf', () => {
  it('reads the file from the product metadata and names it after the path', () => {
    expect(downloadFileOf(audio)).toEqual({
      title: 'Bringing Your Energy Back',
      path: 'audio/bringing-your-energy-back.mp3',
      filename: 'bringing-your-energy-back.mp3',
    })
  })

  it('lets the variant override the product and uses download_filename when given', () => {
    const item = {
      ...audio,
      variant: {
        metadata: { download_file: 'audio/v2.mp3', download_filename: 'Bringing Your Energy Back.mp3' },
        product: audio.variant.product,
      },
    }
    expect(downloadFileOf(item)).toEqual({
      title: 'Bringing Your Energy Back',
      path: 'audio/v2.mp3',
      filename: 'Bringing Your Energy Back.mp3',
    })
  })

  it('is null for a course and for a path that leaves the bucket folder', () => {
    expect(downloadFileOf(course)).toBeNull()
    expect(
      downloadFileOf({ title: 'x', variant: { product: { title: 'x', metadata: { download_file: '../secrets.txt' } } } })
    ).toBeNull()
  })
})

describe('downloadsForOrder / isDownloadOnlyOrder', () => {
  it('lists each file once, in order, and knows a download-only order', () => {
    expect(downloadsForOrder([audio, audio, course]).map((f) => f.path)).toEqual(['audio/bringing-your-energy-back.mp3'])
    expect(isDownloadOnlyOrder([audio])).toBe(true)
    expect(isDownloadOnlyOrder([audio, course])).toBe(false)
    expect(isDownloadOnlyOrder([])).toBe(false)
  })
})
