#!/usr/bin/env node
/**
 * update-product-descriptions.mjs
 *
 * Updates Medusa product descriptions and subtitles in bulk.
 * Descriptions sourced from the original WordPress/WooCommerce site.
 *
 * Usage (run from repo root):
 *   $env:MEDUSA_URL="http://169.239.180.49/api"
 *   node infra/scripts/update-product-descriptions.mjs
 *
 * Env vars:
 *   MEDUSA_URL            — base URL (default: http://169.239.180.49/api)
 *   MEDUSA_ADMIN_EMAIL    — default: admin@suzanneravenall.com
 *   MEDUSA_ADMIN_PASSWORD — default: P@ssw0rd.123
 */

import fs from 'fs'
import path from 'path'
import http from 'http'
import https from 'https'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const MEDUSA_URL = process.env.MEDUSA_URL || 'http://169.239.180.49/api'
const EMAIL = process.env.MEDUSA_ADMIN_EMAIL || 'admin@suzanneravenall.com'
const PASSWORD = process.env.MEDUSA_ADMIN_PASSWORD || 'P@ssw0rd.123'
const LOG_PATH = path.join(__dirname, 'product-descriptions-log.json')

// ── HTTP helper (mirrors update-book-product.mjs) ────────────────────────────

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

// ── Category-based descriptions (fallback for products not in exact map) ──────

const DESC_RR_PROGRAMME =
  'This Resonance Repatterning® programme works at the level where patterns are formed — in the resonance field of the body-mind system. Using applied kinesiology (muscle checking), we identify which frequencies are out of coherence and use specific modalities to shift them back into resonance.\n\n' +
  "Each programme in the series builds on the previous, giving you a comprehensive toolkit for transformation. Available as Live via Zoom (with Suzanne’s direct involvement) or Self Study (at your own pace with recorded materials)."

const DESC_AKASHIC_NAVIGATOR =
  'The Akashic Navigator programme teaches you to access and work with the Akashic Records for yourself and others. The Akashic Records are the energetic imprint of every soul’s journey — accessing them allows you to understand the root cause of patterns at a soul level and clear them for lasting transformation.\n\n' +
  'Level 1 covers clearing for yourself. Level 2 covers clearing for others, enabling you to offer Akashic coaching as a professional service.'

const DESC_DEEP_ENERGY_CLEARING =
  'Deep Energy Clearing programmes teach you the art of energetic clearing — identifying and releasing the energetic patterns, blocks and programmes that keep individuals stuck in recurring cycles of illness, relationship problems, financial struggle and unfulfilled potential.\n\n' +
  'Level 1 covers clearing for yourself. Level 2 prepares you to offer energy clearing as a professional service.'

const DESC_BE_AN_ENERGY_NINJA =
  'Be an Energy Ninja teaches you to master your own energy field — to identify when your energy is being depleted, how to restore it, and how to use it as a tool for creating the life you want. This programme combines energy psychology, Rapid Repatterning® and practical coaching tools.'

const DESC_GROUP_SESSION =
  'Group Repatterning sessions use the collective energy of the group to create powerful shifts. Suzanne guides participants through a structured repatterning process, using the group’s combined energy field to move blocks that might take much longer in individual sessions.\n\n' +
  'Available as Live sessions (join Suzanne and other participants via Zoom) or as Recorded series (work through the material at your own pace).'

const DESC_TRAUMA_TO_TRANSCENDENCE =
  'Trauma to Transcendence is a transformational programme that works with the neuroscience of trauma to help you break the hold of past traumatic experiences on your present life. Using Rapid Repatterning®, somatic awareness and coaching, you learn to rewire the neural pathways that keep you stuck in survival mode.'

const DESC_LIFE_PURPOSE =
  'This programme uses Rapid Repatterning® and coaching to help you decode the patterns obscuring your true life purpose and activate the clarity, courage and momentum to live it fully.'

