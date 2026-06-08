#!/usr/bin/env node
/**
 * generate-quote-video.mjs
 *
 * Generates a slow cinematic video from explore-transformation.webp using
 * Seedance-2 image-to-video via Kie.ai, for the TransformationQuote section
 * background on the homepage.
 *
 * Since Seedance-2 requires a real HTTPS URL (not base64), the image is first
 * uploaded to a temporary public host. Tries transfer.sh then file.io.
 *
 * Output: apps/web/public/videos/generated/transformation-quote.mp4
 *
 * Usage (PowerShell):
 *   $env:KIE_API_KEY="your_key"; node infra/scripts/generate-quote-video.mjs
 *
 * Usage (bash):
 *   KIE_API_KEY=<your-key> node infra/scripts/generate-quote-video.mjs
 *
 * After video is generated, commit the file and deploy — it is already wired
 * into TransformationQuote.tsx via <source src="/videos/generated/transformation-quote.mp4">.
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
  console.error('Usage (PowerShell): $env:KIE_API_KEY="your_key"; node infra/scripts/generate-quote-video.mjs')
  console.error('Usage (bash):       KIE_API_KEY=<your-key> node infra/scripts/generate-quote-video.mjs')
  process.exit(1)
}

const API_BASE = 'https://api.kie.ai/api/v1'
const SOURCE_IMAGE_PATH = path.join(ROOT, 'apps/web/public/images/generated/explore-transformation.webp')
const OUTPUT_DIR = path.join(ROOT, 'apps/web/public/videos/generated')
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'transformation-quote.mp4')
const POLL_INTERVAL_MS = 15000
const MAX_POLL_ATTEMPTS = 120

// Motion guidance prompt — describes animation, not scene content
const PROMPT =
  'Slow ethereal drift, soft golden light particles floating upward, ' +
  'gentle atmospheric haze, meditative stillness, ' +
  'cinematic slow motion, no camera shake, no text, no people'

// ---------------------------------------------------------------------------
// Upload helpers — Seedance-2 needs a real HTTPS URL, not base64

function uploadToTransferSh(filePath) {
  return new Promise((resolve, reject) => {
    const fileData = fs.readFileSync(filePath)
    const filename = path.basename(filePath)
    const options = {
      hostname: 'transfer.sh',
      path: `/${encodeURIComponent(filename)}`,
      method: 'PUT',
      headers: {
        'Content-Type': 'image/webp',
        'Content-Length': fileData.length,
        'User-Agent': 'generate-quote-video/1.0',
        'Max-Downloads': '5',
        'Max-Days': '1',
      },
    }
    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        const url = data.trim()
        if (res.statusCode >= 200 && res.statusCode < 300 && url.startsWith('http')) {
          resolve(url)
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data.slice(0, 120)}`))
        }
      })
    })
    req.on('error', reject)
    req.write(fileData)
    req.end()
  })
}

function uploadToFileIo(filePath) {
  return new Promise((resolve, reject) => {
    const fileData = fs.readFileSync(filePath)
    const filename = path.basename(filePath)
    const boundary = `----Boundary${Date.now().toString(16)}`
    const header = Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: image/webp\r\n\r\n`
    )
    const footer = Buffer.from(`\r\n--${boundary}--\r\n`)
    const body = Buffer.concat([header, fileData, footer])
    const options = {
      hostname: 'www.file.io',
      path: '/?expires=1d',
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length,
        'User-Agent': 'generate-quote-video/1.0',
      },
    }
    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        try {
          const json = JSON.parse(data)
          if (json.success && json.link) {
            resolve(json.link)
          } else {
            reject(new Error(`${data.slice(0, 120)}`))
          }
        } catch {
          reject(new Error(`parse error: ${data.slice(0, 120)}`))
        }
      })
    })
    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

function uploadToLitterbox(filePath) {
  return new Promise((resolve, reject) => {
    const fileData = fs.readFileSync(filePath)
    const filename = path.basename(filePath)
    const boundary = `----Boundary${Date.now().toString(16)}`
    // multipart fields: reqtype, time, fileToUpload
    const parts = [
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="reqtype"\r\n\r\nfileupload\r\n`),
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="time"\r\n\r\n24h\r\n`),
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="fileToUpload"; filename="${filename}"\r\nContent-Type: image/webp\r\n\r\n`),
      fileData,
      Buffer.from(`\r\n--${boundary}--\r\n`),
    ]
    const body = Buffer.concat(parts)
    const options = {
      hostname: 'litterbox.catbox.moe',
      path: '/resources/internals/api.php',
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length,
        'User-Agent': 'generate-quote-video/1.0',
      },
    }
    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        const url = data.trim()
        if (res.statusCode >= 200 && res.statusCode < 300 && url.startsWith('http')) {
          resolve(url)
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data.slice(0, 120)}`))
        }
      })
    })
    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

async function uploadImage(filePath) {
  for (const [name, fn] of [['transfer.sh', uploadToTransferSh], ['file.io', uploadToFileIo], ['litterbox.catbox.moe', uploadToLitterbox]]) {
    try {
      process.stdout.write(`  Trying ${name}... `)
      const url = await fn(filePath)
      console.log(`OK → ${url}`)
      return url
    } catch (err) {
      console.log(`failed: ${err.message.slice(0, 80)}`)
    }
  }
  throw new Error('All upload services failed — check network connectivity.')
}

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

async function submitTask(imageUrl) {
  const body = JSON.stringify({
    model: 'bytedance/seedance-2',
    input: {
      prompt: PROMPT,
      first_frame_url: imageUrl,
      duration: 5,
      aspect_ratio: '16:9',
      resolution: '720p',
      generate_audio: false,
    },
  })

  console.log('\nSubmitting Seedance-2 image-to-video task...')
  console.log(`Motion prompt: ${PROMPT.slice(0, 80)}...`)

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

  console.log('── generate-quote-video ──────────────────────────────────────────')
  console.log('  Model:    bytedance/seedance-2 (image-to-video)')
  console.log('  Source:   apps/web/public/images/generated/explore-transformation.webp')
  console.log('  Duration: 5s  |  Ratio: 16:9  |  Resolution: 720p')
  console.log('  Output:   apps/web/public/videos/generated/transformation-quote.mp4')
  console.log('─────────────────────────────────────────────────────────────────\n')

  if (!fs.existsSync(SOURCE_IMAGE_PATH)) {
    throw new Error(`Source image not found: ${SOURCE_IMAGE_PATH}`)
  }

  if (fs.existsSync(OUTPUT_FILE)) {
    const sizeMB = (fs.statSync(OUTPUT_FILE).size / 1024 / 1024).toFixed(1)
    console.log(`Note: transformation-quote.mp4 already exists (${sizeMB} MB). Re-generating and overwriting.\n`)
  }

  const imageSizeKB = Math.round(fs.statSync(SOURCE_IMAGE_PATH).size / 1024)
  console.log(`Uploading source image (${imageSizeKB} KB) to temp host...`)
  const imageUrl = await uploadImage(SOURCE_IMAGE_PATH)

  const taskId = await submitTask(imageUrl)
  const videoUrl = await pollUntilDone(taskId)

  console.log(`\nVideo ready. Downloading from:\n  ${videoUrl}\n`)
  await downloadFile(videoUrl, OUTPUT_FILE)

  const sizeMB = (fs.statSync(OUTPUT_FILE).size / 1024 / 1024).toFixed(1)
  console.log(`Saved: apps/web/public/videos/generated/transformation-quote.mp4 (${sizeMB} MB)`)
  console.log('\nNext steps:')
  console.log('  1. git add apps/web/public/videos/generated/transformation-quote.mp4')
  console.log('  2. git commit -m "feat: AI-generated transformation quote video background (explore-transformation)"')
  console.log('  3. The video is already wired into TransformationQuote.tsx — deploy and verify.')
}

main().catch((err) => {
  console.error(`\nFatal: ${err.message}`)
  process.exit(1)
})
