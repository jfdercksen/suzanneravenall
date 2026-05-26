#!/usr/bin/env node
/**
 * generate-videos.mjs
 *
 * Generates hero videos using Seedance 2.0 (bytedance/seedance-2) via Kie.ai API.
 * Run from the project root:
 *   KIE_API_KEY=<your-key> node infra/scripts/generate-videos.mjs
 *
 * Input images must be publicly accessible.
 * Defaults use the VPS IP: http://169.239.180.49/images/...
 * Override individual URLs via env vars (see TASKS below).
 *
 * Outputs to: apps/web/public/videos/generated/
 *
 * IMPORTANT: Video URLs expire in 24 hours — download happens automatically.
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
  console.error('Usage: KIE_API_KEY=<your-key> node infra/scripts/generate-videos.mjs')
  process.exit(1)
}

const VPS_BASE = process.env.VPS_BASE_URL || 'http://169.239.180.49'
const API_BASE = 'https://api.kie.ai/api/v1'
const OUTPUT_DIR = path.join(ROOT, 'apps/web/public/videos/generated')

const TASKS = [
  {
    filename: 'hero-stage-video.mp4',
    imageUrl: `${VPS_BASE}/images/hero-bg-suzanne-ravenall.jpg`,
    duration: '10',
    prompt:
      'Subtle crowd movement and applause, stage lights shimmering gently, cinematic atmosphere, Suzanne stays still, no text, powerful and inspirational',
  },
  {
    filename: 'hero-brain-video.mp4',
    imageUrl: `${VPS_BASE}/images/suzanne-ravenall.jpg`,
    duration: '8',
    prompt:
      'Neural network connections pulsing and lighting up in slow rhythmic patterns, energy flowing through the brain, Suzanne stays completely still, cinematic blue energy',
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
  const maxAttempts = 120 // 20 minutes max
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await sleep(10000)
    const res = await fetchJson(`${API_BASE}/jobs/recordInfo?taskId=${encodeURIComponent(taskId)}`)
    const data = res?.data
    const state = data?.state
    const elapsed = ((attempt + 1) * 10)

    if (attempt % 3 === 0) {
      process.stdout.write(`  Polling... ${elapsed}s elapsed (state: ${state || 'unknown'})\r`)
    }

    if (state === 'success') {
      process.stdout.write('\n')
      let resultData = data.resultJson
      if (typeof resultData === 'string') {
        try { resultData = JSON.parse(resultData) } catch { /* keep as-is */ }
      }
      const videoUrl = resultData?.resultUrls?.[0] || resultData?.url
      if (videoUrl) return videoUrl
      throw new Error(`success state but no URL. resultJson: ${JSON.stringify(data.resultJson).slice(0, 200)}`)
    }

    if (state === 'fail') {
      process.stdout.write('\n')
      throw new Error(`Task failed: ${data?.failMsg || JSON.stringify(res).slice(0, 200)}`)
    }
  }
  process.stdout.write('\n')
  throw new Error(`Task ${taskId} timed out after ${maxAttempts * 10}s`)
}

async function submitVideo(task) {
  const body = JSON.stringify({
    model: 'bytedance/seedance-2',
    input: {
      prompt: task.prompt,
      first_frame_url: task.imageUrl,
      aspect_ratio: '16:9',
      duration: Number(task.duration),
      resolution: '720p',
      generate_audio: false,
      web_search: false,
    },
  })
  const res = await fetchJson(`${API_BASE}/jobs/createTask`, { method: 'POST', body })
  const taskId = res?.data?.taskId || res?.taskId
  if (!taskId) throw new Error(`No taskId: ${JSON.stringify(res).slice(0, 200)}`)
  return taskId
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })

  const total = TASKS.length
  console.log('Model: bytedance/seedance-2')
  console.log(`VPS base URL: ${VPS_BASE}`)
  console.log('Note: Video URLs expire in 24h — downloading immediately on completion.\n')

  for (let i = 0; i < TASKS.length; i++) {
    const task = TASKS[i]
    const destPath = path.join(OUTPUT_DIR, task.filename)
    console.log(`[${i + 1}/${total}] Generating: ${task.filename} (${task.duration}s)`)
    console.log(`  Input image: ${task.imageUrl}`)

    try {
      const taskId = await submitVideo(task)
      console.log(`  Submitted: ${taskId} — polling every 10s...`)

      const videoUrl = await pollForResult(taskId)
      console.log(`  Downloading...`)
      await downloadFile(videoUrl, destPath)

      const sizeKB = Math.round(fs.statSync(destPath).size / 1024)
      console.log(`  Saved: ${task.filename} (${sizeKB} KB)`)
    } catch (err) {
      console.error(`  Error on ${task.filename}: ${err.message}`)
    }
  }

  console.log('\nDone. Generated videos saved to apps/web/public/videos/generated/')
  console.log('Next: git add apps/web/public/videos/generated/ && git commit')
}

main().catch((err) => { console.error(err); process.exit(1) })
