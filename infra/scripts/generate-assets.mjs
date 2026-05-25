#!/usr/bin/env node
/**
 * generate-assets.mjs
 *
 * Generates replacement images for the site using Kie.ai API.
 * Run from the project root:
 *   KIE_API_KEY=<your-key> node infra/scripts/generate-assets.mjs
 *
 * The reference image (suzanne-casual.jpg) must be publicly accessible.
 * Default: http://169.239.180.49/images/suzanne-casual.jpg (VPS)
 * Override: REFERENCE_IMAGE_URL=https://... node infra/scripts/generate-assets.mjs
 *
 * Outputs to: apps/web/public/images/generated/
 *
 * Models used:
 *   - flux-2/pro-image-to-image  (image compositing with reference — 3 images)
 *   - flux-kontext-pro            (text-to-image abstract backgrounds — 7 images)
 */

import fs from 'fs'
import path from 'path'
import https from 'https'
import http from 'http'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '../../')

const KIE_API_KEY = process.env.KIE_API_KEY
if (!KIE_API_KEY) {
  console.error('Error: KIE_API_KEY environment variable is required.')
  console.error('Usage: KIE_API_KEY=<your-key> node infra/scripts/generate-assets.mjs')
  process.exit(1)
}

const REFERENCE_IMAGE_URL =
  process.env.REFERENCE_IMAGE_URL || 'http://169.239.180.49/images/suzanne-casual.jpg'

const API_BASE = 'https://api.kie.ai/api/v1'
const OUTPUT_DIR = path.join(ROOT, 'apps/web/public/images/generated')

const TASKS = [
  // ── Image compositing (flux-2/pro-image-to-image, uses REFERENCE_IMAGE_URL) ──
  {
    filename: 'group-coaching-real.jpg',
    type: 'composite',
    prompt:
      'Transform this into a warm group coaching circle scene, add 6-8 diverse participants seated around the person, modern wellness studio, natural light, authentic community feeling, professional photography, keep the person\'s appearance identical',
  },
  {
    filename: 'session-coaching.jpg',
    type: 'composite',
    prompt:
      'Place this person in an intimate 1:1 coaching conversation, seated across from a client in a beautiful modern office, warm natural light through windows, professional coaching atmosphere, keep the person\'s appearance identical',
  },
  {
    filename: 'hero-masterclass.jpg',
    type: 'composite',
    prompt:
      'Place this person on a dramatic stage with single spotlight, dark background, transformation masterclass atmosphere, powerful and inspirational, cinematic photography, keep the person\'s appearance identical',
  },
  // ── Abstract backgrounds (flux-kontext-pro, text-to-image, no reference) ──
  {
    filename: 'explore-energy.jpg',
    type: 'text2img',
    prompt:
      'Abstract energy field, blue and white light waves, spiritual healing concept, very dark navy background, cinematic visualization, no people, no text',
  },
  {
    filename: 'explore-akashic.jpg',
    type: 'text2img',
    prompt:
      'Mystical cosmic library, ancient glowing scrolls floating in infinite dark space, gold and deep blue tones, akashic records visualization, cinematic, no people, no text',
  },
  {
    filename: 'explore-repatterning.jpg',
    type: 'text2img',
    prompt:
      'Neural pathways lighting up in sequence, brain rewiring visualization, electric blue on very dark background, cinematic scientific visualization, no people, no text',
  },
  {
    filename: 'explore-transformation.jpg',
    type: 'text2img',
    prompt:
      'Golden sunrise over dramatic South African landscape, transformation and new beginnings concept, cinematic landscape photography, warm golden tones, no text',
  },
  {
    filename: 'explore-mindfulness.jpg',
    type: 'text2img',
    prompt:
      'Serene meditation garden at golden hour, soft bokeh background, peaceful atmosphere, cinematic lifestyle photography, warm tones, no people, no text',
  },
  {
    filename: 'explore-purpose.jpg',
    type: 'text2img',
    prompt:
      'Open road stretching to horizon at sunrise, life purpose and direction concept, cinematic landscape, aspirational mood, South African scenery, no text',
  },
  {
    filename: 'explore-resonance.jpg',
    type: 'text2img',
    prompt:
      'Beautiful sound wave patterns as glowing light sculpture, resonance and vibration healing concept, blues and purples on dark background, cinematic, no text',
  },
]

