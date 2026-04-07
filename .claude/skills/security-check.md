---
name: security-check
description: Run a vulnerability scan across the codebase. Use before committing security-sensitive changes, before staging deploys, or on demand. Checks for exposed secrets, missing RLS, unsigned webhooks, and OWASP Top 10 issues.
allowed-tools: Read, Glob, Grep, Bash
---

# Security Check

Quick security scan focused on the most common vulnerabilities in this stack.

## Checks

### 1. Exposed secrets
```bash
# Check for hardcoded secrets in source
grep -rn "sk-\|sk_live\|sk_test\|password\s*=\s*['\"]" apps/ packages/ --include="*.ts" --include="*.tsx" --include="*.js" | grep -v node_modules | grep -v ".env.example" | head -20

# Check for secrets in NEXT_PUBLIC_ vars
grep -rn "NEXT_PUBLIC_.*SECRET\|NEXT_PUBLIC_.*PASSWORD\|NEXT_PUBLIC_.*KEY.*=.*sk" apps/ packages/ --include="*.ts" --include="*.tsx" | head -10

# Check git history for leaked secrets
git log --all -S "sk-" --oneline | head -5
git log --all -S "password=" --oneline | head -5
```

### 2. Missing RLS
```bash
# Find tables without RLS in migrations
grep -L "ENABLE ROW LEVEL SECURITY" packages/database/migrations/*.sql 2>/dev/null
```

### 3. Unsigned webhooks
```bash
# Check webhook handlers for signature verification
for f in $(find apps/web/app/api/webhooks -name "route.ts" 2>/dev/null); do
  if ! grep -q "verifySignature\|verify.*signature\|validateSignature" "$f"; then
    echo "WARNING: $f — no signature verification found"
  fi
done
```

### 4. Missing auth checks on API routes
```bash
# Find API routes without auth checks
for f in $(find apps/web/app/api -name "route.ts" -not -path "*/webhooks/*" 2>/dev/null); do
  if ! grep -q "getSession\|auth\.\|session" "$f"; then
    echo "WARNING: $f — no auth check found"
  fi
done
```

### 5. Dangerous patterns
```bash
# dangerouslySetInnerHTML without sanitization
grep -rn "dangerouslySetInnerHTML" apps/ packages/ --include="*.tsx" | head -10

# eval or Function constructor
grep -rn "eval(\|new Function(" apps/ packages/ --include="*.ts" --include="*.tsx" | head -10

# SQL injection risks (raw queries without parameterization)
grep -rn "\.raw(\|\.query(" apps/ packages/ --include="*.ts" | head -10
```

### 6. Dependency vulnerabilities
```bash
npm audit --json 2>/dev/null | head -30
```

## Output Format

```
## Security Scan Results
**Date:** {date}
**Branch:** {branch}

| Check | Status | Findings |
|-------|--------|----------|
| Exposed secrets | PASS/FAIL | N |
| RLS coverage | PASS/FAIL | N |
| Webhook signatures | PASS/FAIL | N |
| API auth checks | PASS/FAIL | N |
| Dangerous patterns | PASS/FAIL | N |
| Dependencies | PASS/FAIL | N |

### Critical (must fix now)
...

### Warnings (fix before staging)
...

### Overall: SECURE / NEEDS ATTENTION / VULNERABLE
```

## Rules
- Never auto-fix — report only
- Critical findings first
- Include file paths and line numbers
- If everything is clean, say so clearly
