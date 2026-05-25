#!/usr/bin/env node
/**
 * generate-assets.mjs
 *
 * Generates replacement images for the site using Kie.ai API.
 * Run from the project root:
 *   KIE_API_KEY=<your-key> node infra/scripts/generate-assets.mjs
 *
 * Outputs to: apps/web/public/images/generated/
 *
 * 3 images use suzanne-casual.jpg as the reference image (image compositing).
 * 7 images are abstract backgrounds (text-to-image, no reference).
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

const API_BASE = 'https://api.kie.ai/api/v1'
const MODEL = 'google/nano-banana-pro'
const OUTPUT_DIR = path.join(ROOT, 'apps/web/public/images/generated')
const REFERENCE_IMAGE = path.join(ROOT, 'apps/web/public/images/suzanne-casual.jpg')

const TASKS = [
  // --- Image compositing (uses suzanne-casual.jpg as reference) ---
  {
    filename: 'group-coaching-real.jpg',
    useReference: true,
    prompt:
      'Transform this into a warm group coaching circle scene, add 6-8 diverse participants seated around the person, modern wellness studio, natural light, authentic community feeling, professional photography, keep the person\'s appearance identical',
  },
  {
    filename: 'session-coaching.jpg',
    useReference: true,
    prompt:
      'Place this person in an intimate 1:1 coaching conversation, seated across from a client in a beautiful modern office, warm natural light through windows, professional coaching atmosphere, keep the person\'s appearance identical',
  },
  {
    filename: 'hero-masterclass.jpg',
    useReference: true,
    prompt:
      'Place this person on a dramatic stage with single spotlight, dark background, transformation masterclass atmosphere, powerful and inspirational, cinematic photography, keep the person\'s appearance identical',
  },
  // --- Abstract backgrounds (text-to-image, no reference) ---
  {
    filename: 'explore-energy.jpg',
    useReference: false,
    prompt:
      'Abstract energy field, blue and white light waves, spiritual healing concept, very dark navy background (#012B43), cinematic visualization, no people, no text',
  },
  {
    filename: 'explore-akashic.jpg',
    useReference: false,
    prompt:
      'Mystical cosmic library, ancient glowing scrolls floating in infinite dark space, gold and deep blue tones, akashic records visualization, cinematic, no people, no text',
  },
  {
    filename: 'explore-repatterning.jpg',
    useReference: false,
    prompt:
      'Neural pathways lighting up in sequence, brain rewiring visualization, electric blue on very dark background, cinematic scientific visualization, no people, no text',
  },
  {
    filename: 'explore-transformation.jpg',
    useReference: false,
    prompt:
      'Golden sunrise over dramatic South African landscape, transformation and new beginnings concept, cinematic landscape photography, warm golden tones, no text',
  },
  {
    filename: 'explore-mindfulness.jpg',
    useReference: false,
    prompt:
      'Serene meditation garden at golden hour, soft bokeh background, peaceful atmosphere, cinematic lifestyle photography, warm tones, no people, no text',
  },
  {
    filename: 'explore-purpose.jpg',
    useReference: false,
    prompt:
      'Open road stretching to horizon at sunrise, life purpose and direction concept, cinematic landscape, aspirational mood, South African scenery, no text',
  },
  {
    filename: 'explore-resonance.jpg',
    useReference: false,
    prompt:
      'Beautiful sound wave patterns as glowing light sculpture, resonance and vibration healing concept, blues and purples on dark background, cinematic, no text',
  },
]

// ---------------------------------------------------------------------------

function readFileAsBase64(filePath) {
  const data = fs.readFileSync(filePath)
  return data.toString('base64')
}

async function fetchJson(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url)
    const lib = parsed.protocol === 'https:' ? https : http
    const reqOptions = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${KIE_API_KEY}`,
        ...(options.headers || {}),
      },
    }
    const req = lib.request(reqOptions, (res) => {
      let body = ''
      res.on('data', (chunk) => { body += chunk })
      res.on('end', () => {
        try { resolve(JSON.parse(body)) }
        catch { reject(new Error(`Non-JSON response (${res.statusCode}): ${body.slice(0, 200)}`)) }
      })
    })
    req.on('error', reject)
    if (options.body) req.write(options.body)
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
        fs.unlinkSync(destPath)
        return downloadFile(res.headers.location, destPath).then(resolve).catch(reject)
      }
      res.pipe(file)
      file.on('finish', () => { file.close(); resolve() })
      file.on('error', (err) => { fs.unlinkSync(destPath); reject(err) })
    }).on('error', (err) => { fs.unlinkSync(destPath); reject(err) })
  })
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function pollForResult(taskId) {
  const maxAttempts = 60 // 5 minutes max
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await sleep(5000)
    const result = await fetchJson(`${API_BASE}/jobs/status?taskId=${taskId}`)
    const status = result?.data?.status || result?.status

    if (status === 'COMPLETED' || status === 'completed' || status === 'success') {
      // resultJson may be a JSON string or already an object
      let resultData = result?.data?.resultJson ?? result?.resultJson
      if (typeof resultData === 'string') {
        try { resultData = JSON.parse(resultData) } catch { /* use as-is */ }
      }
      // Extract image URL from common response shapes
      const imageUrl =
        resultData?.images?.[0]?.url ||
        resultData?.image_url ||
        resultData?.url ||
        result?.data?.output?.url ||
        result?.data?.output?.images?.[0]
      if (imageUrl) return imageUrl
      throw new Error(`Task completed but no image URL found. Response: ${JSON.stringify(result).slice(0, 300)}`)
    }

    if (status === 'FAILED' || status === 'failed' || status === 'error') {
      throw new Error(`Task failed: ${JSON.stringify(result).slice(0, 300)}`)
    }
    // Still pending/processing — continue polling
  }
  throw new Error(`Task ${taskId} timed out after ${maxAttempts * 5}s`)
}

