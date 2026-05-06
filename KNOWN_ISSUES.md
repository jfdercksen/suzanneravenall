# Known Issues — Suzanne Ravenall Platform

Track all known issues here. Resolve by linking to the commit or PR that fixes them.

| ID | Issue | Severity | Location | Reported | Status |
|---|---|---|---|---|---|
| KI001 | Sentry account created but DSNs cannot be finalised until DNS cutover | Medium | All .env files | March 2026 | Deferred to Phase 5 |
| KI002 | Backblaze B2 account not yet created — backup cron not installed on VPS | High | infra/scripts/backup.sh | March 2026 | Resolved (April 2026) |
| KI003 | All change_me placeholder values still in production .env — must be replaced before Phase 1 | Critical | .env (VPS) | March 2026 | Resolved (April 2026) |
| KI004 | Payload CMS admin CSS not loading and login redirects back to login screen on VPS Docker deployment | High | infra/docker-compose.yml, apps/payload/Dockerfile, infra/nginx/conf.d/ | April 2026 | Resolved (April 2026) — root cause: basePath not committed; infra/.env used wrong var names (DATABASE_URI/PAYLOAD_PUBLIC_SERVER_URL). Fixed: basePath: '/cms' added to next.config.ts, PAYLOAD_DATABASE_URL + PAYLOAD_URL corrected in .env. Requires container rebuild on VPS. |
| KI005 | Payload CMS basePath routing conflict — without basePath Nginx /cms prefix breaks routing; with basePath React hydration error #418 prevents form interaction | High | apps/payload/next.config.ts, infra/nginx/conf.d/ip-testing.conf | April 2026 | Resolved (April 2026) — root cause: basePath was correct in working copy but never committed; PAYLOAD_URL had wrong var name so serverURL was empty (causing hydration mismatch). Fixed: basePath committed, PAYLOAD_URL set to http://169.239.180.49/cms for IP testing phase. |
| KI006 | 15 legitimate products in WooCommerce category 73 ("not used-Akashic Coaching") excluded from Task 2.3 migration | Medium | infra/scripts/migrations/ | April 2026 | Open — must be manually added to Medusa or recategorised in WooCommerce and re-run after DNS cutover. Products: Practitioner Mentorship (4 variants), Email Support, Coaching, VIP Package, Bonus Lifetime Access, Ravenall Institute Certification Fee, Resonance Repatterning Programs 6/7/9 Live via Zoom, Deep Energy Clearing purchased together (2 products). |
| KI007 | seed.ts fails on Medusa v2 tax-rate API (region_id filter not supported) — regions were created but tax rates, shipping options, and 12 placeholder products were not seeded | Low | apps/medusa/src/scripts/seed.ts | April 2026 | Open — seed.ts needs tax-rate query fixed for Medusa v2 before placeholder products can be seeded. Collections were created separately via seed-collections.mjs. |
| KI008 | Task 2.3 WooCommerce migration applied consolidation — 128 WC flat products consolidated into 48 Medusa products with variants. 129 URL redirects written to infra/scripts/migrations/redirect-map.json for Task 1.9 | Info | apps/medusa/src/scripts/migrate-woocommerce.ts, infra/scripts/migrations/redirect-map.json | April 2026 | Resolved (April 2026) — consolidation approach replaces the original flat 1:1 WC→Medusa mapping. See CONSOLIDATION_MAP in migrate-woocommerce.ts for full variant spec. |
| KI009 | MEDUSA_DATABASE_URL must include ?sslmode=disable — without it the pg driver attempts SSL against the internal Docker Postgres container which does not have SSL enabled, causing all module migrations to fail with "The server does not support SSL connections" | High | infra/.env (VPS), .env.example | May 2026 | Resolved (May 2026) — ?sslmode=disable appended to MEDUSA_DATABASE_URL in infra/.env on VPS. Document all future Medusa deployments must include this flag. |
| KI010 | Sage Business Cloud credentials not yet obtained — Sage integration (Task 2.8) is built but cannot be activated until credentials are provided | High | infra/.env (VPS) | May 2026 | Open — requires Suzanne to provide: SAGE_EMAIL (Sage login), SAGE_PASSWORD, SAGE_API_KEY (from Sage developer settings), SAGE_COMPANY_ID (from GET /Company/Get). Also need SAGE_INCOME_ACCOUNT_ID (from Chart of Accounts) and MEDUSA_API_TOKEN (from Medusa admin API Key Management). Once credentials are in infra/.env, rebuild medusa + n8n containers and import + activate infra/n8n/workflows/medusa-order-to-sage.json in the n8n UI. |

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
