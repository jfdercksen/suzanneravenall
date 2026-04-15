import { writeFileSync, mkdirSync } from 'fs'

const API_KEY = process.env.FIRECRAWL_API_KEY
const OUTPUT_DIR = 'infra/scripts/scraped-content'

if (!API_KEY) {
  console.error('FIRECRAWL_API_KEY not set')
  console.error('Run: FIRECRAWL_API_KEY=your_key node infra/scripts/scrape-wordpress-content.mjs')
  process.exit(1)
}

mkdirSync(OUTPUT_DIR, { recursive: true })

const PAGES = [
  { slug: 'about', url: 'https://suzanneravenall.com/about/' },
  { slug: 'services-private', url: 'https://suzanneravenall.com/services/private-sessions/' },
  { slug: 'services-group', url: 'https://suzanneravenall.com/services/group-sessions/' },
  { slug: 'speaking', url: 'https://suzanneravenall.com/speaking/' },
  { slug: 'programmes', url: 'https://suzanneravenall.com/guided-programmes/' },
  { slug: 'explore-health-vitality', url: 'https://suzanneravenall.com/next-level-health-vitality-longevity/' },
  { slug: 'explore-intuition', url: 'https://suzanneravenall.com/intuition-as-patterned-intelligence/' },
  { slug: 'explore-relationships', url: 'https://suzanneravenall.com/relationships-attachment-patterns/' },
  { slug: 'explore-leadership', url: 'https://suzanneravenall.com/leadership-high-performance/' },
  { slug: 'explore-transitions', url: 'https://suzanneravenall.com/life-transitions-reinvention/' },
  { slug: 'explore-emotional', url: 'https://suzanneravenall.com/emotional-nervous-system-mastery/' },
  { slug: 'explore-health-energy', url: 'https://suzanneravenall.com/health-energy-intelligence/' },
  { slug: 'explore-identity', url: 'https://suzanneravenall.com/identity-purpose-activation/' },
]

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
      excludeTags: ['nav', 'header', 'footer', '.elementor-menu-toggle'],
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`HTTP ${res.status}: ${err}`)
  }

  const data = await res.json()

  if (!data.success) {
    throw new Error(`Firecrawl error: ${JSON.stringify(data)}`)
  }

  const output = {
    slug,
    url,
    title: data.data?.metadata?.title || '',
    description: data.data?.metadata?.description || '',
    markdown: data.data?.markdown || '',
    scrapedAt: new Date().toISOString(),
  }

  const filePath = `${OUTPUT_DIR}/${slug}.md`
  writeFileSync(
    filePath,
    `# ${output.title}\n\nSource: ${url}\nScraped: ${output.scrapedAt}\n\n---\n\n${output.markdown}`
  )

  console.log(`  ✓ Saved: ${filePath} (${output.markdown.length} chars)`)

  // Polite delay — 1 second between requests
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
console.log('\nCheck infra/scripts/scraped-content/ for all files.')
