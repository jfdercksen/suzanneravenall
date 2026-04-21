import { writeFileSync, mkdirSync } from 'fs'

const API_KEY = process.env.FIRECRAWL_API_KEY
const OUTPUT_DIR = 'infra/scripts/scraped-content'

const PAGES = [
  { slug: 'masterclass', url: 'https://suzanneravenall.com/masterclass2/' },
  { slug: 'resources-media', url: 'https://suzanneravenall.com/media/' },
  { slug: 'resources-articles', url: 'https://suzanneravenall.com/articles/' },
  { slug: 'resources-awards', url: 'https://suzanneravenall.com/awards/' },
  { slug: 'resources-newsletter', url: 'https://suzanneravenall.com/category/newsletter/' },
  { slug: 'transformation-pathways', url: 'https://suzanneravenall.com/transformation-pathways/' },
  { slug: 'dates-repository', url: 'https://suzanneravenall.com/dates-repository/' },
]

mkdirSync(OUTPUT_DIR, { recursive: true })

async function scrapePage(slug, url) {
  console.log(`Scraping: ${url}`)
  const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url,
      formats: ['markdown'],
      onlyMainContent: true,
      excludeTags: ['nav', 'header', 'footer'],
    })
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`)
  const data = await res.json()
  if (!data.success) throw new Error(`Firecrawl error: ${JSON.stringify(data)}`)
  const output = {
    slug, url,
    title: data.data?.metadata?.title || '',
    markdown: data.data?.markdown || '',
    scrapedAt: new Date().toISOString(),
  }
  const filePath = `${OUTPUT_DIR}/${slug}.md`
  writeFileSync(filePath, `# ${output.title}\n\nSource: ${url}\nScraped: ${output.scrapedAt}\n\n---\n\n${output.markdown}`)
  console.log(`  ✓ Saved: ${filePath} (${output.markdown.length} chars)`)
  await new Promise(r => setTimeout(r, 1000))
  return output
}

const results = []
for (const page of PAGES) {
  try {
    const result = await scrapePage(page.slug, page.url)
    results.push({ slug: page.slug, status: 'ok', chars: result.markdown.length })
  } catch (err) {
    console.error(`  ✗ Failed: ${page.slug} — ${err.message}`)
    results.push({ slug: page.slug, status: 'failed', error: err.message })
  }
}

console.log('\n=== SCRAPE SUMMARY ===')
results.forEach(r => {
  const status = r.status === 'ok' ? `✓ ${r.chars} chars` : `✗ ${r.error}`
  console.log(`  ${r.slug}: ${status}`)
})
