// Batch contrast scan over the DevTools protocol, using the same
// Playwright-installed chrome-headless-shell as cdp-shots.mjs. Runs
// contrast-scan.js in each page (it forces stalled framer-motion elements
// visible first) and prints one summary line per URL, then any text below AA,
// any button that vanishes into its ground, and any two neighbouring top-level
// sections painted the same ground.
//
//   node cdp-scan.mjs [--w=1280] [--h=800] <url> [url ...]
//
// Text over a sibling photo is counted under "on images" and needs a look in
// the cdp-shots.mjs slices; that is a limit of contrast-scan.js.
import { spawn } from 'node:child_process'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const flag = (name, fallback) => +(process.argv.find(a => a.startsWith(`--${name}=`))?.split('=')[1] ?? fallback)
const W = flag('w', 1280), H = flag('h', 800)
const urls = process.argv.slice(2).filter(a => !a.startsWith('--'))
if (!urls.length) { console.error('usage: node cdp-scan.mjs [--w=1280] [--h=800] <url> [url ...]'); process.exit(1) }

const scan = readFileSync(fileURLToPath(new URL('./contrast-scan.js', import.meta.url)), 'utf8')
const groundsExpr = `(() => {
  const g = [...document.querySelectorAll('section')]
    .filter(s => !s.parentElement.closest('section'))
    .map(s => ({ id: s.getAttribute('aria-labelledby') || s.getAttribute('aria-label') || s.id || '?', bg: getComputedStyle(s).backgroundColor }))
    .filter(s => s.bg !== 'rgba(0, 0, 0, 0)')
  return JSON.stringify(g.slice(1).map((s, i) => [g[i], s]).filter(([a, b]) => a.bg === b.bg).map(([a, b]) => a.id + ' + ' + b.id + ' (' + b.bg + ')'))
})()`

const base = join(process.env.LOCALAPPDATA, 'ms-playwright')
const shellDir = readdirSync(base).filter(d => d.startsWith('chromium_headless_shell-')).sort().pop()
const inner = readdirSync(join(base, shellDir)).find(d => d.startsWith('chrome-headless-shell'))
const exe = join(base, shellDir, inner, 'chrome-headless-shell.exe')

const port = 9400 + Math.floor(Math.random() * 400)
const proc = spawn(exe, [`--remote-debugging-port=${port}`, '--disable-gpu', '--hide-scrollbars', '--mute-audio', `--window-size=${W},${H}`, 'about:blank'], { stdio: 'ignore' })
const sleep = ms => new Promise(r => setTimeout(r, ms))

try {
  let wsUrl
  for (let i = 0; i < 60 && !wsUrl; i++) {
    try { wsUrl = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find(t => t.type === 'page')?.webSocketDebuggerUrl } catch { /* not up yet */ }
    if (!wsUrl) await sleep(250)
  }
  if (!wsUrl) throw new Error('headless shell did not expose a page target')

  const ws = new WebSocket(wsUrl)
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej })
  let seq = 0
  const pending = new Map()
  ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id) } }
  const send = (method, params = {}) => new Promise(r => { const id = ++seq; pending.set(id, r); ws.send(JSON.stringify({ id, method, params })) })
  const evaluate = async expression => {
    const msg = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
    // A protocol error (e.g. "Execution context was destroyed" when the page
    // reloads mid-scan) comes back as msg.error, not as an exception.
    if (msg.error) throw new Error(msg.error.message)
    const res = msg.result
    if (res?.exceptionDetails) throw new Error(res.exceptionDetails.exception?.description ?? res.exceptionDetails.text)
    return res?.result?.value
  }

  await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: W < 768 })
  await send('Page.enable')
  // Answer the cookie banner once so it does not sit over the page.
  await send('Page.navigate', { url: urls[0] })
  await sleep(1500)
  await evaluate("localStorage.setItem('cookie_consent','rejected')")

  for (const url of urls) {
    await send('Page.navigate', { url })
    for (let i = 0; i < 60; i++) { await sleep(500); if (await evaluate('document.readyState') === 'complete') break }
    await sleep(2500)
    try {
      const r = JSON.parse(await evaluate(scan))
      const same = JSON.parse(await evaluate(groundsExpr))
      console.log(`${url} @${W}: ${r.checked} text checked, ${r.fails.length} below AA, ${r.ghostButtons.length} invisible buttons, ${r.onImageCount} on images, ${same.length} same-ground pairs`)
      for (const f of r.fails.slice(0, 8)) console.log(`   BELOW AA ${f.ratio} (needs ${f.need}) "${f.text}" ${f.fg} on ${f.bg}`)
      for (const g of r.ghostButtons.slice(0, 8)) console.log(`   INVISIBLE ${g.ratio} "${g.text}" ${g.fill} on ${g.ground}`)
      for (const s of same) console.log(`   SAME GROUND ${s}`)
    } catch (err) {
      console.log(`${url} @${W}: scan failed: ${err.message.split('\n')[0]}`)
    }
  }
  ws.close()
} finally {
  proc.kill()
}
