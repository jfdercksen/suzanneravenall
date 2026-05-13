# Deployment Guide — suzanneravenall.com

## Overview

Single VPS deployment. No staging environment. All apps run in Docker containers behind Nginx.

- **VPS**: 169.239.180.49 (cloud.co.za, Ubuntu 22.04)
- **Infra dir on VPS**: `/var/www/suzanneravenall/suzanneravenall/infra`
- **Repo**: `github.com/your-org/suzanneravenall`

---

## Normal Deployment (code changes only)

```bash
# 1. Commit and push to main
git push origin main

# GitHub Actions automatically:
#   - Runs npm install + turbo build (Medusa excluded — needs live DB)
#   - Runs lint + tests
#   - SSHs to VPS → git pull → docker compose build web payload → up -d
```

**Note:** `infra/.env` is gitignored. The VPS `.env` is NOT updated by CI/CD.  
If env vars changed, do a manual env update (see below).

---

## First-Time VPS Setup

```bash
# SSH to VPS
ssh root@169.239.180.49

# Clone repo
mkdir -p /var/www/suzanneravenall
cd /var/www/suzanneravenall
git clone https://github.com/your-org/suzanneravenall suzanneravenall
cd suzanneravenall/infra

# Create .env from example and fill in real values
cp .env.example .env
nano .env

# Create databases that don't auto-create
docker compose -f docker-compose.yml up -d postgres
sleep 10
docker exec suzanneravenall_postgres_1 psql -U medusa -c "CREATE DATABASE payload;"
docker exec suzanneravenall_postgres_1 psql -U medusa -c "CREATE DATABASE n8n;"
docker exec suzanneravenall_postgres_1 psql -U medusa -c "CREATE DATABASE calcom;"

# Start all services
docker compose -f docker-compose.yml up -d --build

# Run Medusa DB migration (first time only)
docker exec suzanneravenall_medusa_1 node_modules/.bin/medusa db:migrate
```

---

## Updating Environment Variables on VPS

Environment variables are NOT deployed via git — they live only in `infra/.env` on the VPS.

```bash
ssh root@169.239.180.49
cd /var/www/suzanneravenall/suzanneravenall/infra
nano .env   # edit the file

# After changing NEXT_PUBLIC_* vars — must rebuild the web container
# (these are baked into the browser bundle at build time)
docker compose -f docker-compose.yml build web
docker compose -f docker-compose.yml up -d web

# After changing Payload vars (PAYLOAD_URL, PAYLOAD_DATABASE_URL, PAYLOAD_SECRET)
docker compose -f docker-compose.yml build payload
docker compose -f docker-compose.yml up -d payload

# After changing Medusa vars (MEDUSA_DATABASE_URL, JWT_SECRET, ADMIN_CORS etc.)
docker compose -f docker-compose.yml up -d medusa   # Medusa is not rebuilt — env only
```

---

## Key Variable Notes

| Variable | Container | How it's used |
|----------|-----------|---------------|
| `MEDUSA_DATABASE_URL` | medusa | Mapped to `DATABASE_URL` by docker-compose → read by medusa-config.js |
| `PAYLOAD_DATABASE_URL` | payload | Mapped to `DATABASE_URL` by docker-compose → read by payload.config.ts |
| `PAYLOAD_URL` | payload | Sets Payload's `serverURL` — used in redirects and absolute URLs |
| `NEXT_PUBLIC_MEDUSA_URL` | web (build arg) | Baked into browser bundle — must be a URL browsers can reach |
| `NODE_ENV` | payload | Payload container reads this from .env via docker-compose |

### NEXT_PUBLIC_MEDUSA_URL

The Medusa JS SDK appends `/store` or `/admin` to this base URL. Nginx rewrites `/api/store/*` → `/store/*` before proxying to Medusa. So:

- **IP testing**: `http://169.239.180.49/api`
- **Production (after DNS cutover)**: `https://suzanneravenall.com/api`

Never set this to an internal Docker hostname like `http://medusa:9000` — the browser cannot resolve it.

### PAYLOAD_URL

Must match the URL where Payload admin is actually accessible:

- **IP testing**: `http://169.239.180.49/cms`
- **Production (after DNS cutover)**: `https://suzanneravenall.com/cms`

A mismatch causes React hydration error #418 and broken login redirects.

---

## DNS Cutover Checklist

When pointing `suzanneravenall.com` DNS to the VPS:

1. Enable SSL via Certbot:
   ```bash
   cd /var/www/suzanneravenall/suzanneravenall/infra
   bash scripts/ssl-init.sh
   ```

2. Swap Nginx config:
   ```bash
   # Disable IP testing config, enable production config
   mv nginx/conf.d/ip-testing.conf nginx/conf.d/ip-testing.conf.disabled
   mv nginx/conf.d/suzanneravenall.conf.disabled nginx/conf.d/suzanneravenall.conf
   docker compose -f docker-compose.yml restart nginx
   ```

