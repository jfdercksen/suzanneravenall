#!/usr/bin/env node
/**
 * generate-product-images.mjs
 *
 * Generates a unique AI image for each Medusa shop product via Kie.ai,
 * uploads it to Medusa file storage, and sets it as the product thumbnail.
 *
 * Run from repo root:
 *   node infra/scripts/generate-product-images.mjs
 *
 * Required env vars:
 *   KIE_API_KEY              — Kie.ai API key (already in infra/.env)
 *   MEDUSA_ADMIN_EMAIL       — defaults to admin@suzanneravenall.com
 *   MEDUSA_ADMIN_PASSWORD    — defaults to P@ssw0rd.123
 *   MEDUSA_URL               — defaults to http://169.239.180.49/api
 *
 * Resumable: infra/scripts/product-images-log.json tracks completed products.
 * Re-running skips products already in the log and products with existing thumbnails.
 * Local image cache: apps/web/public/images/products/{handle}.webp
 *
 * Estimated runtime: 30–60 minutes for 47 products.
 */

import fs from 'fs'
import path from 'path'
import https from 'https'
import http from 'http'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '../../')

// ── Environment ─────────────────────────────────────────────────────────────

const KIE_API_KEY = process.env.KIE_API_KEY
const MEDUSA_URL = process.env.MEDUSA_URL || 'http://169.239.180.49/api'
const MEDUSA_EMAIL = process.env.MEDUSA_ADMIN_EMAIL || 'admin@suzanneravenall.com'
const MEDUSA_PASSWORD = process.env.MEDUSA_ADMIN_PASSWORD || 'P@ssw0rd.123'
const FORCE = process.env.FORCE === '1'

if (!KIE_API_KEY) {
  console.error('Error: KIE_API_KEY environment variable is required.')
  console.error('  $env:KIE_API_KEY="your_key"  (PowerShell)')
  console.error('  KIE_API_KEY=your_key          (bash)')
  process.exit(1)
}

const KIE_API_BASE = 'https://api.kie.ai/api/v1'
const OUTPUT_DIR = path.join(ROOT, 'apps/web/public/images/products')
const LOG_FILE = path.join(__dirname, 'product-images-log.json')

// 10 concurrent tasks × 1 poll/5s = 2 polls/s = 20 polls/10s — stays at rate limit
const CONCURRENT = 10
const BATCH_DELAY_MS = 10000

// ── Prompt map (keyed by exact Medusa product handle) ───────────────────────
// Products without an explicit entry fall back to their category prompt.

