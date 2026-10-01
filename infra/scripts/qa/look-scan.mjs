// Section M of the full site checklist: how every page looks at one viewport
// width. Same headless shell and protocol plumbing as cdp-scan.mjs. For each
// path it records layout faults (sideways overflow, elements past the screen
// edge, cut-off text, broken images, text under 12px, a page title over 60px)
// and then runs contrast-scan.js for text below AA and vanishing buttons.
//
//   node look-scan.mjs --base=http://169.239.180.49 --w=375 --h=812 --paths=paths.txt --out=look-375.jsonl
//
// One JSON line per page. Read-only: it only loads pages. --append adds to an
// existing output file, to resume a run with the remaining paths.
import { spawn } from 'node:child_process'
import { appendFileSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const opt = (name, fallback) => process.argv.find(a => a.startsWith(`--${name}=`))?.slice(name.length + 3) ?? fallback
const W = +opt('w', 1280), H = +opt('h', 800)
const baseUrl = opt('base', 'http://169.239.180.49')
const out = opt('out', `look-${W}.jsonl`)
const paths = readFileSync(opt('paths'), 'utf8').split(/\r?\n/).map(s => s.trim()).filter(Boolean)

const scan = readFileSync(fileURLToPath(new URL('./contrast-scan.js', import.meta.url)), 'utf8')
const layoutExpr = `(async () => {
  for (let y = 0; y < document.body.scrollHeight; y += 500) { scrollTo(0, y); await new Promise(r => setTimeout(r, 120)) }
  scrollTo(0, 0); await new Promise(r => setTimeout(r, 1200))
  const vw = document.documentElement.clientWidth
  const docW = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth)
  const label = el => (el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + ' "' + el.textContent.trim().replace(/\\s+/g, ' ').slice(0, 40) + '" .' + String(el.className).slice(0, 70))
  const hidden = el => { for (let e = el; e; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity < 0.05) return true } return false }
  const clipped = el => { for (let e = el.parentElement; e && e !== document.body; e = e.parentElement) { if (/(hidden|auto|scroll|clip)/.test(getComputedStyle(e).overflowX)) return true } return false }
  const wide = [], seen = new Set()
  for (const el of document.querySelectorAll('body *')) {
    const r = el.getBoundingClientRect()
    if (r.width < 2 || r.height < 2) continue
    if (r.right <= vw + 1 && r.left >= -1) continue
    if (seen.has(el.parentElement)) { seen.add(el); continue }
    if (hidden(el) || clipped(el)) continue
    seen.add(el)
    wide.push({ el: label(el), left: Math.round(r.left), right: Math.round(r.right) })
  }
  const cut = []
  for (const el of document.querySelectorAll('body *')) {
    if (![...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 1)) continue
    const cs = getComputedStyle(el)
    if (cs.overflowX !== 'hidden' || cs.textOverflow === 'ellipsis' || cs.webkitLineClamp !== 'none') continue
    if (el.scrollWidth > el.clientWidth + 2 && !hidden(el)) cut.push(label(el))
  }
  const brokenImages = [...document.images].filter(i => i.complete && i.naturalWidth === 0 && !hidden(i)).map(i => i.currentSrc || i.src)
  const tiny = []
  for (const el of document.querySelectorAll('body *')) {
    if (![...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 1)) continue
    const r = el.getBoundingClientRect()
    if (r.width < 2 || r.height < 2 || hidden(el) || el.closest('.sr-only')) continue
    const px = parseFloat(getComputedStyle(el).fontSize)
    if (px < 12) tiny.push(px + 'px ' + label(el))
  }
  const h1s = [...document.querySelectorAll('h1')].filter(h => !hidden(h)).map(h => ({ px: parseFloat(getComputedStyle(h).fontSize), weight: getComputedStyle(h).fontWeight, text: h.textContent.trim().slice(0, 50) }))
  return JSON.stringify({ path: location.pathname + location.search, vw, docW, height: document.body.scrollHeight, wide: wide.slice(0, 8), wideCount: wide.length, cut: cut.slice(0, 8), brokenImages: brokenImages.slice(0, 8), tiny: tiny.slice(0, 8), tinyCount: tiny.length, h1s })
})()`

const pw = join(process.env.LOCALAPPDATA, 'ms-playwright')
const shellDir = readdirSync(pw).filter(d => d.startsWith('chromium_headless_shell-')).sort().pop()
const inner = readdirSync(join(pw, shellDir)).find(d => d.startsWith('chrome-headless-shell'))
const exe = join(pw, shellDir, inner, 'chrome-headless-shell.exe')

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
  // A call that never answers (a page that stops responding) must not hang the
  // whole run: fail it after 90 seconds so the page is retried or recorded.
  const send = (method, params = {}) => new Promise((r, rej) => { const id = ++seq; const t = setTimeout(() => { pending.delete(id); rej(new Error(method + ' timed out')) }, 90000); pending.set(id, m => { clearTimeout(t); r(m) }); ws.send(JSON.stringify({ id, method, params })) })
  const evaluate = async expression => {
    const msg = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
    if (msg.error) throw new Error(msg.error.message)
    const res = msg.result
    if (res?.exceptionDetails) throw new Error(res.exceptionDetails.exception?.description ?? res.exceptionDetails.text)
    return res?.result?.value
  }

  await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: W < 768 })
  await send('Page.enable')
  // Answer the cookie banner once so it does not sit over every page.
  await send('Page.navigate', { url: baseUrl + '/' })
  await sleep(1500)
  await evaluate("localStorage.setItem('cookie_consent','rejected')")

  if (!process.argv.includes('--append')) writeFileSync(out, '')
  for (const [i, path] of paths.entries()) {
    let row = { asked: path, w: W }
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        await send('Page.navigate', { url: baseUrl + path })
        for (let k = 0; k < 60; k++) { await sleep(500); if (await evaluate('document.readyState') === 'complete') break }
        await sleep(2000)
        const layout = JSON.parse(await evaluate(layoutExpr))
        const c = JSON.parse(await evaluate(scan))
        row = { ...row, ...layout, checked: c.checked, fails: c.fails.slice(0, 12), failCount: c.fails.length, ghostButtons: c.ghostButtons.slice(0, 8), ghostCount: c.ghostButtons.length, onImageCount: c.onImageCount }
        delete row.error
        break
      } catch (err) {
        row.error = err.message.split('\n')[0]
      }
    }
    appendFileSync(out, JSON.stringify(row) + '\n')
    console.log(`${i + 1}/${paths.length} ${path} @${W}: ${row.error ? 'ERROR ' + row.error : `doc ${row.docW}/${row.vw}, wide ${row.wideCount}, cut ${row.cut.length}, img ${row.brokenImages.length}, tiny ${row.tinyCount}, AA ${row.failCount}, ghost ${row.ghostCount}`}`)
  }
  ws.close()
} finally {
  proc.kill()
}
