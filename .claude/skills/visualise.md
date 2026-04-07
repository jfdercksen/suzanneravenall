---
name: visualise
description: Generate an interactive HTML codebase tree visualisation. Use when the user wants to see the project structure, understand file relationships, or get an overview of the codebase.
allowed-tools: Read, Write, Bash, Glob, Grep
---

# Visualise Codebase

Generate an interactive HTML file that shows the project structure as a collapsible tree with file sizes and type indicators.

## Process

### Step 1 — Scan the codebase
```bash
find apps packages infra .claude .github -type f \
  -not -path "*/node_modules/*" \
  -not -path "*/.next/*" \
  -not -path "*/dist/*" \
  -not -path "*/.git/*" \
  2>/dev/null | sort
```

### Step 2 — Collect metadata
For each file, capture:
- Path
- Size (bytes)
- Extension (for colour coding)
- Last modified date

### Step 3 — Generate HTML
Write to `.tmp/codebase-map.html`:
- Collapsible folder tree (click to expand/collapse)
- Color-coded by file type: `.tsx` blue, `.ts` green, `.sql` orange, `.yml` purple, `.md` grey, `.sh` red
- File size shown next to each file
- Search/filter input at the top
- Summary stats: total files, total size, files by type

### Step 4 — Open in browser
```bash
start .tmp/codebase-map.html 2>/dev/null || open .tmp/codebase-map.html 2>/dev/null || echo "Open .tmp/codebase-map.html in your browser"
```

## Output
Interactive HTML file at `.tmp/codebase-map.html`.

## Rules
- Exclude node_modules, .next, dist, .git directories
- Keep the HTML self-contained — inline CSS and JS, no external dependencies
- Make it mobile-friendly in case Suzanne views it on her phone
