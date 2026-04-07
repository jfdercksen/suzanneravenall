---
name: audit
description: Run a 9-category parallel codebase health check. Use when checking overall code quality, before a milestone, or after a large set of changes.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Agent
---

# Codebase Audit

Run a comprehensive health check across 9 categories. Spawn parallel agents for independent checks.

## Categories

1. **TypeScript strictness** — `any` types, `@ts-ignore`, missing return types on exported functions
2. **Security** — exposed secrets, missing input validation, RLS gaps, unsigned webhooks
3. **Performance** — large bundle imports, missing React.memo on expensive renders, N+1 queries
4. **Dead code** — unused exports, unreachable branches, commented-out code blocks
5. **Test coverage** — files with no corresponding .test.ts, untested API routes
6. **Dependency health** — outdated packages, known vulnerabilities (`npm audit`)
7. **Docker health** — unpinned image tags, missing health checks, missing resource limits
8. **Documentation** — CLAUDE.md route map out of sync, missing env vars in .env.example
9. **Accessibility** — missing alt text, missing aria labels, missing focus styles

## Process

### Step 1 — Parallel scans
Run these checks in parallel:

**TypeScript:**
```bash
npx tsc --noEmit 2>&1 | tail -20
```
```bash
grep -rn "as any\|@ts-ignore\|@ts-nocheck" apps/web/app/ packages/ --include="*.ts" --include="*.tsx" | head -20
```

**Security:**
```bash
grep -rn "NEXT_PUBLIC_.*SECRET\|NEXT_PUBLIC_.*KEY\|password.*=.*['\"]" apps/ packages/ --include="*.ts" --include="*.tsx" | head -20
```

**Dead code:**
```bash
grep -rn "// TODO\|// FIXME\|// HACK\|// XXX" apps/ packages/ --include="*.ts" --include="*.tsx" | head -20
```

**Dependencies:**
```bash
npm audit --json 2>/dev/null | head -50
```

**Docker:**
```bash
grep -n "latest" infra/docker-compose.yml 2>/dev/null
grep -L "healthcheck" infra/docker-compose.yml 2>/dev/null
```

**Documentation sync:**
```bash
# Check route map is current
find apps/web/app -name "page.tsx" -type f 2>/dev/null | sort
```

### Step 2 — Compile report

```
## Audit Report
**Date:** {date}
**Branch:** {branch}

### Results by Category
| Category | Status | Issues |
|----------|--------|--------|
| TypeScript | PASS/FAIL | N issues |
| Security | PASS/FAIL | N issues |
| ... | ... | ... |

### Critical Issues (fix before shipping)
1. ...

### Warnings (fix soon)
1. ...

### Notes (nice to have)
1. ...

### Overall Health: GOOD / NEEDS ATTENTION / CRITICAL
```

## Rules
- Never auto-fix — report only
- Critical issues must be listed first
- Include file paths and line numbers for every finding
- If a category is clean, say so — do not pad with nitpicks