// ---------------------------------------------------------------------------

async function fetchJson(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url)
    const lib = parsed.protocol === 'https:' ? https : http
    const body = options.body || null
    const reqOptions = {
      hostname: parsed.hostname,
      port: parsed.port || undefined,
      path: parsed.pathname + parsed.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${KIE_API_KEY}`,
        ...(body ? { 'Content-Length': Buffer.byteLength(body) } : {}),
        ...(options.headers || {}),
      },
    }
    const req = lib.request(reqOptions, (res) => {
      let raw = ''
      res.on('data', (chunk) => { raw += chunk })
      res.on('end', () => {
        try { resolve(JSON.parse(raw)) }
        catch { reject(new Error(`Non-JSON (${res.statusCode}): ${raw.slice(0, 300)}`)) }
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
      res.pipe(file)
      file.on('finish', () => { file.close(); resolve() })
      file.on('error', (err) => { if (fs.existsSync(destPath)) fs.unlinkSync(destPath); reject(err) })
    }).on('error', (err) => { if (fs.existsSync(destPath)) fs.unlinkSync(destPath); reject(err) })
  })
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function pollForResult(taskId) {
  const maxAttempts = 72 // 6 minutes max
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await sleep(5000)
    const res = await fetchJson(`${API_BASE}/jobs/recordInfo?taskId=${encodeURIComponent(taskId)}`)
    const data = res?.data
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
      throw new Error(`Task failed: ${data?.failMsg || JSON.stringify(res).slice(0, 200)}`)
    }
    // waiting / queuing / generating — keep polling
  }
  throw new Error(`Task ${taskId} timed out after ${maxAttempts * 5}s`)
}

async function submitComposite(task) {
  // flux-2/pro-image-to-image via createTask
  const body = JSON.stringify({
    model: 'flux-2/pro-image-to-image',
    input: {
      input_urls: [REFERENCE_IMAGE_URL],
      prompt: task.prompt,
      aspect_ratio: '16:9',
      resolution: '2K',
      nsfw_checker: false,
    },
  })
  const res = await fetchJson(`${API_BASE}/jobs/createTask`, { method: 'POST', body })
  const taskId = res?.data?.taskId || res?.taskId
  if (!taskId) throw new Error(`No taskId: ${JSON.stringify(res).slice(0, 200)}`)
  return taskId
}

async function submitText2Img(task) {
  // flux-kontext-pro via dedicated endpoint
  const body = JSON.stringify({
    model: 'flux-kontext-pro',
    prompt: task.prompt,
    aspectRatio: '16:9',
    outputFormat: 'jpeg',
  })
  const res = await fetchJson(`${API_BASE}/flux/kontext/generate`, { method: 'POST', body })
  const taskId = res?.data?.taskId || res?.taskId
  if (!taskId) throw new Error(`No taskId: ${JSON.stringify(res).slice(0, 200)}`)
  return taskId
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })

  const total = TASKS.length
  console.log(`Reference image URL: ${REFERENCE_IMAGE_URL}`)
  console.log(`Output directory: apps/web/public/images/generated/\n`)

  for (let i = 0; i < TASKS.length; i++) {
    const task = TASKS[i]
    const destPath = path.join(OUTPUT_DIR, task.filename)
    const modelLabel = task.type === 'composite' ? 'flux-2/pro-image-to-image' : 'flux-kontext-pro'
    console.log(`[${i + 1}/${total}] Generating: ${task.filename} (${modelLabel})`)

    try {
      const taskId = task.type === 'composite'
        ? await submitComposite(task)
        : await submitText2Img(task)

      console.log(`  Submitted: ${taskId} — polling every 5s...`)
      const imageUrl = await pollForResult(taskId)
      console.log(`  Downloading...`)
      await downloadFile(imageUrl, destPath)
      const sizeKB = Math.round(fs.statSync(destPath).size / 1024)
      console.log(`  Saved: ${task.filename} (${sizeKB} KB)`)
    } catch (err) {
      console.error(`  Error on ${task.filename}: ${err.message}`)
    }

    if (i < TASKS.length - 1) await sleep(2000)
  }

  console.log('\nDone. Generated images saved to apps/web/public/images/generated/')
  console.log('Next: git add apps/web/public/images/generated/ && git commit')
}

main().catch((err) => { console.error(err); process.exit(1) })
