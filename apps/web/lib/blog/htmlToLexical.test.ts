import { describe, it, expect } from 'vitest'
import { collectImageSources, htmlToLexical, lexicalPlainText } from './htmlToLexical'
import { TEXT_FORMAT, videoEmbedSrc } from './lexical'

const body = (html: string) => new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html').body

const convert = (html: string, media: Record<string, number> = {}) => {
  let n = 0
  return htmlToLexical(body(html), {
    mediaIdFor: (src) => media[src],
    nodeId: () => `node${++n}`,
  })
}

const blocks = (html: string, media?: Record<string, number>) => convert(html, media).doc.root.children

describe('htmlToLexical', () => {
  it('turns an empty body into an empty document', () => {
    expect(blocks('')).toEqual([])
    expect(blocks('<p>&nbsp;</p><p> </p><div><br></div>')).toEqual([])
  })

  it('keeps paragraph text verbatim, collapsing only HTML whitespace', () => {
    const [p] = blocks('<p>  Happy June,\n   beautiful soul  </p>')
    expect(p).toMatchObject({ type: 'paragraph', children: [{ type: 'text', text: 'Happy June, beautiful soul', format: 0 }] })
  })

  it('decodes HTML entities and keeps her punctuation as written', () => {
    const [p] = blocks('<p>Body &amp; mind &#8211; it&#8217;s &ldquo;yours&rdquo; &mdash; always&hellip;</p>')
    expect(p?.type === 'paragraph' && p.children[0]).toMatchObject({ text: 'Body & mind – it’s “yours” — always…' })
  })

  it('maps headings to the editor sizes h2 to h4', () => {
    const out = blocks('<h1>One</h1><h2>Two</h2><h3>Three</h3><h4>Four</h4><h6>Six</h6>')
    expect(out.map((b) => (b.type === 'heading' ? b.tag : b.type))).toEqual(['h2', 'h2', 'h3', 'h4', 'h4'])
    expect(out[2]).toMatchObject({ children: [{ type: 'text', text: 'Three' }] })
  })

  it('keeps bold, italic and underline as format flags', () => {
    const [p] = blocks('<p>a <strong>b <em>c</em></strong> <u>d</u></p>')
    if (p?.type !== 'paragraph') throw new Error('expected a paragraph')
    expect(p.children).toMatchObject([
      { text: 'a ', format: 0 },
      { text: 'b ', format: TEXT_FORMAT.bold },
      { text: 'c', format: TEXT_FORMAT.bold | TEXT_FORMAT.italic },
      { text: ' ', format: 0 },
      { text: 'd', format: TEXT_FORMAT.underline },
    ])
  })

  it('keeps links with their url and target', () => {
    const [p] = blocks('<p>Read <a href="https://example.com/x" target="_blank">the <b>guide</b></a> now</p>')
    if (p?.type !== 'paragraph') throw new Error('expected a paragraph')
    expect(p.children[1]).toMatchObject({
      type: 'link',
      fields: { url: 'https://example.com/x', newTab: true, linkType: 'custom' },
      children: [{ text: 'the ', format: 0 }, { text: 'guide', format: TEXT_FORMAT.bold }],
    })
  })

  it('keeps bullet and numbered lists, nested lists included', () => {
    const [ul, ol] = blocks('<ul><li>One</li><li>Two<ul><li>Two a</li></ul></li></ul><ol start="3"><li>Three</li></ol>')
    expect(ul).toMatchObject({ type: 'list', listType: 'bullet', tag: 'ul' })
    if (ul?.type !== 'list') throw new Error('expected a list')
    expect(ul.children[0]).toMatchObject({ type: 'listitem', value: 1, children: [{ text: 'One' }] })
    expect(ul.children[2]).toMatchObject({ children: [{ type: 'list', children: [{ children: [{ text: 'Two a' }] }] }] })
    expect(ol).toMatchObject({ type: 'list', listType: 'number', tag: 'ol', start: 3, children: [{ value: 3 }] })
  })

  it('keeps line breaks inside a paragraph', () => {
    const [p] = blocks('<p>Po Box 910<br>Kyalami</p>')
    expect(p).toMatchObject({ children: [{ text: 'Po Box 910' }, { type: 'linebreak' }, { text: 'Kyalami' }] })
  })

  it('turns an image into a Payload upload with its alt text', () => {
    const out = blocks('<p>Before</p><figure><a href="/x"><img src="https://site/a.jpg" alt="Suzanne on stage"></a></figure><p>After</p>', {
      'https://site/a.jpg': 42,
    })
    expect(out.map((b) => b.type)).toEqual(['paragraph', 'upload', 'paragraph'])
    expect(out[1]).toEqual({
      type: 'upload',
      version: 3,
      format: '',
      id: 'node1',
      fields: { alt: 'Suzanne on stage' },
      relationTo: 'media',
      value: 42,
    })
  })

  it('reads lazy-loaded image sources and never hot-links a missing one', () => {
    const { doc, report } = convert('<img data-lazy-src="https://site/b.jpg" src="data:image/gif;base64,R0">')
    expect(doc.root.children).toEqual([])
    expect(report.missingImages).toEqual(['https://site/b.jpg'])
  })

  it('keeps an image inside running text after the text before it', () => {
    const out = blocks('<p>Text <img src="https://site/c.png"> more</p>', { 'https://site/c.png': 7 })
    expect(out.map((b) => b.type)).toEqual(['paragraph', 'upload', 'paragraph'])
  })

  it('keeps a YouTube embed as a link the renderer plays', () => {
    const { doc, report } = convert('<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ?feature=oembed"></iframe>')
    expect(doc.root.children[0]).toMatchObject({
      type: 'paragraph',
      children: [{ type: 'link', fields: { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' } }],
    })
    expect(report.embeds).toEqual(['https://www.youtube.com/watch?v=dQw4w9WgXcQ'])
    expect(videoEmbedSrc('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ')
  })

  it('keeps other embeds as a plain link', () => {
    const [p] = blocks('<p><iframe src="https://maps.example.com/embed?x=1"></iframe></p>')
    expect(p).toMatchObject({ children: [{ type: 'link', fields: { url: 'https://maps.example.com/embed?x=1' } }] })
  })

  it('keeps quotes and horizontal rules', () => {
    const out = blocks('<blockquote><p>One</p><p>Two</p></blockquote><hr>')
    expect(out[0]).toMatchObject({ type: 'quote', children: [{ text: 'One' }, { type: 'linebreak' }, { text: 'Two' }] })
    expect(out[1]).toEqual({ type: 'horizontalrule', version: 1 })
  })

  it('reads table-built email layouts (AWeber newsletters) as paragraphs', () => {
    const out = blocks('<table><tr><td><h2>Title</h2></td></tr><tr><td>First line</td><td>Second line</td></tr></table>')
    expect(out.map((b) => b.type)).toEqual(['heading', 'paragraph', 'paragraph'])
  })

  it('drops scripts, styles, hidden elements and form chrome', () => {
    const out = blocks('<style>.x{}</style><script>alert(1)</script><div style="display:none">hidden</div><form><input></form><p>Kept</p>')
    expect(out).toHaveLength(1)
    expect(lexicalPlainText(convert('<p>Kept</p>').doc)).toBe('Kept')
  })

  it('lists every image source once, in order', () => {
    expect(collectImageSources(body('<img src="a.jpg"><p><img data-src="b.jpg"></p><img src="a.jpg">'))).toEqual(['a.jpg', 'b.jpg'])
  })

  it('keeps emoji and non-breaking spaces inside text', () => {
    const [p] = blocks('<p>Happy June ☀️ soul</p>')
    expect(p).toMatchObject({ children: [{ text: 'Happy June ☀️ soul' }] })
  })
  it('writes an image inside a heading once, after the heading', () => {
    const out = blocks('<h2>Title <img src="https://site/h.png"></h2>', { 'https://site/h.png': 3 })
    expect(out.map((b) => b.type)).toEqual(['heading', 'upload'])
  })

  it('keeps text before an image inside an inline wrapper ahead of the image', () => {
    const out = blocks('<p><span>caption <img src="https://site/s.png"> more</span></p>', { 'https://site/s.png': 4 })
    expect(out.map((b) => b.type)).toEqual(['paragraph', 'upload'])
    expect(lexicalPlainText(convert('<p><span>caption <img src="x.png"> more</span></p>').doc)).toBe('caption more')
  })

  it('keeps the space between a word and a link', () => {
    const [p] = blocks('<p>foo<a href="https://x.example"> bar</a>baz</p>')
    if (p?.type !== 'paragraph') throw new Error('expected a paragraph')
    expect(p.children[0]).toMatchObject({ text: 'foo' })
    expect(p.children[1]).toMatchObject({ type: 'link', children: [{ text: ' bar' }] })
  })

  it('keeps paragraphs apart inside an inline wrapper', () => {
    const out = blocks('<a href="https://x.example"><p>One</p><p>Two</p></a>')
    expect(out.map((b) => b.type)).toEqual(['paragraph', 'paragraph'])
  })

  it('drops hidden inline text such as an email preheader', () => {
    expect(lexicalPlainText(convert('<p><span style="display:none">preheader</span>Seen</p>').doc)).toBe('Seen')
  })

  it('reads protocol-relative and lazy-loaded embeds', () => {
    const { report } = convert('<iframe src="//www.youtube.com/embed/dQw4w9WgXcQ"></iframe><iframe src="about:blank" data-lazy-src="https://vimeo.com/123456"></iframe>')
    expect(report.embeds).toEqual(['https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'https://vimeo.com/123456'])
  })
  it('keeps the alignment of a paragraph that opens with bold text', () => {
    const [p] = blocks('<p style="text-align:center"><strong>Centred</strong> line</p>')
    expect(p).toMatchObject({ type: 'paragraph', format: 'center' })
  })

  it('keeps an image inside a quote, after the quote, and drops an image-only link shell', () => {
    const out = blocks('<blockquote><p>Said</p><img src="https://site/q.png"></blockquote><ul><li><a href="https://x.example"><img src="https://site/l.png"></a> Item</li></ul>', {
      'https://site/q.png': 1,
      'https://site/l.png': 2,
    })
    expect(out.map((b) => b.type)).toEqual(['quote', 'upload', 'list', 'upload'])
    const list = out[2]
    if (list?.type !== 'list') throw new Error('expected a list')
    expect(list.children[0]?.children.some((c) => c.type === 'link')).toBe(false)
  })
})