const DESC_MEDITATION_MINDFULNESS =
  "This programme teaches practical meditation and mindfulness techniques grounded in neuroscience and energy psychology. You’ll learn how to use these practices not just for relaxation but as active tools for repatterning — shifting the frequencies of stress, anxiety and limitation."

// ── Exact descriptions (keyed by Medusa canonical product handle) ─────────────
// Handles match CONSOLIDATION_MAP canonical_slug values in migrate-woocommerce.ts

const PRODUCT_DESCRIPTIONS = {

  // ── Private Sessions ───────────────────────────────────────────────────────

  'rapid-repatterning-session-60-min-online': {
    subtitle: 'Rapid Repatterning® Private Session',
    description:
      'Rapid Repatterning® helps bring subconscious patterns into conscious awareness so they are understood and addressed by new awareness, energy and actions. This is the first step in helping to clear these patterns and eliminating interference so that we can easily and naturally move towards a state of greater balance, aliveness, harmony, performance, and alignment with goals.\n\n' +
      'Through this process we uncover the unconscious patterns, clear the static, and through a combination of hypnotherapy and coaching create a new understanding that provides a gap for new action to take place. As a result we experience our true nature and feel deeply alive.\n\n' +
      'You bring your entire life experience stored inside of you — the expert on you — and the willingness to change. Through biofeedback/applied kinesiology we get to the unconscious processes and programmes underlying the issue at hand.\n\n' +
      'After the pattern has been identified, the associated programme/belief is repatterned and we shift the resonance using one of over 100 modalities. You receive coaching throughout the process to understand the pattern and create the change.\n\n' +
      'All sessions are completed via Zoom in the comfort of your own environment.\n\n' +
      'Topics covered include: health, weight, infertility, career/job, family, wealth, relationships, business, finances, school challenges, poor performance, dating and relationships, unrealized potential, marriage or divorce, addiction, sports performance.',
  },

  'resonance-repatterning-session': {
    subtitle: 'Resonance Repatterning® Private Session',
    description:
      'Rapid Repatterning® helps bring subconscious patterns into conscious awareness so they are understood and addressed by new awareness, energy and actions. This is the first step in helping to clear these patterns and eliminating interference so that we can easily and naturally move towards a state of greater balance, aliveness, harmony, performance, and alignment with goals.\n\n' +
      'All sessions are completed via Zoom. You bring your entire life experience and the willingness to change. Through biofeedback/applied kinesiology we get to the unconscious processes underlying the issue at hand.',
  },

  'transformation-coaching-60-mins': {
    subtitle: 'Transformation Coaching Private Session',
    description:
      'Personal transformation coaching sessions that combine Rapid Repatterning®, NLP, hypnotherapy and strategic coaching to create deep and lasting change. Suzanne helps you identify and clear the patterns keeping you stuck and replace them with new programmes aligned with the life you want to create.',
  },

  'executive-coaching-30-mins': {
    subtitle: 'Executive Coaching Private Session',
    description:
      'Executive coaching sessions designed for leaders, entrepreneurs and high performers who want to break through performance ceilings and create lasting change in how they lead, decide and perform under pressure.\n\n' +
      'Suzanne combines neuroscience, transformational coaching and energy psychology to help executives identify the subconscious patterns limiting their performance and replace them with new programmes aligned with their goals.',
  },

  'akashic-clearing-session': {
    subtitle: 'Akashic Coaching & Clearing Session',
    description:
      'Akashic Coaching combines the wisdom of the Akashic Records with transformational coaching to help you access deep soul-level patterns and programmes. This powerful combination helps you understand the root cause of recurring patterns in relationships, health, career and personal growth.\n\n' +
      'Sessions are conducted via Zoom and use applied kinesiology to identify and clear the patterns that are keeping you stuck.',
  },

  'group-family-coaching-60-mins': {
    subtitle: 'Group & Family Coaching Session',
    description:
      "Group and family coaching sessions that use the collective energy of the group to shift unconscious blocks and create positive change for all participants. Suzanne takes the group through a series of Rapid Repatterning sessions, utilizing the group’s energy to move unconscious patterns.\n\n" +
      'Ideal for families, couples, or small groups who want to shift collective dynamics and create positive change together.',
  },

  'exploring-the-alpha-mind-45-minutes': {
    subtitle: 'Exploring the Alpha Mind Session',
    description:
      'The Alpha Mind state is the gateway to the subconscious — a deeply relaxed, focused state where new patterns can be installed and old ones released. These sessions use guided meditation, brainwave entrainment and hypnotherapy techniques to access this powerful state.\n\n' +
      'Ideal for: stress reduction, performance enhancement, breaking habits, improving sleep and accessing creative solutions.',
  },

  'rapid-transformation-therapy-session': {
    subtitle: 'Rapid Transformational Therapy® Session',
    description:
      'Rapid Transformational Therapy® (RTT) is a pioneering therapy that combines the most beneficial principles of hypnotherapy, NLP, CBT and neuroscience. RTT delivers extraordinary, permanent change by reframing the core beliefs, values, habits and emotions that are deep in the subconscious.\n\n' +
      'Your session includes:\n' +
      '• 1 hypnosis session with Suzanne\n' +
      '• A personalised recording to reinforce the transformation\n' +
      '• Optional follow-up coaching sessions available',
  },

  'energetic-clearing-completed-remotely': {
    subtitle: 'Energetic Clearing — Remote Session',
    description:
      'Remote energetic clearing sessions work with the quantum field to identify and clear energetic blocks, patterns and programmes that are affecting your health, relationships, finances and overall wellbeing.\n\n' +
      'Completed remotely — no need to be present. Suzanne works on your behalf using distance healing techniques and applied kinesiology.',
  },

  // ── Resonance Repatterning Programme 1 (unique description) ───────────────

  'resonance-repatterning-program-1-fundamentals-live-via-zoom': {
    subtitle: 'Resonance Repatterning® Programme 1',
    description:
      'Resonance Repatterning® 01 Fundamentals\nDuration: Over 4 sessions of 3.5–4 hours in length\n\n' +
      'If we are not experiencing an abundance of love and joy, growth and expansion, or we are frustrated by pain and anxiety or a lack of fulfillment in our relationships, or we have any symptom of depression or disease — these signs are telling us that we have lost our optimal resonant frequency.\n\n' +
      'Applying the fundamentals will give you the capacity to bring your frequencies back into sync or coherence at a fundamental level. Continuing the journey with the seminars you will regain your optimal frequency and as you apply the tools in everyday life, feel a heightened sense of happiness, joy and wellbeing on all levels as well as a sense of balance within yourself as you handle the outer stresses and strains of life.',
  },

}

