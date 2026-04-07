---
name: screenshot-compare
description: Screenshot a running Next.js route and compare it visually against a reference image. Use when checking if the current UI matches the design reference, or after any visual change.
allowed-tools: Read, Write, Bash
---

# Screenshot Compare

## Inputs
- Route to screenshot (e.g., `/about`)
- Reference image path (e.g., `.refs/about-desktop.png`)
- Viewports to check (default: 375px, 768px, 1280px)

## Process

### Step 1 — Verify dev server is running
```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
```
If not running, instruct user to start it with `docker-compose up -d`.

### Step 2 — Take screenshots at each viewport
```bash
npx puppeteer screenshot http://localhost:3000{route} --width={width} --fullpage --output=.tmp/screenshot_{route}_{width}.png
```

### Step 3 — Compare against reference
Read both images and compare:
- Layout and spacing
- Font sizes and weights
- Colours (hex values)
- Alignment
- Border radii, shadows
- Missing or extra elements

### Step 4 — Report
```
## Screenshot Comparison
**Route:** {route}
**Status:** MATCH / MISMATCH

### {width}px viewport
- [MATCH/MISMATCH] {description of difference}

### Summary
{overall assessment}
```

## Rules
- Always check at least 375px (mobile) and 1280px (desktop)
- Report pixel-level differences where possible
- Do not suggest code changes — only report what differs