const PROMPT_MAP = {
  // Private Sessions — 1:1 coaching
  'rapid-repatterning-session':
    'Energy healing session, person in peaceful meditative state, soft blue healing light, dark atmospheric studio, professional coaching environment, cinematic photography, no text',
  'resonance-repatterning-session':
    'Sound and energy resonance visualization, healing waves rippling outward, person in transformation, dark atmospheric background, deep blues and golds, cinematic, no text',
  'transformation-coaching-60-mins':
    'Personal transformation breakthrough moment, silhouette stepping from darkness into golden light, powerful and emotional, South African sunrise backdrop, cinematic photography, no text',
  'executive-coaching-30-mins':
    'Executive coaching session in modern glass office, city skyline background, leadership and performance energy, professional atmosphere, cinematic photography, no text',
  'akashic-clearing-session':
    'Mystical akashic records visualization, infinite cosmic library with glowing golden doorways, deep space blues and golds, ethereal atmosphere, cinematic, no people, no text',
  'rapid-transformation-therapy-session':
    'Deep healing visualization, neural pathways lighting up in electric blue, transformation therapy concept, brain rewiring energy patterns, dark background, cinematic, no text',
  'energetic-clearing-completed-remotely':
    'Energy clearing visualization, white light radiance cleansing a silhouette, spiritual healing atmosphere, rays of healing light, person surrounded by pure white glow, cinematic, no text',
  'exploring-the-alpha-mind-45-minutes':
    'Alpha mind state visualization, serene brainwave patterns glowing electric blue, deep meditation concept, neural network lighting up, very dark background, cinematic, no text',
  'group-family-coaching-60-mins':
    'Family healing circle, four people in warm embrace of golden light, soft natural light through windows, authentic emotional connection, cinematic lifestyle photography, no text',

  // Resonance Repatterning Programmes
  'resonance-repatterning-program-1-fundamentals-live-via-zoom':
    'Resonance repatterning fundamentals visualization, sacred geometry patterns unfolding, healing frequencies as light waves, deep blues and golds on dark background, cinematic, no text',
  'resonance-repatterning-program-2-primary-patterns-live-via-zoom':
    'Primary patterns healing visualization, layered geometric energy fields dissolving, deep blues and golds, transformation energy, cinematic, no text',
  'resonance-repatterning-program-3-unconscious-patterns-live-via-zoom':
    'Unconscious pattern transformation, shadowed pathways illuminating one by one, from darkness to electric blue light, deep and atmospheric, cinematic, no text',
  'resonance-repatterning-program-4-chakra-patterns-live-via-zoom':
    'Chakra energy centers along a spine silhouette, spinning light vortices in vibrant colors, deep navy background, sacred geometry, cinematic visualization, no text',
  'resonance-repatterning-program-5-five-elements-meridians-live-via-zoom':
    'Five elements and meridian energy flow map, Chinese medicine visualization, interconnected energy channels glowing, deep blues and golds, cinematic, no text',
  'resonance-repatterning-full-basic-training-series-programs-1-5-live-via-zoom':
    'Complete transformation journey through five healing layers, cascading sacred geometry patterns converging into one, blues and golds, cinematic, no text',
  'resonance-repatterning-accelerated-basic-5-training-series-review-of-programs-1-5-live-via-zoom':
    'Accelerated transformation visualization, rapid neural pathway lightning, speed lines of electric energy, breakthrough and momentum concept, cinematic, no text',
  'resonance-repatterning-program-7-principles-of-relationships-practical-demos-self-study':
    'Relationship principles energy visualization, two luminous fields merging harmoniously, warm golden connection, deep navy background, cinematic, no text',
  'resonance-repatterning-program-9-energetics-of-relationships-practical-demos-self-study':
    'Energetics of relationships, two intertwined energy spirals flowing together, warm golden tones, deep blues, cinematic visualization, no text',
  'resonance-repatterning-all-repatternings-as-demos-talk-throughs-resources-self-study':
    'Comprehensive healing resource library, glowing manuscripts and light patterns forming a collection, sacred geometry archive, cinematic, no text',
  'resonance-repatterning-accelerated-basic-5-training-series-review-of-programs-1-5-live-via-zoom':
    'Accelerated healing synthesis, five sacred geometry patterns merging rapidly into one unified field, speed and mastery, cinematic, no text',

  // Akashic Navigator Programmes
  'akashic-navigator-intuitive-coaching-fundamentals-clearing-self-level-1-live-via-zoom':
    'Akashic records navigation portal opening, cosmic library doorway of golden light, glowing ancient manuscripts in deep space, intuitive guidance visualization, cinematic, no text',
  'akashic-navigator-intuitive-coaching-advanced-clearing-others-level-2-live-via-zoom':
    'Advanced akashic navigation, multiple golden light portals opening in infinite deep space, expanded cosmic awareness, cinematic, no text',
  'akashic-navigator-intuitive-coaching-fundamentals-advanced-purchased-together-live-via-zoom':
    'Complete akashic mastery journey, infinite cosmic library stretching to horizon, golden manuscripts floating in space, full spiritual archive, cinematic, no text',

  // Deep Energy Clearing
  'deep-energy-clearing-fundamentals-clearing-self-level-1-live-via-zoom':
    'Deep energy clearing visualization, layers of dense energy dissolving into white and blue light, profound inner healing, cleansing radiance, cinematic, no text',
  'deep-energy-clearing-advanced-clearing-others-level-2-live-via-zoom':
    'Advanced energy clearing expanding outward, white and blue healing light radiating from center, clearing energy field of another person, cinematic, no text',

  // Be an Energy Ninja
  'be-an-energy-ninja-mastering-energy-for-an-abundant-life-repattern-your-life-level-1-live':
    'Energy mastery concept, silhouette controlling flowing electric blue energy streams with precision, abundant energy field, ninja-like focus, cinematic, no text',
  'be-an-energy-ninja-mastering-energy-for-an-abundant-life-repattern-your-life-level-2-live':
    'Advanced energy mastery, complex multi-stream energy field being directed with expert precision, electric blue and gold, power and control, cinematic, no text',

  // Life Enhancing
  'trauma-to-transcendence-breaking-the-hold-of-the-childhood-brain-on-your-adult-self-live':
    'Trauma healing and transcendence, butterfly emerging from darkness into golden sunrise light, dark to light transformation, powerful emotional journey, cinematic photography, no text',
  'finding-my-life-purpose-live':
    'Life purpose activation moment, person standing at golden crossroads with sunrise ahead, aspirational South African landscape, warm golden tones, cinematic photography, no text',
  'love-relationships-live':
    'Love and relationship healing, two luminous energy fields merging harmoniously, warm golden and rose tones, beautiful and emotional, cinematic, no text',
  'intuition-in-my-personal-capacity-live':
    'Intuitive intelligence visualization, third eye energy activating, streams of knowing light, deep seeing energy field, very dark atmospheric background, cinematic, no text',

  // Meditation & Mindfulness
  'meditation-live-via-zoom':
    'Deep meditation state, person in lotus position with golden light emanating from crown, serene and radiant, dark room with single light, cinematic photography, no text',
  'mindfulness-live':
    'Mindfulness and present moment awareness, person outdoors in nature with soft golden light, eyes closed in peaceful awareness, gentle bokeh background, cinematic lifestyle photography, no text',

  // Group Sessions
  'group-session-attraction-frequency-recorded':
    'Attraction frequency visualization, golden magnetic energy vortex drawing abundance inward, prosperity energy field, warm golden tones, cinematic, no text',
  'group-session-being-a-great-boundary-setter-booked-as-a-series-only':
    'Personal boundaries visualization, strong grounded energy field forming a protective sphere, clarity and protection concept, cinematic, no text',
  'career-progression-group-session':
    'Career breakthrough moment, silhouette ascending steps of light toward a glowing summit, city skyline, professional empowerment, cinematic photography, no text',
  'group-session-develop-super-confidence':
    'Confidence and power visualization, person standing arms outstretched in electric energy field, breakthrough moment, radiant strength, cinematic, no text',
  'love-relationships-group-session':
    'Group relationship healing circle, six people connected by warm golden energy flowing between them, authentic community connection, cinematic photography, no text',
  'money-mastery-group-session':
    'Financial abundance mindset visualization, cascading golden energy flowing like water, prosperity and wealth frequency, cinematic, no text',
  'group-session-nice-or-not-nice-in-communication-booked-as-a-series-only':
    'Clear compassionate communication visualization, light streams flowing between two energy fields, authentic connection channels, warm tones, cinematic, no text',
  'group-session-shedding-excess-weight':
    'Body transformation and vitality visualization, person feeling weightless and free in golden sunrise light, liberation energy, health and radiance, cinematic photography, no text',

  // Self-paced Life Enhancing
  'bringing-your-energy-back':
    'Energy restoration visualization, golden life-force energy flowing back into a person silhouette, renewal and vitality, replenishment concept, cinematic, no text',
  'coherence-muscle-testing-self-study-online-2':
    'Muscle testing and body wisdom concept, human energy field being tested with precision, kinesiological energy visualization, scientific and spiritual, cinematic, no text',
  'energetic-alignment-inner-neutrality':
    'Energetic alignment visualization, perfectly balanced symmetrical energy field, inner peace and neutrality, centered radiance, cinematic, no text',
  'getting-unstuck-self-study':
    'Breaking free from limitations, silhouette breaking through invisible energetic barriers, electric breakthrough energy, freedom and momentum, cinematic, no text',
  'post-traumatic-growth-self-study-online':
    'Post traumatic growth visualization, phoenix rising from dark ashes into golden light, transformation from pain to extraordinary strength, cinematic photography, no text',
  'relaxation-energy-reclamation':
    'Deep relaxation and energy reclamation, person bathed in soft warm healing light, profound peaceful rest, energy returning, cinematic photography, no text',

  // Products & Downloads
  'quantum-healing-codes-ebook-audio-download':
    'Quantum healing energy codes visualization, sacred geometric light patterns arranging into healing symbols, ethereal blues and golds, cinematic, no text',
}

