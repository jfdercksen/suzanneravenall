#!/usr/bin/env node
/**
 * update-book-product.mjs
 *
 * Updates the Breakthrough Trilogy product in Medusa with the real
 * title, subtitle, and description from the book cover.
 *
 * Also uploads book-cover.png as the product thumbnail.
 *
 * Usage (from repo root, run on VPS or locally when Medusa is accessible):
 *   node infra/scripts/update-book-product.mjs
 *
 * Env vars (all read from infra/.env if not set):
 *   MEDUSA_ADMIN_EMAIL    — defaults to admin@suzanneravenall.com
 *   MEDUSA_ADMIN_PASSWORD — defaults to value in infra/.env
 *   MEDUSA_URL            — base URL, defaults to http://169.239.180.49/api
 */

import fs from 'fs'
import path from 'path'
import https from 'https'
import http from 'http'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '../../')

const MEDUSA_URL = process.env.MEDUSA_URL || 'http://169.239.180.49/api'
const EMAIL = process.env.MEDUSA_ADMIN_EMAIL || 'admin@suzanneravenall.com'
const PASSWORD = process.env.MEDUSA_ADMIN_PASSWORD || 'P@ssw0rd.123'
const PRODUCT_HANDLE = 'the-latest-book-by-suzanne'

const BOOK_COVER_PATH = path.join(ROOT, 'apps/web/public/images/book-cover.png')

const NEW_DATA = {
  title: 'Breakthrough Trilogy',
  subtitle: 'Overcoming the Impossible & Living Life Beyond Limitation',
  description:
    'Consciousness is a meaning field. The mind adapts to the worldview imposed on it. When this system is interrogated, it reveals a series of challenges — depression, illness, addiction, broken relationships.\n\n' +
    'Brain development is much more than a story about biology. From our earliest years, relationships with others play a key role in shaping how our brain grows and develops.\n\n' +
    'For a moment, just one moment, imagine you had the ability to alter your relationship with everything happening in your life. Imagine having the ability to deeply understand it, improve how you respond to it and how to navigate it successfully.\n\n' +
    'The Breakthrough Trilogy is your roadmap to finding an upgraded version of you.',
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
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
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

async function uploadFile(token, filePath) {
  return new Promise((resolve, reject) => {
    const fileContent = fs.readFileSync(filePath)
    const filename = path.basename(filePath)
    const boundary = `----FormBoundary${Date.now()}`
    const parsed = new URL(`${MEDUSA_URL}/admin/uploads`)
    const lib = parsed.protocol === 'https:' ? https : http

    const header = Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="files"; filename="${filename}"\r\nContent-Type: image/png\r\n\r\n`
    )
    const footer = Buffer.from(`\r\n--${boundary}--\r\n`)
    const totalLength = header.length + fileContent.length + footer.length

    const reqOptions = {
      hostname: parsed.hostname,
      port: parsed.port || undefined,
      path: parsed.pathname,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': totalLength,
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
    req.write(header)
    req.write(fileContent)
    req.write(footer)
    req.end()
  })
}

async function main() {
  console.log(`Medusa URL: ${MEDUSA_URL}`)
  console.log(`Product handle: ${PRODUCT_HANDLE}\n`)

  // 1. Auth
  console.log('1. Authenticating...')
  const authRes = await fetchJson(`${MEDUSA_URL}/auth/user/emailpass`, {
    method: 'POST',
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  })
  const token = authRes.data?.token
  if (!token) {
    console.error('Auth failed:', JSON.stringify(authRes).slice(0, 300))
    process.exit(1)
  }
  console.log('   Authenticated.\n')

  // 2. Find product by handle
  console.log(`2. Looking up product: ${PRODUCT_HANDLE}...`)
  const listRes = await fetchJson(
    `${MEDUSA_URL}/admin/products?handle=${PRODUCT_HANDLE}&fields=id,title,handle`,
    { token }
  )
  const product = listRes.data?.products?.[0]
  if (!product) {
    console.error('Product not found:', JSON.stringify(listRes).slice(0, 300))
    process.exit(1)
  }
  console.log(`   Found: ${product.title} (${product.id})\n`)

  // 3. Upload book cover as thumbnail
  let thumbnailUrl = null
  if (fs.existsSync(BOOK_COVER_PATH)) {
    console.log('3. Uploading book-cover.png...')
    const uploadRes = await uploadFile(token, BOOK_COVER_PATH)
    thumbnailUrl = uploadRes.data?.files?.[0]?.url
    if (thumbnailUrl) {
      console.log(`   Uploaded: ${thumbnailUrl}\n`)
    } else {
      console.warn('   Upload failed or URL not returned — skipping thumbnail.')
      console.warn('  ', JSON.stringify(uploadRes).slice(0, 200), '\n')
    }
  } else {
    console.log('3. book-cover.png not found at expected path — skipping thumbnail upload.\n')
  }

  // 4. Update product
  console.log('4. Updating product...')
  const updatePayload = {
    title: NEW_DATA.title,
    subtitle: NEW_DATA.subtitle,
    description: NEW_DATA.description,
    ...(thumbnailUrl ? { thumbnail: thumbnailUrl } : {}),
  }
  const updateRes = await fetchJson(`${MEDUSA_URL}/admin/products/${product.id}`, {
    method: 'POST',
    token,
    body: JSON.stringify(updatePayload),
  })

  if (updateRes.status === 200) {
    console.log(`   Updated successfully.`)
    console.log(`   Title:    ${updateRes.data?.product?.title}`)
    console.log(`   Subtitle: ${updateRes.data?.product?.subtitle}`)
    if (thumbnailUrl) console.log(`   Thumbnail set.`)
  } else {
    console.error('   Update failed:', JSON.stringify(updateRes).slice(0, 300))
    process.exit(1)
  }

  console.log('\nDone.')
}

main().catch((err) => { console.error(err.message); process.exit(1) })
