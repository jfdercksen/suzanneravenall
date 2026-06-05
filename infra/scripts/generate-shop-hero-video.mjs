#!/usr/bin/env node
/**
 * generate-shop-hero-video.mjs
 *
 * Generates a cinematic shop hero video using Kling 3.0 text-to-video via Kie.ai.
 * Polls every 15 seconds until complete, then downloads.
 *
 * Output: apps/web/public/videos/generated/hero-shop.mp4
 *
 * Usage (PowerShell):
 *   $env:KIE_API_KEY="your_key"; node infra/scripts/generate-shop-hero-video.mjs
 *
 * Usage (bash):
 *   KIE_API_KEY=<your-key> node infra/scripts/generate-shop-hero-video.mjs
 *
 * After video is generated, wire it into ShopHeroBanner.tsx (video wiring commit).
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
  console.error('Usage (PowerShell): $env:KIE_API_KEY="your_key"; node infra/scripts/generate-shop-hero-video.mjs')
  console.error('Usage (bash):       KIE_API_KEY=<your-key> node infra/scripts/generate-shop-hero-video.mjs')
  process.exit(1)
}

const API_BASE = 'https://api.kie.ai/api/v1'
const OUTPUT_DIR = path.join(ROOT, 'apps/web/public/videos/generated')
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'hero-shop.mp4')
const POLL_INTERVAL_MS = 15000
const MAX_POLL_ATTEMPTS = 120 // 30 minutes max

const PROMPT =
  'Cinematic montage of personal transformation journey, ' +
  'person moving from darkness into golden light, ' +
  'energy patterns flowing and transforming, ' +
  'South African landscape at sunrise in background, ' +
  'ethereal blue and gold energy particles floating, ' +
  'slow motion, IMAX quality, no text, ' +
  'powerful and inspirational atmosphere, 16:9'

// ---------------------------------------------------------------------------

async function fetchJson(url, options = {}) {
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

async function submitTask() {
  const body = JSON.stringify({
    model: 'kling-3.0/text-to-video',
    input: {
      prompt: PROMPT,
      duration: 10,
      aspect_ratio: '16:9',
      resolution: '1080p',
    },
  })

  console.log('Submitting Kling 3.0 text-to-video task...')
  console.log(`Prompt: ${PROMPT.slice(0, 80)}...`)

  const res = await fetchJson(`${API_BASE}/jobs/createTask`, { method: 'POST', body })

  if (res.data?.code && res.data.code !== 200) {
    throw new Error(`API error ${res.data.code}: ${res.data.msg || JSON.stringify(res.data).slice(0, 200)}`)
  }

  const taskId =
    res.data?.data?.taskId ||
    res.data?.taskId ||
    res.taskId

  if (!taskId) {
    throw new Error(`No taskId in response: ${JSON.stringify(res.data).slice(0, 300)}`)
  }

  return taskId
}

async function pollUntilDone(taskId) {
  console.log(`\nTask submitted: ${taskId}`)
  console.log(`Polling every ${POLL_INTERVAL_MS / 1000}s (max ${MAX_POLL_ATTEMPTS * POLL_INTERVAL_MS / 60000} minutes)...\n`)

  for (let attempt = 1; attempt <= MAX_POLL_ATTEMPTS; attempt++) {
    await sleep(POLL_INTERVAL_MS)

    const res = await fetchJson(`${API_BASE}/jobs/recordInfo?taskId=${encodeURIComponent(taskId)}`)
    const data = res.data?.data ?? res.data
    const state = data?.state
    const elapsed = Math.round((attempt * POLL_INTERVAL_MS) / 1000)

    process.stdout.write(`  [${elapsed}s] State: ${state || 'unknown'}\r`)

    if (state === 'success') {
      process.stdout.write('\n')
      let resultData = data.resultJson
      if (typeof resultData === 'string') {
        try { resultData = JSON.parse(resultData) } catch { /* keep raw */ }
      }
      const videoUrl =
        resultData?.resultUrls?.[0] ||
        resultData?.url ||
        data?.resultUrls?.[0]

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
  throw new Error(`Timed out after ${MAX_POLL_ATTEMPTS * POLL_INTERVAL_MS / 60000} minutes`)
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })

  console.log('── generate-shop-hero-video ──────────────────────────────────────')
  console.log('  Model:    kling-3.0/text-to-video')
  console.log('  Duration: 10s')
  console.log('  Output:   apps/web/public/videos/generated/hero-shop.mp4')
  console.log('  Poll:     every 15s')
  console.log('─────────────────────────────────────────────────────────────────\n')

  if (fs.existsSync(OUTPUT_FILE)) {
    const sizeMB = (fs.statSync(OUTPUT_FILE).size / 1024 / 1024).toFixed(1)
    console.log(`Note: hero-shop.mp4 already exists (${sizeMB} MB). Re-generating and overwriting.`)
  }

  const taskId = await submitTask()
  const videoUrl = await pollUntilDone(taskId)

  console.log(`\nVideo ready. Downloading from:\n  ${videoUrl}\n`)
  await downloadFile(videoUrl, OUTPUT_FILE)

  const sizeMB = (fs.statSync(OUTPUT_FILE).size / 1024 / 1024).toFixed(1)
  console.log(`Saved: apps/web/public/videos/generated/hero-shop.mp4 (${sizeMB} MB)`)
  console.log('\nNext steps:')
  console.log('  1. git add apps/web/public/videos/generated/hero-shop.mp4')
  console.log('  2. git commit -m "feat: AI-generated shop hero video (Kling 3.0)"')
  console.log('  3. The video is already wired into ShopHeroBanner.tsx — deploy and verify.')
}

main().catch((err) => {
  console.error(`\nFatal: ${err.message}`)
  process.exit(1)
})