async function submitTask(task, referenceBase64) {
  const input = { prompt: task.prompt }
  if (task.useReference && referenceBase64) {
    input.image_input = [`data:image/jpeg;base64,${referenceBase64}`]
  }
  const body = JSON.stringify({ model: MODEL, input })
  const result = await fetchJson(`${API_BASE}/jobs/createTask`, {
    method: 'POST',
    body,
  })
  const taskId = result?.data?.taskId || result?.taskId || result?.id
  if (!taskId) {
    throw new Error(`No taskId in response: ${JSON.stringify(result).slice(0, 300)}`)
  }
  return taskId
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })

  const total = TASKS.length
  let referenceBase64 = null

  if (fs.existsSync(REFERENCE_IMAGE)) {
    referenceBase64 = readFileAsBase64(REFERENCE_IMAGE)
    console.log(`Reference image loaded: suzanne-casual.jpg (${Math.round(referenceBase64.length * 0.75 / 1024)} KB)`)
  } else {
    console.warn(`Warning: Reference image not found at ${REFERENCE_IMAGE}`)
    console.warn('Image compositing tasks will be submitted without a reference image.')
  }

  for (let i = 0; i < TASKS.length; i++) {
    const task = TASKS[i]
    const destPath = path.join(OUTPUT_DIR, task.filename)
    console.log(`[${i + 1}/${total}] Generating: ${task.filename}`)

    try {
      const taskId = await submitTask(task, referenceBase64)
      console.log(`  Submitted task ${taskId} — polling...`)

      const imageUrl = await pollForResult(taskId)
      console.log(`  Done. Downloading...`)
      await downloadFile(imageUrl, destPath)
      console.log(`  Saved: ${path.relative(ROOT, destPath)}`)
    } catch (err) {
      console.error(`  Error on ${task.filename}: ${err.message}`)
    }

    // 2 second delay between submissions
    if (i < TASKS.length - 1) await sleep(2000)
  }

  console.log('\nDone. Generated images saved to apps/web/public/images/generated/')
  console.log('Run "git add apps/web/public/images/generated/" to stage them.')
}

main().catch((err) => { console.error(err); process.exit(1) })
