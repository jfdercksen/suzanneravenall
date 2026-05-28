#!/usr/bin/env node
/**
 * generate-vitality.mjs
 *
 * Generates the hero image for the next-level-health-vitality-longevity topic.
 * Saves to: apps/web/public/images/generated/explore-vitality.webp
 *
 * Usage:
 *   $env:KIE_API_KEY="your_key"; node infra/scripts/generate-vitality.mjs
 *
 * To force-regenerate if the file already exists:
 *   $env:KIE_API_KEY="your_key"; $env:FORCE="1"; node infra/scripts/generate-vitality.mjs
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
  console.error('Usage: $env:KIE_API_KEY="your_key"; node infra/scripts/generate-vitality.mjs')
  process.exit(1)
}

const FORCE = process.env.FORCE === '1'
const API_BASE = 'https://api.kie.ai/api/v1'
const OUTPUT_DIR = path.join(ROOT, 'apps/web/public/images/generated')
const OUTPUT_FILE = 'explore-vitality.webp'

const TASK = {
  filename: OUTPUT_FILE,
  model: 'google/nano-banana-pro',
  prompt:
    'Peak physical vitality and longevity concept, person running at sunrise on a mountain trail, biological age reversal, energy and performance, cinematic photography, golden hour light, South African landscape, aspirational and powerful, no text, 16:9',
}

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
    if (attempt % 6 === 0) console.log(`  Still generating... (${attempt * 5}s elapsed)`)
  }
  throw new Error(`Task timed out after ${maxAttempts * 5}s`)
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  const destPath = path.join(OUTPUT_DIR, TASK.filename)

  console.log(`Output: apps/web/public/images/generated/${TASK.filename}`)
  console.log(`Model:  ${TASK.model}`)
  console.log(`Force:  ${FORCE ? 'yes' : 'no (set FORCE=1 to regenerate existing)'}\n`)

  if (!FORCE && fs.existsSync(destPath)) {
    console.log(`File already exists. Run with FORCE=1 to regenerate.`)
    process.exit(0)
  }

  console.log('Submitting task...')
  const body = JSON.stringify({
    model: TASK.model,
    input: {
      prompt: TASK.prompt,
      aspect_ratio: '16:9',
      resolution: '1K',
      output_format: 'webp',
    },
  })

  const res = await fetchJson(`${API_BASE}/jobs/createTask`, { method: 'POST', body })
  const taskId = res?.data?.taskId || res?.taskId
  if (!taskId) throw new Error(`No taskId in response: ${JSON.stringify(res).slice(0, 200)}`)

  console.log(`Submitted: ${taskId} — polling every 5s (up to 6 minutes)...`)
  const imageUrl = await pollForResult(taskId)

  console.log('Downloading...')
  await downloadFile(imageUrl, destPath)
  const sizeKB = Math.round(fs.statSync(destPath).size / 1024)
  console.log(`\nSaved: ${TASK.filename} (${sizeKB} KB)`)
  console.log('\nNext steps:')
  console.log('  git add apps/web/public/images/generated/explore-vitality.webp')
  console.log('  git commit -m "feat: add explore-vitality.webp hero image for next-level-health topic"')
}

main().catch((err) => { console.error(err.message); process.exit(1) })