// ── Category fallback prompts ────────────────────────────────────────────────

const CATEGORY_PROMPT_MAP = {
  'private-sessions': 'Professional one-on-one coaching session, transformation energy field, intimate dark studio, cinematic photography, no text',
  'guided-programmes': 'Guided spiritual learning journey, sacred knowledge and light wisdom, person ascending path of illumination, cinematic, no text',
  'group-sessions': 'Group healing circle, community energy flowing between participants, warm authentic light, cinematic photography, no text',
  'products-tools': 'Healing tools and sacred wisdom, geometric light patterns, golden energy tools, cinematic, no text',
  'rp-live': 'Resonance repatterning healing session live, sacred geometry energy patterns, blues and golds, cinematic, no text',
  'rp-self-paced': 'Resonance repatterning self-study, neural pathways lighting up, healing frequency visualization, cinematic, no text',
  'akashic-coaching': 'Akashic records coaching session, cosmic library portal, golden light guidance, cinematic, no text',
  'akashic-live': 'Akashic navigator live training, cosmic library doorways opening, deep space blues and golds, cinematic, no text',
  'energy-clearing-live': 'Live energy clearing programme, white and blue light healing, profound transformation, cinematic, no text',
  'energy-clearing-self-paced': 'Self-paced energy clearing journey, layers of energy releasing, healing light, cinematic, no text',
  'life-enhancing-live': 'Life enhancing live programme, golden transformation energy, person stepping into their power, cinematic, no text',
  'life-enhancing-self-paced': 'Life enhancing self-study, golden sunrise over South African landscape, transformation journey, cinematic, no text',
  'meditation-programmes': 'Deep meditation practice, golden light emanating in peaceful stillness, cinematic photography, no text',
  'digital-downloads': 'Digital healing resources, sacred geometric patterns and light codes, ethereal visualization, cinematic, no text',
  'books': 'Transformational book cover concept, wisdom and breakthrough, golden light on dark background, cinematic, no text',
}