// ── Category pattern matching ─────────────────────────────────────────────────

function getCategoryData(handle) {
  // Resonance Repatterning programmes (programs 2–9, full series, accelerated, demos)
  if (
    handle.startsWith('resonance-repatterning-program-2-') ||
    handle.startsWith('resonance-repatterning-program-3-') ||
    handle.startsWith('resonance-repatterning-program-4-') ||
    handle.startsWith('resonance-repatterning-program-5-') ||
    handle.startsWith('resonance-repatterning-program-7-') ||
    handle.startsWith('resonance-repatterning-program-9-') ||
    handle.startsWith('resonance-repatterning-full-') ||
    handle.startsWith('resonance-repatterning-accelerated-') ||
    handle === 'resonance-repatterning-all-repatternings-as-demos-talk-throughs-resources-self-study'
  ) {
    return { description: DESC_RR_PROGRAMME, subtitle: null }
  }
  if (handle.startsWith('akashic-navigator-')) {
    return { description: DESC_AKASHIC_NAVIGATOR, subtitle: null }
  }
  if (handle.startsWith('deep-energy-clearing-')) {
    return { description: DESC_DEEP_ENERGY_CLEARING, subtitle: null }
  }
  if (handle.startsWith('be-an-energy-ninja-')) {
    return { description: DESC_BE_AN_ENERGY_NINJA, subtitle: null }
  }
  // Group sessions (both group-session-* and *-group-session handles)
  if (handle.startsWith('group-session-') || handle.endsWith('-group-session')) {
    return { description: DESC_GROUP_SESSION, subtitle: null }
  }
  if (handle.startsWith('trauma-to-transcendence-')) {
    return { description: DESC_TRAUMA_TO_TRANSCENDENCE, subtitle: null }
  }
  if (handle.startsWith('finding-my-life-purpose') || handle.includes('life-purpose')) {
    return { description: DESC_LIFE_PURPOSE, subtitle: null }
  }
  if (handle.startsWith('meditation-') || handle.startsWith('mindfulness-')) {
    return { description: DESC_MEDITATION_MINDFULNESS, subtitle: null }
  }
  return null
}

