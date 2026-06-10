#!/usr/bin/env node
/**
 * generate-client-portraits.mjs
 *
 * Generates 6 diverse photorealistic client portraits via Kie.ai (Nano Banana Pro).
 * These feed generate-smile-videos.mjs (Kling image-to-video) for the services
 * testimonial montage.
 *
 * Output: apps/web/public/images/portraits/portrait-1.jpg … portrait-6.jpg
 *
 * Usage (PowerShell):
 *   $env:KIE_API_KEY="your_key"; node infra/scripts/generate-client-portraits.mjs
 *
 * Usage (bash):
 *   KIE_API_KEY=<your-key> node infra/scripts/generate-client-portraits.mjs
 *
 * Sequential: one portrait at a time, 2s delay between submissions.
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
  console.error('Usage (PowerShell): $env:KIE_API_KEY="your_key"; node infra/scripts/generate-client-portraits.mjs')
  console.error('Usage (bash):       KIE_API_KEY=<your-key> node infra/scripts/generate-client-portraits.mjs')
  process.exit(1)
}

const API_BASE = 'https://api.kie.ai/api/v1'
const OUTPUT_DIR = path.join(ROOT, 'apps/web/public/images/portraits')
const SUBMIT_DELAY_MS = 2000
const POLL_INTERVAL_MS = 5000
const MAX_POLL_ATTEMPTS = 72 // 6 minutes max per portrait

const PORTRAITS = [
  {
    file: 'portrait-1.jpg',
    prompt:
      'Professional South African woman, early 40s, warm brown skin, ' +
      'natural hair, white blazer, neutral expression looking at camera, ' +
      'soft studio lighting, blurred modern office background, ' +
      'photorealistic portrait photography, 9:16',
  },
  {
    file: 'portrait-2.jpg',
    prompt:
      'Professional man, mid 30s, light brown skin, short dark hair, ' +
      'navy suit, neutral calm expression, looking directly at camera, ' +
      'modern boardroom background blurred, photorealistic portrait, 9:16',
  },
  {
    file: 'portrait-3.jpg',
    prompt:
      'Woman, early 30s, blonde hair, white top, ' +
      'neutral relaxed expression, looking at camera, ' +
      'soft garden/nature background blurred, ' +
      'photorealistic lifestyle portrait, warm natural light, 9:16',
  },
  {
    file: 'portrait-4.jpg',
    prompt:
      'Mature woman, mid 50s, silver-streaked hair, ' +
      'elegant appearance, neutral gentle expression, ' +
      'cosy home interior background blurred, ' +
      'photorealistic portrait, warm lighting, 9:16',
  },
  {
    file: 'portrait-5.jpg',
    prompt:
      'Young professional woman, late 20s, dark skin, ' +
      'natural makeup, smart casual top, neutral expression, ' +
      'modern city building background blurred, ' +
      'photorealistic portrait photography, 9:16',
  },
  {
    file: 'portrait-6.jpg',
    prompt:
      'Professional man, mid 40s, salt-pepper hair, ' +
      'confident neutral expression, Cape Town waterfront ' +
      'background blurred, business casual, ' +
      'photorealistic portrait photography, 9:16',
  },
]

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

async function submitTask(prompt) {
  const body = JSON.stringify({
    model: 'nano-banana-pro',
    input: {
      prompt,
      aspect_ratio: '9:16',
      size: '2K',
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

async function pollUntilDone(taskId) {
  for (let attempt = 1; attempt <= MAX_POLL_ATTEMPTS; attempt++) {
    await sleep(POLL_INTERVAL_MS)
    const res = await fetchJson(`${API_BASE}/jobs/recordInfo?taskId=${encodeURIComponent(taskId)}`)
    const data = res.data?.data ?? res.data
    const state = data?.state

    if (state === 'success') {
      let resultData = data.resultJson
      if (typeof resultData === 'string') {
        try { resultData = JSON.parse(resultData) } catch { /* keep raw */ }
      }
      const imageUrl = resultData?.resultUrls?.[0] || resultData?.url || data?.resultUrls?.[0]
      if (!imageUrl) {
        throw new Error(`success state but no image URL. resultJson: ${JSON.stringify(data.resultJson).slice(0, 300)}`)
      }
      return imageUrl
    }
    if (state === 'fail') {
      throw new Error(`Task failed: ${data?.failMsg || JSON.stringify(res.data).slice(0, 200)}`)
    }
  }
  throw new Error(`Timed out after ${(MAX_POLL_ATTEMPTS * POLL_INTERVAL_MS) / 1000}s`)
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })

  console.log('── generate-client-portraits ─────────────────────────────────────')
  console.log('  Model:   nano-banana-pro (Nano Banana Pro)')
  console.log('  Count:   6 portraits, 9:16, 2K')
  console.log('  Output:  apps/web/public/images/portraits/')
  console.log('─────────────────────────────────────────────────────────────────\n')

  let ok = 0
  let failed = 0

  for (let i = 0; i < PORTRAITS.length; i++) {
    const { file, prompt } = PORTRAITS[i]
    const n = i + 1
    const destPath = path.join(OUTPUT_DIR, file)

    if (i > 0) await sleep(SUBMIT_DELAY_MS)

    console.log(`[${n}/6] Generating ${file}...`)
    try {
      const taskId = await submitTask(prompt)
      const imageUrl = await pollUntilDone(taskId)
      await downloadFile(imageUrl, destPath)
      const sizeKB = Math.round(fs.statSync(destPath).size / 1024)
      console.log(`[${n}/6] Saved ${file} (${sizeKB} KB)`)
      ok++
    } catch (err) {
      console.error(`[${n}/6] FAILED ${file}: ${err.message}`)
      failed++
    }
  }

  console.log('\n═════════════════════════════════════════════════════════════════')
  console.log(`Complete: ${ok} succeeded, ${failed} failed out of 6`)
  if (failed > 0) console.log('Re-run to retry — existing files are overwritten.')
  console.log('\nNext step:')
  console.log('  $env:KIE_API_KEY="your_key"; node infra/scripts/generate-smile-videos.mjs')
}

main().catch((err) => {
  console.error(`\nFatal: ${err.message}`)
  process.exit(1)
})
