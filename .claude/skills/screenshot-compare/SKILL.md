---
name: screenshot-compare
description: Screenshot a running Next.js route and compare it visually against a reference image. Use when checking if the current UI matches the design reference, or after any visual change.
allowed-tools: Bash, Read, Write
---

# Screenshot & Compare

## Goal
Screenshot a live Next.js route and compare it against a reference image. Report all visual differences with specific measurements.

## Inputs
- `route` — The route to screenshot (e.g., `/`, `/about`, `/dashboard`)
- `reference` — Path to the reference image (e.g., `reference/homepage.png`)

## Pre-requisite
Dev server must be running:
```bash
npm run dev
```

## Process

### Step 1 — Screenshot
```bash
npx puppeteer screenshot http://localhost:3000<route> --fullpage
```
Output saved to `.tmp/screenshot_<route>.png`.

### Step 2 — Compare
Read both images and compare section by section. Check:
- Spacing and padding (measure in px)
- Font sizes, weights, line heights
- Colors (exact hex values)
- Alignment and positioning
- Border radii, shadows, effects
- Responsive behavior at 375px, 768px, 1280px widths

### Step 3 — Report
List every difference with:
- **Location**: Which section/element
- **What's wrong**: Current vs expected (with px measurements)
- **Priority**: High (layout broken) / Medium (spacing off) / Low (minor color diff)

## Outputs
- Console report of all visual differences
- `.tmp/screenshot_<route>.png` — Current screenshot for reference
