// Contrast scan for one rendered page. Paste into the browser devtools console
// (or a javascript_exec tool) on the page to check. Returns a JSON report.
//
// 1. Scrolls the page so whileInView sections mount, then forces any element
//    framer-motion left mid-animation to its final state (a hidden browser
//    pane never fires requestAnimationFrame, so fades can stall at opacity 0).
// 2. For every visible text node, blends its ancestors' background colours
//    down to white and computes the WCAG ratio (4.5 normal, 3 for 24px+ or
//    18.66px+ bold).
// 3. Lists buttons whose fill is under 3:1 against the ground they sit on
//    ("ghost buttons": the failure mode of bg-brand-accent on a dark ground).
//
// Limits: text whose ancestor paints a gradient or image is listed under
// onImage for a manual look. Text over a SIBLING photo (absolute <Image fill>
// or <video>) is not detected and can show up as white-on-white: check those
// cards by eye in the cdp-shots.mjs slices.
(async () => {
  for (let y = 0; y < document.body.scrollHeight; y += 500) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 80)); }
  window.scrollTo(0, 0); await new Promise(r => setTimeout(r, 400));
  document.querySelectorAll('[style]').forEach(e => {
    if (e.style.opacity !== '' && +e.style.opacity < 1) e.style.opacity = '1';
    if (e.style.transform && e.style.transform !== 'none') e.style.transform = 'none';
  });
  const parse = c => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
  const lum = ({ r, g, b }) => { const f = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const blend = (fg, bg) => ({ r: fg.r * fg.a + bg.r * (1 - fg.a), g: fg.g * fg.a + bg.g * (1 - fg.a), b: fg.b * fg.a + bg.b * (1 - fg.a), a: 1 });
  const hex = c => '#' + [c.r, c.g, c.b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
  const backdrop = el => {
    const layers = [];
    for (let e = el; e; e = e.parentElement) {
      const cs = getComputedStyle(e);
      if (cs.backgroundImage !== 'none') return null;
      const c = parse(cs.backgroundColor);
      if (c && c.a > 0) { layers.push(c); if (c.a >= 1) break; }
    }
    let base = { r: 255, g: 255, b: 255, a: 1 };
    for (let i = layers.length - 1; i >= 0; i--) base = blend(layers[i], base);
    return base;
  };
  const hidden = el => { for (let e = el; e; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity < 0.05) return true; } return false; };
  const ratioOf = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

  const fails = [], onImage = []; let checked = 0;
  for (const el of document.querySelectorAll('body *')) {
    if (['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(el.tagName)) continue;
    if (![...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 1)) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2 || hidden(el) || el.closest('[aria-hidden="true"]') || el.closest('.sr-only')) continue;
    const cs = getComputedStyle(el); const fg = parse(cs.color); if (!fg) continue;
    const text = el.textContent.trim().replace(/\s+/g, ' ').slice(0, 50);
    const bg = backdrop(el); if (!bg) { onImage.push(text); continue; }
    const f = blend(fg, bg); const ratio = ratioOf(f, bg);
    const px = parseFloat(cs.fontSize); const large = px >= 24 || (px >= 18.66 && +cs.fontWeight >= 700); const need = large ? 3 : 4.5;
    checked++;
    if (ratio < need) fails.push({ text, ratio: +ratio.toFixed(2), need, fg: hex(f), bg: hex(bg), size: px, cls: String(el.className).slice(0, 90) });
  }

  const ghostButtons = [];
  for (const el of document.querySelectorAll('a, button, [role="button"]')) {
    const r = el.getBoundingClientRect(); if (r.width < 24 || r.height < 16 || hidden(el)) continue;
    const fill = parse(getComputedStyle(el).backgroundColor); if (!fill || fill.a < 0.5) continue;
    const ground = el.parentElement && backdrop(el.parentElement); if (!ground) continue;
    const ratio = ratioOf(blend(fill, ground), ground);
    if (ratio < 3) ghostButtons.push({ text: el.textContent.trim().replace(/\s+/g, ' ').slice(0, 40), ratio: +ratio.toFixed(2), fill: hex(blend(fill, ground)), ground: hex(ground) });
  }

  return JSON.stringify({ url: location.pathname, vw: innerWidth, checked, fails, ghostButtons, onImageCount: onImage.length, onImage: onImage.slice(0, 25) }, null, 1);
})()
