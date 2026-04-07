# Known Issues — Suzanne Ravenall Platform

Track all known issues here. Resolve by linking to the commit or PR that fixes them.

| ID | Issue | Severity | Location | Reported | Status |
|---|---|---|---|---|---|
| KI001 | Sentry account created but DSNs cannot be finalised until DNS cutover | Medium | All .env files | March 2026 | Deferred to Phase 5 |
| KI002 | Backblaze B2 account not yet created — backup cron not installed on VPS | High | infra/scripts/backup.sh | March 2026 | Resolved (April 2026) |
| KI003 | All change_me placeholder values still in production .env — must be replaced before Phase 1 | Critical | .env (VPS) | March 2026 | Resolved (April 2026) |

---

## Template — Adding a New Issue

```
| KI{NNN} | {description} | {Critical/High/Medium/Low} | {file or location} | {month year} | Open |
```

## Resolving an Issue

Change status to `Resolved` and add the commit hash:

```
| KI001 | ... | ... | ... | ... | Resolved (abc1234) |
```