// ── HTTP utilities ───────────────────────────────────────────────────────────

function fetchJson(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url)
    const lib = parsed.protocol === 'https:' ? https : http
    const body = options.body || null

    const headers = {
      'Content-Type': 'application/json',
    }
    if (options.kieAuth) headers['Authorization'] = `Bearer ${KIE_API_KEY}`
    if (options.token) headers['Authorization'] = `Bearer ${options.token}`
    if (body) headers['Content-Length'] = Buffer.byteLength(body)
    Object.assign(headers, options.headers || {})

    const reqOptions = {
      hostname: parsed.hostname,
      port: parsed.port || undefined,
      path: parsed.pathname + (parsed.search || ''),
      method: options.method || 'GET',
      headers,
    }

    const req = lib.request(reqOptions, (res) => {
      let raw = ''
      res.on('data', (chunk) => { raw += chunk })
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(raw) }) }
        catch { resolve({ status: res.statusCode, data: raw }) }
      })
    })
    req.on('error', reject)
    if (body) req.write(body)
    req.end()
  })
}

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url)
    const lib = parsed.protocol === 'https:' ? https : http
    const file = fs.createWriteStream(destPath)
    lib.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close()
        if (fs.existsSync(destPath)) fs.unlinkSync(destPath)
        return downloadFile(res.headers.location, destPath).then(resolve).catch(reject)
      }
      if (res.statusCode !== 200) {
        file.close()
        if (fs.existsSync(destPath)) fs.unlinkSync(destPath)
        return reject(new Error(`HTTP ${res.statusCode} downloading ${url}`))
      }
      res.pipe(file)
      file.on('finish', () => { file.close(); resolve() })
      file.on('error', (err) => {
        if (fs.existsSync(destPath)) fs.unlinkSync(destPath)
        reject(err)
      })
    }).on('error', (err) => {
      if (fs.existsSync(destPath)) fs.unlinkSync(destPath)
      reject(err)
    })
  })
}