3. Update `.env` on VPS:
   ```
   PAYLOAD_URL=https://suzanneravenall.com/cms
   NEXT_PUBLIC_MEDUSA_URL=https://suzanneravenall.com/api
   ADMIN_CORS=http://localhost:7001,http://169.239.180.49,https://suzanneravenall.com
   STORE_CORS=http://localhost:3000,http://169.239.180.49,https://suzanneravenall.com
   AUTH_CORS=http://localhost:7001,http://localhost:3000,http://169.239.180.49,https://suzanneravenall.com
   ```

4. Rebuild web and payload containers (env vars changed):
   ```bash
   docker compose -f docker-compose.yml build web payload
   docker compose -f docker-compose.yml up -d --remove-orphans
   ```

5. Verify:
   ```bash
   curl -sf https://suzanneravenall.com/api/store/health
   curl -sf https://suzanneravenall.com/cms/admin | head -20
   ```

---

## Useful Commands

```bash
# View all service status
docker compose -f docker-compose.yml ps

# View logs for a service
docker compose -f docker-compose.yml logs -f payload

# Rebuild a single service
docker compose -f docker-compose.yml build <service>
docker compose -f docker-compose.yml up -d <service>

# Full rebuild and restart
docker compose -f docker-compose.yml build web payload
docker compose -f docker-compose.yml up -d --remove-orphans
docker system prune -f

# Run Medusa DB migration manually (if needed)
docker exec $(docker compose -f docker-compose.yml ps -q medusa) node_modules/.bin/medusa db:migrate

# Check Medusa health
curl http://localhost:9000/health   # from inside VPS

# Check Payload health
curl http://localhost:3001/admin    # from inside VPS
```

---

## Supabase Auth Setup

These settings must be configured manually in the Supabase dashboard at
**https://supabase.com/dashboard/project/mjhwonoekokxyisfljtj/auth/providers**

### Required settings

| Setting | Value |
|---------|-------|
| Email provider | Enabled (should already be on) |
| Email / magic link | Enabled |
| Email confirmation | Required — do NOT disable |
| Minimum password length | 8 characters |

### Site URL

Set in **Authentication → URL Configuration → Site URL**:

- **IP testing**: `http://169.239.180.49`
- **Production (after DNS cutover)**: `https://suzanneravenall.com`

### Redirect URLs (allow-list)

Add all of these in **Authentication → URL Configuration → Redirect URLs**:

```
http://169.239.180.49/portal/callback
https://suzanneravenall.com/portal/callback
http://localhost:3000/portal/callback
```

Without these entries, magic links and email confirmations will be blocked by Supabase.

### Email templates

Supabase uses its own built-in email templates for confirmation, magic link, and password reset.
These can be customised in **Authentication → Email Templates**.
The `{{ .ConfirmationURL }}` variable already contains the correct redirect URL from the allow-list above.

### After DNS cutover

Update Site URL to `https://suzanneravenall.com` in the Supabase dashboard.
No code changes required — the redirect URL is already in the allow-list.

---

## Cal.com Webhook Setup

Cal.com must send booking events to the Next.js webhook handler, which verifies the signature and forwards to n8n.

### Step 1 — Generate a webhook secret

```bash
openssl rand -hex 32
```

Add the output as `CALCOM_WEBHOOK_SECRET` in `infra/.env`.

### Step 2 — Register the webhook in Cal.com

1. Go to **Cal.com → Settings → Developer → Webhooks**
2. Click **New Webhook**
3. Set the webhook URL:
   - **IP testing**: `http://169.239.180.49/api/webhooks/calcom`
   - **Production**: `https://suzanneravenall.com/api/webhooks/calcom`
4. Enable events: **BOOKING_CREATED**, **BOOKING_CANCELLED**
5. Copy the secret Cal.com shows you into `CALCOM_WEBHOOK_SECRET` (or use your own — must match)

### Step 3 — Activate the n8n workflow

Import `infra/n8n/workflows/calcom-booking-to-vtiger.json` into n8n and activate it.

### Step 4 — Verify

Book a test meeting in Cal.com and confirm:
- The web app receives the webhook (check web container logs)
- n8n receives the forwarded payload (check n8n execution history)
- A new Activity appears in Vtiger under the booker's contact

---

## Troubleshooting

### Payload admin loads unstyled / hydration error #418
- Check `PAYLOAD_URL` in `.env` matches the URL you're accessing `/cms` at
- Check `basePath: '/cms'` is in `apps/payload/next.config.ts` (committed, not just working copy)
- Rebuild payload container after fixing

### Medusa admin loads unstyled
- Medusa admin is served at `/medusa` — ensure Nginx `location /medusa` proxies to `medusa:9000`
- Check `medusa-config.js` has `admin.path: "/medusa"`

### Login redirect broken (Payload or Medusa)
- Payload: `PAYLOAD_URL` must match the actual access URL — mismatch causes server/client URL divergence
- Medusa: Check `/auth` Nginx location has `proxy_cookie_flags connect.sid nosecure` during HTTP testing phase

### NEXT_PUBLIC_MEDUSA_URL baked as wrong value
- This requires a full `docker compose build web` — env-only restart is not enough
- Verify the value was correct at build time: check `docker inspect` on the web container's build args
