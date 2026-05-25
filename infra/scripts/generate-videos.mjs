#!/usr/bin/env node
/**
 * generate-videos.mjs
 *
 * Generates hero videos using Kling 3.0 image-to-video via Kie.ai API.
 * Run from the project root:
 *   KIE_API_KEY=<your-key> node infra/scripts/generate-videos.mjs
 *
 * Outputs to: apps/web/public/videos/generated/
 *
 * IMPORTANT: Video URLs expire in 24 hours — download immediately after generation.
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

const API_BASE = 'https://api.kie.ai/api/v1'
const OUTPUT_DIR = path.join(ROOT, 'apps/web/public/videos/generated')

const TASKS = [
  {
    filename: 'hero-stage-video.mp4',
    inputImage: path.join(ROOT, 'apps/web/public/images/hero-bg-suzanne-ravenall.jpg'),
    model: 'kling-3.0/image-to-video',
    duration: 10,
    prompt:
      'Subtle crowd movement and applause, stage lights shimmering gently, cinematic atmosphere, Suzanne stays still, no text, powerful and inspirational',
  },
  {
    filename: 'hero-brain-video.mp4',
    inputImage: path.join(ROOT, 'apps/web/public/images/suzanne-ravenall.jpg'),
    model: 'kling-3.0/image-to-video',
    duration: 8,
    prompt:
      'Neural network connections pulsing and lighting up in slow rhythmic patterns, energy flowing through the brain, Suzanne stays completely still, cinematic blue energy',
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
  const maxAttempts = 120 // 20 minutes max (video generation is slower)
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await sleep(10000) // 10 second poll interval
    const result = await fetchJson(`${API_BASE}/jobs/status?taskId=${taskId}`)
    const status = result?.data?.status || result?.status
    const elapsed = ((attempt + 1) * 10)

    if (attempt % 3 === 0) {
      process.stdout.write(`  Polling... ${elapsed}s elapsed (status: ${status})\r`)
    }

    if (status === 'COMPLETED' || status === 'completed' || status === 'success') {
      process.stdout.write('\n')
      // resultJson may be a JSON string or already an object
      let resultData = result?.data?.resultJson ?? result?.resultJson
      if (typeof resultData === 'string') {
        try { resultData = JSON.parse(resultData) } catch { /* use as-is */ }
      }
      // Extract video URL from common response shapes
      const videoUrl =
        resultData?.videos?.[0]?.url ||
        resultData?.video_url ||
        resultData?.url ||
        result?.data?.output?.url ||
        result?.data?.output?.video
      if (videoUrl) return videoUrl
      throw new Error(`Task completed but no video URL found. Response: ${JSON.stringify(result).slice(0, 300)}`)
    }

    if (status === 'FAILED' || status === 'failed' || status === 'error') {
      process.stdout.write('\n')
      throw new Error(`Task failed: ${JSON.stringify(result).slice(0, 300)}`)
    }
  }
  process.stdout.write('\n')
  throw new Error(`Task ${taskId} timed out after ${maxAttempts * 10}s`)
}

async function submitVideoTask(task) {
  const imageBase64 = readFileAsBase64(task.inputImage)
  const imageName = path.basename(task.inputImage)
  console.log(`  Reference image: ${imageName} (${Math.round(imageBase64.length * 0.75 / 1024)} KB)`)

  const body = JSON.stringify({
    model: task.model,
    input: {
      prompt: task.prompt,
      duration: task.duration,
      image_input: [`data:image/jpeg;base64,${imageBase64}`],
    },
  })

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
  console.log('⚠️  IMPORTANT: Video URLs expire in 24 hours. Download will happen automatically.\n')

  for (let i = 0; i < TASKS.length; i++) {
    const task = TASKS[i]
    const destPath = path.join(OUTPUT_DIR, task.filename)
    console.log(`[${i + 1}/${total}] Generating: ${task.filename} (${task.duration}s, ${task.model})`)

    try {
      if (!fs.existsSync(task.inputImage)) {
        throw new Error(`Input image not found: ${task.inputImage}`)
      }

      const taskId = await submitVideoTask(task)
      console.log(`  Submitted task ${taskId} — polling every 10s...`)

      const videoUrl = await pollForResult(taskId)
      console.log(`  Completed. Downloading (this may take a moment for large video files)...`)
      await downloadFile(videoUrl, destPath)

      const sizeKB = Math.round(fs.statSync(destPath).size / 1024)
      console.log(`  Saved: ${path.relative(ROOT, destPath)} (${sizeKB} KB)`)
    } catch (err) {
      console.error(`  Error on ${task.filename}: ${err.message}`)
    }
  }

  console.log('\nDone. Generated videos saved to apps/web/public/videos/generated/')
  console.log('Run "git add apps/web/public/videos/generated/" to stage them.')
}

main().catch((err) => { console.error(err); process.exit(1) })