// ── Fetch all products with pagination ───────────────────────────────────────

async function fetchAllProducts(token) {
  const products = []
  let offset = 0
  const limit = 100

  while (true) {
    const res = await fetchJson(
      `${MEDUSA_URL}/admin/products?limit=${limit}&offset=${offset}&fields=id,handle,title,status`,
      { token }
    )
    if (res.status !== 200) {
      console.error('Failed to fetch products:', JSON.stringify(res).slice(0, 300))
      process.exit(1)
    }
    const page = res.data?.products ?? []
    products.push(...page)
    const total = res.data?.count ?? page.length
    if (products.length >= total || page.length < limit) break
    offset += limit
  }

  return products
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`Medusa URL: ${MEDUSA_URL}\n`)

  // 1. Authenticate
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

  // 2. Fetch all products
  console.log('2. Fetching all products...')
  const products = await fetchAllProducts(token)
  console.log(`   Found ${products.length} products.\n`)

  // 3. Update descriptions
  console.log('3. Updating descriptions...\n')

  const results = []
  let updated = 0
  let skipped = 0
  let failed = 0

  for (let i = 0; i < products.length; i++) {
    const { id, handle, title } = products[i]
    const prefix = `[${i + 1}/${products.length}]`

    // Exact match first, then category pattern fallback
    const data = PRODUCT_DESCRIPTIONS[handle] ?? getCategoryData(handle)

    if (!data) {
      console.log(`${prefix} SKIPPED (no description mapped): ${handle}`)
      results.push({ handle, title, status: 'skipped', reason: 'no description mapped' })
      skipped++
      continue
    }

    const payload = { description: data.description }
    if (data.subtitle) payload.subtitle = data.subtitle

    const updateRes = await fetchJson(`${MEDUSA_URL}/admin/products/${id}`, {
      method: 'POST',
      token,
      body: JSON.stringify(payload),
    })

    if (updateRes.status === 200) {
      const source = PRODUCT_DESCRIPTIONS[handle] ? 'exact' : 'category'
      console.log(`${prefix} Updated (${source}): ${handle}`)
      results.push({ handle, title, status: 'updated', source })
      updated++
    } else {
      console.error(`${prefix} FAILED (HTTP ${updateRes.status}): ${handle}`)
      console.error(`   ${JSON.stringify(updateRes.data).slice(0, 200)}`)
      results.push({
        handle,
        title,
        status: 'failed',
        httpStatus: updateRes.status,
        response: JSON.stringify(updateRes.data).slice(0, 200),
      })
      failed++
    }
  }

  // 4. Save log
  const log = {
    run_at: new Date().toISOString(),
    medusa_url: MEDUSA_URL,
    summary: { total: products.length, updated, skipped, failed },
    results,
  }
  fs.writeFileSync(LOG_PATH, JSON.stringify(log, null, 2))

  console.log('\n--- Summary ---')
  console.log(`Total:   ${products.length}`)
  console.log(`Updated: ${updated}`)
  console.log(`Skipped: ${skipped}`)
  console.log(`Failed:  ${failed}`)
  console.log(`\nLog saved to: ${LOG_PATH}`)

  if (failed > 0) process.exit(1)
}

main().catch((err) => { console.error(err.message); process.exit(1) })
