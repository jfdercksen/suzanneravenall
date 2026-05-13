# Developer Runbook — Suzanne Ravenall Platform

**Maintainer:** Johan Dercksen — Ai Dynamic Advisory
**Last updated:** May 2026
**Status:** Phase 4 complete — Phase 5 (QA & Launch) pending

---

## Contents

1. [System Overview](#1-system-overview)
2. [VPS Access & Deployment](#2-vps-access--deployment)
3. [Environment Variables](#3-environment-variables)
4. [Database Operations](#4-database-operations)
5. [Common Maintenance Tasks](#5-common-maintenance-tasks)
6. [Monitoring & Alerts](#6-monitoring--alerts)
7. [Known Issues](#7-known-issues)
8. [Credential Inventory](#8-credential-inventory)
9. [Pre-Launch Checklist Reference](#9-pre-launch-checklist-reference)
10. [Emergency Procedures](#10-emergency-procedures)

---

## 1. System Overview

### Architecture

```
                        ┌────────────────────────────────────────────┐
                        │              Cloudflare (CDN / WAF)         │
                        └───────────────────┬────────────────────────┘
                                            │ HTTPS
                        ┌───────────────────▼────────────────────────┐
                        │           VPS (169.239.180.49)              │
                        │           Ubuntu 22.04 — cloud.co.za        │
                        │                                             │
                        │  ┌─────────────────────────────────────┐   │
                        │  │         Nginx (reverse proxy)        │   │
                        │  │  :80 / :443  →  Docker services     │   │
                        │  └──────┬──────┬────────┬──────────────┘   │
                        │         │      │        │                   │
                  :3000  │    :3001│  :9000│   :3002│  :5678          │
                        │  ┌──────▼─┐ ┌──▼────┐ ┌▼──────┐ ┌──────┐  │
                        │  │  web   │ │payload│ │medusa │ │calcom│  │
                        │  │Next.js │ │  CMS  │ │v2 API │ │      │  │
                        │  └────────┘ └───────┘ └───────┘ └──────┘  │
                        │                                             │
                        │  ┌──────────┐ ┌──────────┐ ┌───────────┐  │
                        │  │ postgres │ │  n8n     │ │meilisearch│  │
                        │  │ :5432    │ │ :5678    │ │ :7700     │  │
                        │  └──────────┘ └──────────┘ └───────────┘  │
                        │                                             │
                        │  ┌──────────────────────────────────────┐  │
                        │  │         Supabase (external)           │  │
                        │  │  Auth + storage + member_subscriptions │  │
                        │  │  Project: mjhwonoekokxyisfljtj        │  │
                        │  └──────────────────────────────────────┘  │
                        └────────────────────────────────────────────┘
```

### Services and ports

| Docker service | Purpose | Internal port | Public access |
|----------------|---------|--------------|---------------|
| `web` | Next.js 15 frontend | 3000 | via Nginx at `/` |
| `payload` | Payload CMS | 3001 | via Nginx at `/cms` |
| `medusa` | Medusa.js v2 commerce API | 9000 | via Nginx at `/api` |
| `postgres` | PostgreSQL (Medusa + Payload DBs) | 5432 | internal only |
| `calcom` | Cal.com scheduling | 3002 | direct `:3002` (Nginx proxy pending) |
| `n8n` | n8n automation workflows | 5678 | direct `:5678` (Nginx proxy pending) |
| `meilisearch` | Full-text search | 7700 | internal only |

### Key URLs

| Resource | URL |
|----------|-----|
| VPS IP | 169.239.180.49 |
| GitHub repo | https://github.com/[your-org]/suzanneravenall (update when known) |
| Supabase dashboard | https://supabase.com/dashboard/project/mjhwonoekokxyisfljtj |
| Supabase project ref | `mjhwonoekokxyisfljtj` |
| n8n UI | http://169.239.180.49:5678 |
| Medusa Admin | http://169.239.180.49/medusa |
| Payload CMS Admin | http://169.239.180.49/cms/admin |
| Cal.com | http://169.239.180.49:3002 |

---

## 2. VPS Access & Deployment

### SSH access

```bash
ssh root@169.239.180.49
```

Private key is in the Ai Dynamic Advisory password manager / GitHub Actions secrets (`SSH_PRIVATE_KEY`).

Working directory on VPS: `/var/www/suzanneravenall/suzanneravenall/infra/`

### Deployment process

Push to `main` triggers the GitHub Actions CI/CD pipeline:

1. `push` event on `main`
2. GitHub Actions runs `pr-checks.yml` — TypeScript type check + build
3. On success, SSH into VPS and run:
   ```bash
   cd /var/www/suzanneravenall/suzanneravenall
   git fetch origin main
   git reset --hard origin/main
   cd infra
   docker compose -f docker-compose.yml pull
   docker compose -f docker-compose.yml up -d --remove-orphans
   ```

### Manual deploy (emergency)

```bash
ssh root@169.239.180.49
cd /var/www/suzanneravenall/suzanneravenall
git fetch origin main && git reset --hard origin/main
cd infra
docker compose -f docker-compose.yml pull && docker compose -f docker-compose.yml up -d --remove-orphans
```

### Rebuild a single container

```bash
# From /var/www/suzanneravenall/suzanneravenall/infra/
docker compose -f docker-compose.yml up -d --build web
docker compose -f docker-compose.yml up -d --build medusa
docker compose -f docker-compose.yml up -d --build payload
```

### View logs

```bash
# Stream live logs for a service
docker logs infra-web-1 --tail 100 -f
docker logs infra-medusa-1 --tail 100 -f
docker logs infra-payload-1 --tail 100 -f
docker logs infra-n8n-1 --tail 100 -f
docker logs infra-postgres-1 --tail 100 -f

# Check all container statuses
docker compose -f docker-compose.yml ps
```

### Nginx config

Config files: `/etc/nginx/conf.d/`

Active file for IP testing: `ip-testing.conf`
Active file for production: `suzanneravenall.conf` (enable at DNS cutover)

```bash
# Test config before reloading
nginx -t

# Reload Nginx (no downtime)
nginx -s reload
```

### Local development

Run from the `infra/` directory. Always include both `-f` flags locally — `docker-compose.local.yml` adds bind mounts for hot reload.

```bash
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d
```

Never load `docker-compose.local.yml` on the VPS.

---

## 3. Environment Variables

### Location on VPS

`/var/www/suzanneravenall/suzanneravenall/infra/.env`

This file is not committed to git (gitignored). It's the single source of truth for all secrets on the VPS.

### Rebuild vs restart

| Change type | Action required |
|-------------|----------------|
| `NEXT_PUBLIC_*` vars (baked at build time) | Full container rebuild: `docker compose up -d --build web` |
| Server-only runtime vars (API keys, database URLs) | Restart only: `docker compose up -d web` |
| Medusa API keys or module config | Restart medusa: `docker compose up -d medusa` |
| n8n credentials | Restart n8n: `docker compose up -d n8n` |

### All required variables

See `.env.example` in the repo root for the full list with descriptions. The table below highlights which are still outstanding (`change_me` or awaiting credentials):

| Variable | Status | Notes |
|----------|--------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Set | |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Set | |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Set | |
| `MEDUSA_DATABASE_URL` | ✅ Set | Must include `?sslmode=disable` |
| `PAYLOAD_DATABASE_URL` | ✅ Set | |
| `NEXT_PUBLIC_MEDUSA_URL` | ✅ Set | Public-facing URL — browsers must be able to reach it |
| `MEDUSA_BACKEND_URL` | ✅ Set | Internal Docker URL: `http://medusa:9000` |
| `PAYLOAD_SECRET` | ✅ Set | |
| `PAYLOAD_URL` | ✅ Set | Must match the URL browsers use to access Payload |
| `RESEND_API_KEY` | ⏳ Pending | Add from Resend dashboard after domain verification |
| `PAYFAST_MERCHANT_ID` | ⏳ Pending | From Suzanne's PayFast merchant account |
| `PAYFAST_MERCHANT_KEY` | ⏳ Pending | From Suzanne's PayFast merchant account |
| `PAYFAST_PASSPHRASE` | ⏳ Pending | From Suzanne's PayFast merchant account |
| `PAYPAL_CLIENT_ID` | ⏳ Pending | From PayPal developer dashboard |
| `PAYPAL_CLIENT_SECRET` | ⏳ Pending | From PayPal developer dashboard |
| `PAYPAL_WEBHOOK_ID` | ⏳ Pending | Created when PayPal webhook is registered |
| `SAGE_EMAIL` | ⏳ Pending | Suzanne's Sage login email (KI010) |
| `SAGE_PASSWORD` | ⏳ Pending | Suzanne's Sage password (KI010) |
| `SAGE_API_KEY` | ⏳ Pending | From Sage developer settings (KI010) |
| `SAGE_COMPANY_ID` | ⏳ Pending | From `GET /Company/Get` (KI010) |
| `BUNNY_STREAM_API_KEY` | ✅ Set | |
| `BUNNY_STREAM_LIBRARY_ID` | ✅ Set | |
| `BUNNY_CDN_HOSTNAME` | ✅ Set | |
| `BUNNY_STREAM_SIGNING_KEY` | ✅ Set | Token Auth Key from Bunny Stream library settings |
| `BUNNY_WEBHOOK_SECRET` | ✅ Set | Generated: `openssl rand -hex 32` |
| `MEILISEARCH_HOST` | ✅ Set | Internal: `http://meilisearch:7700` |
| `MEILISEARCH_ADMIN_KEY` | ✅ Set | |
| `N8N_WEBHOOK_SECRET` | ✅ Set | Shared HMAC secret for n8n webhook calls |
| `N8N_BASE_URL` | ✅ Set | |
| `VTIGER_URL` | ⏳ Pending | Vtiger instance URL (KI013) |
| `VTIGER_USERNAME` | ⏳ Pending | Vtiger username (KI013) |
| `VTIGER_ACCESS_KEY` | ⏳ Pending | From Vtiger admin → My Preferences (KI013) |
| `VIBE_MARKETING_WEBHOOK_URL` | ⏳ Pending | From Vibe Marketing dashboard |
| `CALCOM_WEBHOOK_SECRET` | ⏳ Pending | `openssl rand -hex 32` — add to Cal.com webhook settings |
| `MEDUSA_API_TOKEN` | ⏳ Pending | Generate in Medusa Admin → Settings → API Keys |
| `WEB_BASE_URL` | ✅ Set | |
| `NEXT_PUBLIC_SENTRY_DSN` | ⏳ Deferred | Phase 5 (KI001) |
| `SENTRY_DSN_WEB` | ⏳ Deferred | Phase 5 (KI001) |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | ⏳ Pending | Confirm GA4 property ID with Suzanne |
| `NEXT_PUBLIC_CLARITY_ID` | ⏳ Pending | Confirm Clarity ID with Suzanne |
| `ANTHROPIC_API_KEY` | ⏳ Pending | Only needed if Claude API features are used |

---

## 4. Database Operations

### Connect to Postgres

```bash
# From VPS
docker exec -it infra-postgres-1 psql -U medusa -d medusa
# Or for the Payload database:
docker exec -it infra-postgres-1 psql -U payload -d payload
```

### Run Medusa migrations

Run this after any Medusa module changes or after first deploy:

```bash
docker compose -f docker-compose.yml exec medusa npx medusa db:migrate
```

### Supabase

Supabase hosts the member-facing tables (auth, member_subscriptions, video_content, profiles, etc.).

Access via:
- Dashboard: https://supabase.com/dashboard/project/mjhwonoekokxyisfljtj
- CLI: `supabase db push` (from repo root, with `supabase link` already done)

Migration files are in `packages/database/migrations/`. Always apply via `supabase db push` — never edit the Supabase schema directly via the dashboard.

Pending migrations to run on Supabase (not yet pushed):
- `supabase/migrations/20260512100000_video_content.sql` — creates `video_content` table and `video_access_log` table

### Medusa seed scripts

```bash
# Create product collections (idempotent)
node infra/scripts/migrations/seed-collections.mjs

# Seed regions / payment providers (idempotent — run after initial deploy and after adding PayFast/PayPal)
node infra/scripts/migrations/seed-regions.mjs

# Seed MeiliSearch product index (run once after DNS cutover)
node infra/scripts/migrations/seed-meilisearch.js
```

### Backup

Backblaze B2 bucket is configured. Automated `pg_dump` cron is installed on the VPS.

Backup location: Backblaze B2 bucket `suzanneravenall-backups`
Backup schedule: Daily at 02:00 SAST
Restore procedure: See `infra/scripts/backup.sh` — reverse the dump/restore steps.

---

## 5. Common Maintenance Tasks

### Rebuild a single container after code change

```bash
# From infra/ on VPS
docker compose -f docker-compose.yml up -d --build web
```

### View container resource usage

```bash
docker stats --no-stream
```

### Clearing disk space

```bash
# Remove dangling images and stopped containers
docker system prune -f

# More aggressive — also removes unused volumes (CAUTION: back up first)
docker system prune -a -f --volumes
```

### Rotating secrets / API keys

When rotating a secret:

1. Update the value in `infra/.env` on the VPS.
2. Restart the affected service(s):

| Secret | Services to restart |
|--------|---------------------|
| `RESEND_API_KEY` | `web`, `n8n` |
| `PAYFAST_*` / `PAYPAL_*` | `medusa`, `web` |
| `SUPABASE_SERVICE_ROLE_KEY` | `web`, `medusa`, `n8n` |
| `N8N_WEBHOOK_SECRET` | `web`, `medusa`, `n8n` |
| `BUNNY_*` | `web` |
| `VTIGER_*` | `medusa` |
| `SAGE_*` | `medusa`, `n8n` |
| `MEDUSA_API_TOKEN` | `web`, `n8n` |

3. Update the corresponding secret in GitHub Actions (for CI/CD rebuild — applies to `NEXT_PUBLIC_*` vars only).
4. If it's a `NEXT_PUBLIC_*` var, a full `--build` rebuild is required (see §3).

### Importing n8n workflows

All workflow JSONs are in `infra/n8n/workflows/`. To import:

1. Open n8n at http://169.239.180.49:5678.
2. Click the **...** menu → **Import from file**.
3. Select the workflow JSON file.
4. Configure credentials if prompted (Supabase, Resend, Vtiger, Sage).
5. Toggle the workflow **Active**.

Workflows that must be manually imported and activated before go-live:

- `cart-abandonment-recovery.json`
- `membership-renewal-check.json`
- `membership-expiry-check.json`
- `calcom-booking-to-vtiger.json`
- `medusa-order-to-vtiger.json`
- `lead-magnet-to-vtiger.json`
- `medusa-order-to-sage.json`
- `sage-invoice-sync.json`
- `weekly-report.json`
- `bunny-video-access-log.json`
- `vibe-marketing-sync-monitor.json`

---

## 6. Monitoring & Alerts

### Sentry — error tracking

Deferred to Phase 5 (KI001). Accounts created but DSNs not finalised until DNS cutover.

Once Sentry DSNs are set:
- Add `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_DSN_WEB`, `NEXT_PUBLIC_SENTRY_ENVIRONMENT`, `SENTRY_ENVIRONMENT` to `infra/.env`.
- Rebuild `web` container.
- Sentry is already integrated in the codebase — it activates on env var presence.

### n8n workflow health

- Open n8n → **Executions** to see recent workflow runs.
- Failed executions are logged here with error detail.
- The `sage-invoice-sync` and `vibe-marketing-sync-monitor` workflows send Resend alerts on failure.

### Docker health checks

```bash
docker compose -f docker-compose.yml ps
```

Services with health checks configured:

| Service | Healthcheck |
|---------|-------------|
| `web` | `curl -f http://localhost:3000/api/health` |
| `payload` | `curl -f http://localhost:3001/cms/admin` |
| `medusa` | `curl -f http://localhost:9000/health` |
| `postgres` | `pg_isready -U medusa` |
| `meilisearch` | `curl -f http://localhost:7700/health` |

If a container shows **unhealthy**, check its logs first before restarting.

### Cloudflare

DNS, CDN caching, and WAF rules are managed via the Cloudflare dashboard. Contact Johan for Cloudflare access.

At DNS cutover, the A record must be pointed from the old WordPress VPS to `169.239.180.49`.

---

## 7. Known Issues

See `KNOWN_ISSUES.md` in the repo root for the full list. Summary of open issues:

| ID | Issue | Severity |
|----|-------|----------|
| KI001 | Sentry DSNs deferred to Phase 5 | Medium |
| KI006 | 15 WooCommerce products in cat-73 excluded from migration | Medium |
| KI007 | seed.ts tax-rate query broken for Medusa v2 | Low |
| KI010 | Sage credentials awaited from Suzanne | High |
| KI011 | Discourse deferred — insufficient VPS RAM | High |
| KI012 | Wild Apricot migration awaiting Suzanne's decision | High |
| KI013 | Vtiger credentials awaited from Suzanne | High |

**Workarounds in the codebase:**

- `typescript: { ignoreBuildErrors: true }` in `apps/payload/next.config.ts` — Payload 3.x ships types incompatible with React 19; this is a known upstream bug, not our code.
- `serverExternalPackages: ['@react-pdf/renderer']` in `apps/web/next.config.mjs` — react-pdf uses Node binaries and must be excluded from webpack bundling.
- All `@react-pdf/renderer` TS2786/TS2607 errors are covered by `ignoreBuildErrors: true`.

---

## 8. Credential Inventory

| Service | Purpose | Credentials location | Account owner |
|---------|---------|---------------------|---------------|
| **VPS (cloud.co.za)** | Hosting | Ai Dynamic Advisory password manager | Ai Dynamic Advisory |
| **Cloudflare** | DNS, CDN, WAF | Ai Dynamic Advisory password manager | Ai Dynamic Advisory |
| **GitHub** | Source control, CI/CD | GitHub org settings | Ai Dynamic Advisory |
| **Supabase** | Database, Auth, Storage | `infra/.env` + Supabase dashboard | Ai Dynamic Advisory |
| **Backblaze B2** | Automated backups | `infra/.env` + Backblaze dashboard | Ai Dynamic Advisory |
| **Resend** | Transactional email | `infra/.env` (`RESEND_API_KEY`) | Ai Dynamic Advisory |
| **Medusa Admin** | Commerce backend | Medusa Admin → Settings → API Keys (`MEDUSA_API_TOKEN`) | Ai Dynamic Advisory |
| **PayFast** | South African payments | `infra/.env` (`PAYFAST_MERCHANT_ID` etc.) | Suzanne Ravenall |
| **PayPal** | International payments | `infra/.env` (`PAYPAL_CLIENT_ID` etc.) | Suzanne Ravenall |
| **Sage Business Cloud** | Accounting / invoicing | `infra/.env` (`SAGE_EMAIL` etc.) | Suzanne Ravenall |
| **Vtiger CRM** | CRM pipeline | `infra/.env` (`VTIGER_URL` etc.) | Suzanne Ravenall (pending) |
| **Cal.com** | Scheduling | Cal.com admin panel at `:3002` | Suzanne Ravenall |
| **Bunny Stream** | Video delivery | `infra/.env` (`BUNNY_STREAM_API_KEY` etc.) | Ai Dynamic Advisory |
| **MeiliSearch** | Full-text search | `infra/.env` (`MEILISEARCH_ADMIN_KEY`) | Ai Dynamic Advisory |
| **n8n** | Automation | `infra/.env` (various service keys passed to n8n) | Ai Dynamic Advisory |
| **Vibe Marketing** | AI marketing (Ai Dynamic Advisory) | `infra/.env` (`VIBE_MARKETING_WEBHOOK_URL`) | Ai Dynamic Advisory |
| **Google Analytics** | Analytics | `infra/.env` (`NEXT_PUBLIC_GA_MEASUREMENT_ID`) | Suzanne Ravenall |
| **Microsoft Clarity** | Heatmaps | `infra/.env` (`NEXT_PUBLIC_CLARITY_ID`) | Suzanne Ravenall |
| **Sentry** | Error monitoring | `infra/.env` (deferred — KI001) | Ai Dynamic Advisory |
| **Wild Apricot** | Legacy member database | Awaiting credentials (KI012) | Suzanne Ravenall |

---

## 9. Pre-Launch Checklist Reference

Full pre-launch checklist is in `BUILD_STATUS.md`. Key gate items before DNS cutover:

**Must complete before any DNS change:**
- [ ] All `change_me` vars replaced in `infra/.env`
- [ ] PayFast sandbox test passed (waiting on credentials)
- [ ] PayPal sandbox test passed (waiting on credentials)
- [ ] Sage integration tested end-to-end (waiting on credentials)
- [ ] Resend domain `suzanneravenall.com` verified as sending domain
- [ ] All n8n workflows imported and activated
- [ ] Supabase pending migrations pushed (`video_content.sql`)
- [ ] MeiliSearch seed script run: `node infra/scripts/migrations/seed-meilisearch.js`
- [ ] Sentry DSNs configured (KI001)
- [ ] Legal pages reviewed by lawyer
- [ ] Cookie consent banner implemented (POPIA — GA4 + Clarity currently fire unconditionally)
- [ ] Suzanne's full site review passed on http://169.239.180.49

**DNS cutover procedure:**

1. In Cloudflare, update the A record for `suzanneravenall.com` from the old WordPress VPS IP to `169.239.180.49`.
2. Wait for propagation (typically 5 minutes with Cloudflare).
3. Update `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_MEDUSA_URL`, `PAYLOAD_URL`, and `NEXT_PUBLIC_CAL_URL` in `infra/.env` to use `https://suzanneravenall.com`.
4. Update Supabase Auth redirect URLs to include the production domain.
5. Rebuild `web` and `payload` containers (both have `NEXT_PUBLIC_*` vars that bake at build time).
6. Enable `infra/nginx/conf.d/suzanneravenall.conf` and disable `ip-testing.conf`.
7. Run Certbot for SSL: `certbot --nginx -d suzanneravenall.com -d www.suzanneravenall.com`.
8. Confirm Nginx reloads cleanly: `nginx -t && nginx -s reload`.

---

## 10. Emergency Procedures

### Site is down

1. SSH into VPS: `ssh root@169.239.180.49`
2. Check container health: `docker compose -f docker-compose.yml ps`
3. If a container is **unhealthy** or **exited**, check its logs:
   ```bash
   docker logs infra-web-1 --tail 50
   ```
4. If it's a crash loop, check for OOM (out of memory):
   ```bash
   dmesg | grep -i kill | tail -20
   ```
5. If the web container is fine but the site is 502/504, check Nginx:
   ```bash
   nginx -t
   cat /var/log/nginx/error.log | tail -30
   ```
6. If Nginx is fine, check if Cloudflare is the issue — test direct IP: `curl -I http://169.239.180.49`

### Container in crash loop

1. Check logs for the root cause: `docker logs infra-{service}-1 --tail 100`
2. Common causes:
   - Missing env var → add to `infra/.env` and restart
   - Database connection failure → check Postgres is running and `MEDUSA_DATABASE_URL`/`PAYLOAD_DATABASE_URL` are correct
   - Port conflict → check `docker compose ps` for another container on the same port
3. If the container crashes on startup due to a bad code deploy:
   ```bash
   # Roll back to previous commit on VPS
   cd /var/www/suzanneravenall/suzanneravenall
   git log --oneline -5   # identify the last good commit
   git reset --hard <commit-hash>
   cd infra
   docker compose -f docker-compose.yml up -d --build web
   ```

### Database corruption / restore from backup

1. Identify the backup file in Backblaze B2 (`suzanneravenall-backups` bucket).
2. Download the relevant dump: `pg_dump` backup file for the affected database.
3. Stop the affected service: `docker compose stop medusa` (or `payload`).
4. Drop and recreate the database:
   ```bash
   docker exec -it infra-postgres-1 psql -U postgres -c "DROP DATABASE medusa;"
   docker exec -it infra-postgres-1 psql -U postgres -c "CREATE DATABASE medusa OWNER medusa;"
   ```
5. Restore from dump:
   ```bash
   cat backup.sql | docker exec -i infra-postgres-1 psql -U medusa -d medusa
   ```
6. Restart the service and run migrations:
   ```bash
   docker compose -f docker-compose.yml up -d medusa
   docker compose exec medusa npx medusa db:migrate
   ```

### Compromised credentials

If any API key, secret, or password is exposed:

1. Immediately rotate the compromised credential in the relevant service's dashboard.
2. Update `infra/.env` on the VPS with the new value.
3. Restart all affected services (see §5 — Rotating secrets).
4. Update GitHub Actions secrets if the credential is used in CI/CD.
5. Audit recent logs for any unauthorised use:
   - Supabase: Auth logs in Supabase dashboard → Auth → Logs
   - Medusa: `docker logs infra-medusa-1 --tail 500`
   - Resend: Resend dashboard → Emails (look for sends you didn't initiate)
6. If payment credentials (PayFast/PayPal) are compromised, contact the respective provider's fraud team immediately.

### Nginx config error after change

If `nginx -t` fails after an edit:

```bash
# Check the error message — it will point to the exact line
nginx -t

# Revert to last working config
cd /etc/nginx/conf.d
git diff   # if tracked, or manually restore from backup
nginx -t && nginx -s reload
```

If Nginx is not running at all:
```bash
systemctl status nginx
journalctl -u nginx --no-pager | tail -20
systemctl start nginx
```

---

*Document version: Phase 4 complete — May 2026*
*Prepared by Ai Dynamic Advisory*