function uploadToMedusa(token, filePath) {
  return new Promise((resolve, reject) => {
    const fileContent = fs.readFileSync(filePath)
    const filename = path.basename(filePath)
    const boundary = `----FormBoundary${Date.now()}`
    const parsed = new URL(`${MEDUSA_URL}/admin/uploads`)
    const lib = parsed.protocol === 'https:' ? https : http

    const ext = filename.split('.').pop()?.toLowerCase() ?? 'jpg'
    const mimeType = ext === 'webp' ? 'image/webp' : ext === 'png' ? 'image/png' : 'image/jpeg'
    const header = Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="files"; filename="${filename}"\r\nContent-Type: ${mimeType}\r\n\r\n`
    )
    const footer = Buffer.from(`\r\n--${boundary}--\r\n`)
    const totalLength = header.length + fileContent.length + footer.length

    const req = lib.request(
      {
        hostname: parsed.hostname,
        port: parsed.port || undefined,
        path: parsed.pathname,
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': totalLength,
        },
      },
      (res) => {
        let raw = ''
        res.on('data', (chunk) => { raw += chunk })
        res.on('end', () => {
          try { resolve({ status: res.statusCode, data: JSON.parse(raw) }) }
          catch { resolve({ status: res.statusCode, data: raw }) }
        })
      }
    )
    req.on('error', reject)
    req.write(header)
    req.write(fileContent)
    req.write(footer)
    req.end()
  })
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ── Kie.ai utilities ─────────────────────────────────────────────────────────

async function submitKieTask(prompt) {
  const body = JSON.stringify({
    model: 'nano-banana-2',
    input: {
      prompt,
      aspect_ratio: '4:3',
    },
  })
  const res = await fetchJson(`${KIE_API_BASE}/jobs/createTask`, {
    method: 'POST',
    body,
    kieAuth: true,
  })
  const taskId = res?.data?.data?.taskId || res?.data?.taskId || res?.taskId
  if (!taskId) throw new Error(`No taskId in response: ${JSON.stringify(res).slice(0, 300)}`)
  return taskId
}

async function pollKieTask(taskId, tag = '') {
  const maxAttempts = 72 // 6 minutes max (5s per attempt)
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await sleep(5000)
    const res = await fetchJson(
      `${KIE_API_BASE}/jobs/recordInfo?taskId=${encodeURIComponent(taskId)}`,
      { kieAuth: true }
    )
    const data = res?.data?.data ?? res?.data
    const state = data?.state

    if (state === 'success') {
      let resultData = data.resultJson
      if (typeof resultData === 'string') {
        try { resultData = JSON.parse(resultData) } catch { /* keep as-is */ }
      }
      const imageUrl = resultData?.resultUrls?.[0] || resultData?.url
      if (imageUrl) return imageUrl
      throw new Error(`success state but no URL. resultJson: ${JSON.stringify(data.resultJson).slice(0, 200)}`)
    }
    if (state === 'fail') {
      throw new Error(`Kie.ai task failed: ${data?.failMsg || JSON.stringify(res).slice(0, 200)}`)
    }

    if (attempt % 6 === 5) {
      console.log(`${tag} POLL    ${Math.round((attempt + 1) * 5)}s elapsed...`)
    }
  }
  throw new Error(`Task ${taskId} timed out after ${maxAttempts * 5}s`)
}

// ── Medusa utilities ─────────────────────────────────────────────────────────

async function authenticateMedusa() {
  const res = await fetchJson(`${MEDUSA_URL}/auth/user/emailpass`, {
    method: 'POST',
    body: JSON.stringify({ email: MEDUSA_EMAIL, password: MEDUSA_PASSWORD }),
  })
  const token = res?.data?.token
  if (!token) {
    console.error('Medusa auth failed:', JSON.stringify(res).slice(0, 300))
    process.exit(1)
  }
  return token
}

async function fetchAllProducts(token) {
  const res = await fetchJson(
    `${MEDUSA_URL}/admin/products?limit=100&fields=id,handle,title,thumbnail,*categories`,
    { token }
  )
  return res?.data?.products ?? []
}

async function setProductThumbnail(token, productId, thumbnailUrl) {
  return fetchJson(`${MEDUSA_URL}/admin/products/${productId}`, {
    method: 'POST',
    token,
    body: JSON.stringify({ thumbnail: thumbnailUrl }),
  })
}

// ── Progress log utilities ───────────────────────────────────────────────────

function loadLog() {
  if (fs.existsSync(LOG_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(LOG_FILE, 'utf-8'))
    } catch {
      return {}
    }
  }
  return {}
}

function saveLog(log) {
  fs.writeFileSync(LOG_FILE, JSON.stringify(log, null, 2))
}

// ── Prompt resolution ────────────────────────────────────────────────────────

function getPromptForProduct(product) {
  // 1. Exact handle match
  if (PROMPT_MAP[product.handle]) return PROMPT_MAP[product.handle]

  // 2. Category-based fallback
  const categories = product.categories ?? []
  for (const cat of categories) {
    if (CATEGORY_PROMPT_MAP[cat.handle]) return CATEGORY_PROMPT_MAP[cat.handle]
  }

  // 3. Generic fallback
  return 'Spiritual transformation and healing visualization, golden light energy, dark atmospheric background, cinematic photography, no text'
}

// ── Per-product worker ───────────────────────────────────────────────────────

async function processProduct(product, token, log, globalIndex, total) {
  const prompt = getPromptForProduct(product)
  // Extension determined after generation — default jpg, updated once URL is known
  let destFilename = `${product.handle}.jpg`
  let destPath = path.join(OUTPUT_DIR, destFilename)
  const tag = `[${String(globalIndex).padStart(2)}/${total}]`

  console.log(`${tag} START  ${product.handle}`)

  try {
    // Step 1: Generate image via Kie.ai (skip if local file already exists)
    const localJpg = path.join(OUTPUT_DIR, `${product.handle}.jpg`)
    const localWebp = path.join(OUTPUT_DIR, `${product.handle}.webp`)
    const existingLocal = fs.existsSync(localJpg) ? localJpg : fs.existsSync(localWebp) ? localWebp : null

    if (!FORCE && existingLocal) {
      destPath = existingLocal
      destFilename = path.basename(existingLocal)
      console.log(`${tag} LOCAL   ${destFilename} — skipping generation, re-uploading`)
    } else {
      const taskId = await submitKieTask(prompt)
      console.log(`${tag} TASK    ${taskId.slice(0, 16)}`)
      const imageUrl = await pollKieTask(taskId, tag)
      console.log(`${tag} DONE    ${imageUrl.slice(0, 60)}`)

      // Use actual extension from URL (API returns .jpeg)
      const urlExt = imageUrl.split('.').pop()?.split('?')[0] ?? 'jpg'
      destFilename = `${product.handle}.${urlExt}`
      destPath = path.join(OUTPUT_DIR, destFilename)

      await downloadFile(imageUrl, destPath)
      const sizeKB = Math.round(fs.statSync(destPath).size / 1024)
      console.log(`${tag} SAVED   ${destFilename} (${sizeKB} KB)`)
    }

    // Step 2: Upload to Medusa
    const uploadRes = await uploadToMedusa(token, destPath)
    const fileUrl = uploadRes?.data?.files?.[0]?.url
    if (!fileUrl) {
      throw new Error(`Upload returned no URL: ${JSON.stringify(uploadRes).slice(0, 200)}`)
    }
    console.log(`${tag} UPLOAD  ${fileUrl}`)

    // Step 3: Set as product thumbnail
    const updateRes = await setProductThumbnail(token, product.id, fileUrl)
    if (updateRes.status !== 200) {
      throw new Error(`Thumbnail update (${updateRes.status}): ${JSON.stringify(updateRes.data).slice(0, 200)}`)
    }
    console.log(`${tag} THUMB   OK`)

    log[product.handle] = { status: 'done', url: fileUrl, completedAt: new Date().toISOString() }
    saveLog(log)
    return { ok: true }

  } catch (err) {
    console.error(`${tag} ERROR   ${err.message}`)
    log[product.handle] = { status: 'error', error: err.message, failedAt: new Date().toISOString() }
    saveLog(log)
    return { ok: false, error: err.message }
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })

  console.log('── generate-product-images ──────────────────────────────────────')
  console.log(`  Medusa URL:    ${MEDUSA_URL}`)
  console.log(`  Concurrent:    ${CONCURRENT} tasks/batch`)
  console.log(`  Rate limit:    20 req/10s (${CONCURRENT} × 1 poll/5s = ${CONCURRENT * 2}/10s)`)
  console.log(`  Batch delay:   ${BATCH_DELAY_MS / 1000}s between batches`)
  console.log(`  Force regen:   ${FORCE ? 'yes (FORCE=1)' : 'no'}`)
  console.log('')

  // 1. Authenticate with Medusa
  process.stdout.write('Authenticating with Medusa... ')
  const token = await authenticateMedusa()
  console.log('OK')

  // 2. Fetch all products
  process.stdout.write('Fetching products from Medusa... ')
  const allProducts = await fetchAllProducts(token)
  console.log(`${allProducts.length} products found`)

  // 3. Load progress log
  const log = loadLog()
  const completedCount = Object.keys(log).filter((k) => log[k].status === 'done').length
  if (completedCount > 0) {
    console.log(`Resuming: ${completedCount} products already completed in log`)
  }
  console.log('')

  // 4. Filter to products that need processing
  const toProcess = allProducts.filter((p) => {
    if (log[p.handle]?.status === 'done' && !FORCE) return false
    if (p.thumbnail && !FORCE) {
      console.log(`  Skip (has thumbnail): ${p.handle}`)
      return false
    }
    return true
  })

  if (toProcess.length === 0) {
    console.log('All products already have thumbnails — nothing to do.')
    return
  }

  const batchCount = Math.ceil(toProcess.length / CONCURRENT)
  console.log(`Processing ${toProcess.length} products in ${batchCount} batch${batchCount > 1 ? 'es' : ''} of ${CONCURRENT}`)
  console.log('─'.repeat(64))
  console.log('')

  let successCount = 0
  let errorCount = 0

  for (let b = 0; b < batchCount; b++) {
    const batchStart = b * CONCURRENT
    const batch = toProcess.slice(batchStart, batchStart + CONCURRENT)

    if (b > 0) {
      console.log(`── Batch ${b + 1}/${batchCount} — waiting ${BATCH_DELAY_MS / 1000}s before starting ──`)
      await sleep(BATCH_DELAY_MS)
    } else {
      console.log(`── Batch 1/${batchCount} ──`)
    }
    console.log('')

    const results = await Promise.allSettled(
      batch.map((product, j) =>
        processProduct(product, token, log, batchStart + j + 1, toProcess.length)
      )
    )

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value.ok) {
        successCount++
      } else {
        errorCount++
      }
    }

    console.log('')
    console.log(`── Batch ${b + 1} done: ${results.filter(r => r.status === 'fulfilled' && r.value?.ok).length} ok, ${results.filter(r => r.status !== 'fulfilled' || !r.value?.ok).length} failed ──`)
    console.log('')
  }

  console.log('═'.repeat(64))
  console.log(`Complete: ${successCount} succeeded, ${errorCount} failed out of ${toProcess.length}`)
  if (errorCount > 0) {
    console.log('Re-run to retry failed products — completed ones are skipped automatically')
  }
  console.log('')
  console.log('Next steps:')
  console.log('  1. git add apps/web/public/images/products/')
  console.log('  2. git commit -m "feat: AI-generated product images"')
  console.log('  3. Shop cards now use Medusa thumbnails — no redeploy needed')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
