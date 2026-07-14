---
name: restore-session
description: Recover full context from the previous Claude Code session. Use at the start of any new session to pick up exactly where you left off. Automatically reads BUILD_STATUS.md, DECISIONS.md, KNOWN_ISSUES.md and recent git history.
allowed-tools: Bash, Read, Glob
---

# Restore Session

Recover full context from previous Claude Code sessions and present 
a clear summary of the current project state.

## Process

### Step 1 — Read session continuity files
```bash
cat BUILD_STATUS.md 2>/dev/null
cat DECISIONS.md 2>/dev/null
cat KNOWN_ISSUES.md 2>/dev/null
```

### Step 2 — Read recent git activity
```bash
git log --oneline -10 2>/dev/null
git status 2>/dev/null
git branch --show-current 2>/dev/null
```

### Step 3 — Read recent session files
```bash
ls -lt ~/.claude/projects/ 2>/dev/null | head -5
```

### Step 4 — Check current working state
```bash
docker-compose ps 2>/dev/null | head -20
```

### Step 5 — Present summary

Report back in this exact format:

---
## Session Restored — [Project Name]

**Current Phase:** [from BUILD_STATUS.md]
**Current Task:** [from BUILD_STATUS.md]
**Current Branch:** [from git]
**Last Updated:** [from BUILD_STATUS.md]

**Open Issues:**
[list from KNOWN_ISSUES.md active issues]

**Recent Commits:**
[last 5 from git log]

**Infrastructure Status:**
[docker-compose ps summary]

**Recommended next action:**
[based on current phase and task]

**Confirm:** Is this correct? Any changes before we start?
---

Wait for developer confirmation before doing anything else.

## Rules
- Read files, do not modify them
- Present the summary clearly — this is the first thing Johan sees
- Flag any conflicts between BUILD_STATUS.md and actual git state
- If BUILD_STATUS.md is stale (last updated date is old), note it
- NEVER suggest asking "which phase are we in?" — read BUILD_STATUS.md
  and state it directly
- NEVER reference a staging environment — it does not exist (D014)

## Critical Project Facts (include in every session restore)

### Strategic Context (Pattern Intelligence™ Ecosystem)
Suzanne's overarching IP framework — Pattern Intelligence™ — governs all builds. Every feature must map to one of seven frameworks:
1. Pattern Intelligence™ (philosophy)
2. Executive Capacity Intelligence™ (CEOs/leadership)
3. Human Performance Intelligence™ (organisations)
4. Pattern Discovery Instrument™ (assessments)
5. Executive Capacity Index™ (executive diagnostic)
6. Pattern Mapping Process™ (methodology/pathways)
7. Pattern Intelligence Coach™ (certification)
8. Pattern Intelligence AI™ (digital platform)

Governing question for every new build: "Does this strengthen Pattern Intelligence™?"
See docs/strategy/pattern-intelligence-ecosystem.md

### Environment
- Single VPS at 169.239.180.49 — this IS production
- NO staging environment — every deploy goes live immediately (D014)
- main branch = what is deployed and live

### Deploy command (exact — never deviate)
cd /var/www/suzanneravenall/suzanneravenall
git fetch origin main && git reset --hard origin/main
docker compose -f infra/docker-compose.yml up -d --build web
docker exec infra-nginx-1 nginx -s reload

Always use: docker compose -f infra/docker-compose.yml
Never use: plain docker compose (wrong compose file)

### Tools
- Johan uses PuTTY for VPS access
- Windows PowerShell locally
- Antigravity IDE (VS Code fork) with Claude Code
- Firecrawl over web_fetch for scraping suzanneravenall.com
  (web_fetch returns SERVER_ERROR on this domain)

### Design rules (non-negotiable)
- sm:/lg: breakpoints only — NEVER md:
- Dark/light alternating sections
- animate (not whileInView) on above-fold hero elements only
- whileInView on all below-fold sections
- rounded-card and rounded-button tokens
- Framer Motion on every section

### Agent rules (non-negotiable)
After EVERY build task, spawn these agents in parallel before deploying:
1. code-reviewer — reviews all changed files
2. qa-unit — runs/writes unit tests
3. qa-visual — screenshots at 1280px and 375px
Deploy ONLY after all agents pass or NEEDS CHANGES fixes are applied.

### Architecture rules
- MEDUSA_DATABASE_URL and PAYLOAD_DATABASE_URL must remain split
- PAYLOAD_PUBLIC_SERVER_URL must NOT include /cms suffix (basePath appends it)
- n8n internal URL: http://n8n:5678 (Docker internal, not exposed)
- Thinkific: ravenallinstitute-9629.thinkific.com (Legacy plan, no SSO)
- Region detection: CF-IPCountry header → ZA = ZAR, all others = USD

### Current integrations (all live)
- Supabase: mjhwonoekokxyisfljtj.supabase.co
- Medusa v2: 48 consolidated products + 56 Thinkific course products
- n8n: 11+ workflows active (Sage, Vtiger, Thinkific enrollment)
- Resend: transactional email
- PayFast: ZAR payments (live credentials pending from Suzanne)
- PayPal: USD payments (live credentials pending from Suzanne)
- Cal.com: suzanneravenall (booking)
- Thinkific: 89 published courses, n8n enrollment workflow active

### Key pending items (always check KNOWN_ISSUES.md for current state)
- CMS login broken (highest priority — blocking Suzanne's team)
- PayFast + PayPal live credentials pending from Suzanne
- Stale cart bug for returning international visitors
- 39 null Thinkific course descriptions need back-filling
- Sentry DSN not configured
- UFW firewall not enabled (enable before DNS cutover)

### Session continuity files
- BUILD_STATUS.md — phase progress, completed work, open items
- KNOWN_ISSUES.md — known bugs and blockers with severity
- DECISIONS.md — D001–D020 architectural decisions
- IMPLEMENTATION_WORKFLOW.md — original plan (NOTE: three-environment
  workflow is superseded by D014 — no staging exists)