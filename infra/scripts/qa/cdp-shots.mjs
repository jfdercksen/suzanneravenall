// Viewport-by-viewport page captures over the DevTools protocol, using the
// Playwright-installed chrome-headless-shell. No npm dependencies (Node 24
// ships fetch and WebSocket). Real-time waits, so framer-motion entrance
// animations actually finish before each capture.
//
//   node cdp-shots.mjs <url> <outPrefix> [width=1280] [height=800] [maxSlices=14] [--dismiss]
//
// --dismiss pre-answers the cookie banner so it does not cover every slice.
import { spawn } from 'node:child_process'
import { readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const args = process.argv.slice(2).filter(a => !a.startsWith('--'))
const dismiss = process.argv.includes('--dismiss')
const [url, out, w = '1280', h = '800', max = '14'] = args
const W = +w, H = +h

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
  const evaluate = async expression => (await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result?.result?.value

  await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: W < 768 })
  await send('Page.enable')
  if (dismiss) {
    await send('Page.navigate', { url })
    await sleep(1500)
    await evaluate("localStorage.setItem('cookie_consent','rejected')")
  }
  await send('Page.navigate', { url })
  await sleep(6000)

  const total = await evaluate(`(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 400) { scrollTo(0, y); await new Promise(r => setTimeout(r, 150)) }
    scrollTo(0, 0); await new Promise(r => setTimeout(r, 1000)); return document.body.scrollHeight })()`)
  const n = Math.min(+max, Math.ceil(total / H))
  for (let i = 0; i < n; i++) {
    await evaluate(`scrollTo(0, ${i * H})`)
    await sleep(1000)
    const shot = await send('Page.captureScreenshot', { format: 'png' })
    const file = `${out}-${String(i).padStart(2, '0')}.png`
    writeFileSync(file, Buffer.from(shot.result.data, 'base64'))
  }
  console.log(`${url} -> ${n} slices of ${W}x${H} (page ${total}px) at ${out}-NN.png`)
  ws.close()
} finally {
  proc.kill()
}
