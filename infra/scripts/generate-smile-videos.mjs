#!/usr/bin/env node
/**
 * generate-smile-videos.mjs
 *
 * For each portrait-X.jpg, generates a 4-second Kling 3.0 image-to-video clip
 * of the person moving from a neutral expression into a warm genuine smile.
 * Used by the services testimonial montage (HyperFrames composition).
 *
 * Input:  apps/web/public/images/portraits/portrait-1..6.(jpg|jpeg|png|webp)
 * Output: apps/web/public/videos/portraits/smile-1..6.mp4
 *
 * Usage (PowerShell):
 *   $env:KIE_API_KEY="your_key"; node infra/scripts/generate-smile-videos.mjs
 *
 * Usage (bash):
 *   KIE_API_KEY=<your-key> node infra/scripts/generate-smile-videos.mjs
 *
 * NOTE: Kie.ai result videos expire ~24h after generation — this script
 * downloads each clip immediately when its task completes.
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
  console.error('Usage (PowerShell): $env:KIE_API_KEY="your_key"; node infra/scripts/generate-smile-videos.mjs')
  console.error('Usage (bash):       KIE_API_KEY=<your-key> node infra/scripts/generate-smile-videos.mjs')
  process.exit(1)
}

const API_BASE = 'https://api.kie.ai/api/v1'
// File upload API lives on a separate host (kieai.redpandaai.co), NOT api.kie.ai
const UPLOAD_URL = 'https://kieai.redpandaai.co/api/file-base64-upload'
const PORTRAIT_DIR = path.join(ROOT, 'apps/web/public/images/portraits')
const OUTPUT_DIR = path.join(ROOT, 'apps/web/public/videos/portraits')
const POLL_INTERVAL_MS = 15000
const MAX_POLL_ATTEMPTS = 120 // 30 minutes max per clip

const SMILE_PROMPT =
  'Person starts with calm neutral expression, ' +
  'then a warm genuine smile spreads across their face naturally, ' +
  'subtle head movement, authentic and human, ' +
  'soft natural lighting, 4 seconds'

// ---------------------------------------------------------------------------

function fetchJson(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url)
    const lib = parsed.protocol === 'https:' ? https : http
    const body = options.body || null
    const reqOptions = {
      hostname: parsed.hostname,
      port: parsed.port || undefined,
      path: parsed.pathname + (parsed.search || ''),
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
        return reject(new Error(`Download failed: HTTP ${res.statusCode}`))
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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Find portrait-N with any supported extension.
function resolvePortrait(n) {
  for (const ext of ['jpg', 'jpeg', 'png', 'webp']) {
    const p = path.join(PORTRAIT_DIR, `portrait-${n}.${ext}`)
    if (fs.existsSync(p)) return p
  }
  return null
}

// Detect MIME from magic bytes so the data URI is always correct.
function detectMime(buffer) {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg'
  if (buffer.length >= 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return 'image/png'
  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) return 'image/webp'
  return 'image/jpeg'
}

function toDataUri(filePath) {
  const buf = fs.readFileSync(filePath)
  const mime = detectMime(buf)
  return `data:${mime};base64,${buf.toString('base64')}`
}

// Kling 3.0 requires a public image URL (no base64/data URIs), so upload the
// portrait to Kie.ai's temp file host first. Returns a hosted URL (valid ~3 days).
async function uploadImage(dataUri, fileName) {
  const body = JSON.stringify({
    base64Data: dataUri,
    uploadPath: 'images/portraits',
    fileName,
  })
  const res = await fetchJson(UPLOAD_URL, { method: 'POST', body })
  if (res.data?.code && res.data.code !== 200) {
    throw new Error(`Upload error ${res.data.code}: ${res.data.msg || JSON.stringify(res.data).slice(0, 200)}`)
  }
  const url = res.data?.data?.downloadUrl
  if (!url) throw new Error(`Upload returned no downloadUrl: ${JSON.stringify(res.data).slice(0, 300)}`)
  return url
}

async function submitTask(imageUrl) {
  const body = JSON.stringify({
    model: 'kling-3.0/video',
    input: {
      prompt: SMILE_PROMPT,
      image_urls: [imageUrl],
      duration: '4',
      aspect_ratio: '9:16',
      mode: 'std',
      sound: false,
      multi_shots: false,
      multi_prompt: [],
    },
  })
  const res = await fetchJson(`${API_BASE}/jobs/createTask`, { method: 'POST', body })
  if (res.data?.code && res.data.code !== 200) {
    throw new Error(`API error ${res.data.code}: ${res.data.msg || JSON.stringify(res.data).slice(0, 200)}`)
  }
  const taskId = res.data?.data?.taskId || res.data?.taskId || res.taskId
  if (!taskId) throw new Error(`No taskId in response: ${JSON.stringify(res.data).slice(0, 300)}`)
  return taskId
}

async function pollUntilDone(taskId, n) {
  for (let attempt = 1; attempt <= MAX_POLL_ATTEMPTS; attempt++) {
    await sleep(POLL_INTERVAL_MS)
    const res = await fetchJson(`${API_BASE}/jobs/recordInfo?taskId=${encodeURIComponent(taskId)}`)
    const data = res.data?.data ?? res.data
    const state = data?.state
    const elapsed = Math.round((attempt * POLL_INTERVAL_MS) / 1000)
    process.stdout.write(`  [smile-${n}] [${elapsed}s] State: ${state || 'unknown'}\r`)

    if (state === 'success') {
      process.stdout.write('\n')
      let resultData = data.resultJson
      if (typeof resultData === 'string') {
        try { resultData = JSON.parse(resultData) } catch { /* keep raw */ }
      }
      const videoUrl = resultData?.resultUrls?.[0] || resultData?.url || data?.resultUrls?.[0]
      if (!videoUrl) {
        throw new Error(`success state but no video URL. resultJson: ${JSON.stringify(data.resultJson).slice(0, 300)}`)
      }
      return videoUrl
    }
    if (state === 'fail') {
      process.stdout.write('\n')
      throw new Error(`Task failed: ${data?.failMsg || JSON.stringify(res.data).slice(0, 200)}`)
    }
  }
  process.stdout.write('\n')
  throw new Error(`Timed out after ${(MAX_POLL_ATTEMPTS * POLL_INTERVAL_MS) / 60000} minutes`)
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })

  console.log('── generate-smile-videos ─────────────────────────────────────────')
  console.log('  Model:    kling-3.0/video (image-to-video via image_urls)')
  console.log('  Count:    6 clips, 4s, 9:16')
  console.log('  Input:    apps/web/public/images/portraits/')
  console.log('  Output:   apps/web/public/videos/portraits/')
  console.log('  Poll:     every 15s (videos expire ~24h — downloaded immediately)')
  console.log('─────────────────────────────────────────────────────────────────\n')

  let ok = 0
  let failed = 0

  for (let n = 1; n <= 6; n++) {
    console.log(`[${n}/6] Generating smile video ${n}...`)
    const portraitPath = resolvePortrait(n)
    if (!portraitPath) {
      console.error(`[${n}/6] FAILED — portrait-${n}.* not found in ${PORTRAIT_DIR}. Run generate-client-portraits.mjs first.`)
      failed++
      continue
    }

    const destPath = path.join(OUTPUT_DIR, `smile-${n}.mp4`)
    try {
      const dataUri = toDataUri(portraitPath)
      const hostedUrl = await uploadImage(dataUri, `portrait-${n}.jpg`)
      const taskId = await submitTask(hostedUrl)
      const videoUrl = await pollUntilDone(taskId, n)
      await downloadFile(videoUrl, destPath)
      const sizeMB = (fs.statSync(destPath).size / 1024 / 1024).toFixed(1)
      console.log(`[${n}/6] Saved smile-${n}.mp4 (${sizeMB} MB)`)
      ok++
    } catch (err) {
      console.error(`[${n}/6] FAILED smile-${n}.mp4: ${err.message}`)
      failed++
    }
  }

  console.log('\n═════════════════════════════════════════════════════════════════')
  console.log(`Complete: ${ok} succeeded, ${failed} failed out of 6`)
  if (failed > 0) console.log('Re-run to retry — existing files are overwritten.')
  console.log('\nNext step — render the montage from the project root:')
  console.log('  npx hyperframes render infra/hyperframes/services-testimonials/composition.html \\')
  console.log('    --output apps/web/public/videos/generated/hero-services-testimonials.mp4 \\')
  console.log('    --duration 26 --fps 30 --width 1920 --height 1080')
}

main().catch((err) => {
  console.error(`\nFatal: ${err.message}`)
  process.exit(1)
})
