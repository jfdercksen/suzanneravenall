# Restore Procedure — suzanneravenall.com

This document covers every restore scenario from a single database table to a
full VPS rebuild from scratch.

---

## Prerequisites

- SSH access to the VPS (or a replacement VPS if the original is gone)
- Backblaze B2 credentials (B2_KEY_ID and B2_APPLICATION_KEY from your secrets store)
- b2 CLI installed: `pip3 install b2`
- `pg_dump` / `psql` available: `apt-get install -y postgresql-client`

Authorise the b2 CLI before running any restore command:

```bash
b2 authorize-account <B2_KEY_ID> <B2_APPLICATION_KEY>
```

---

## 1. List available backups

```bash
# List all daily backup dates
b2 ls suzanneravenall-backups daily/

# List all monthly backup dates
b2 ls suzanneravenall-backups monthly/

# List files for a specific date
b2 ls suzanneravenall-backups daily/2026-03-25/
```

---

## 2. Download a specific backup file

```bash
# Download a specific database dump (adjust date and database name as needed)
b2 file download-file-by-name suzanneravenall-backups \
  daily/2026-03-25/medusa_2026-03-25.sql.gz \
  /tmp/medusa_2026-03-25.sql.gz
```

Available dump files per backup date:

| File | Database |
|------|----------|
| `medusa_YYYY-MM-DD.sql.gz` | Medusa commerce backend |
| `n8n_YYYY-MM-DD.sql.gz` | n8n automation data |
| `payload_YYYY-MM-DD.sql.gz` | Payload CMS content |
| `calcom_YYYY-MM-DD.sql.gz` | Cal.com scheduling data |
| `n8n-workflows_YYYY-MM-DD.json` | n8n workflow definitions |

---

## 3. Restore a PostgreSQL database

Repeat these steps for each database you need to restore, substituting the
database name and the relevant service name.

```bash
# 1. Stop the service that owns the database so there are no active connections
docker compose -f /var/www/suzanneravenall/suzanneravenall/infra/docker-compose.yml stop medusa

# 2. Drop the existing database and recreate it clean
docker compose -f /var/www/suzanneravenall/suzanneravenall/infra/docker-compose.yml \
  exec postgres psql -U medusa -c "DROP DATABASE IF EXISTS medusa;"
docker compose -f /var/www/suzanneravenall/suzanneravenall/infra/docker-compose.yml \
  exec postgres psql -U medusa -c "CREATE DATABASE medusa;"

# 3. Decompress and pipe directly into psql — no large temp file needed
gunzip -c /tmp/medusa_2026-03-25.sql.gz \
  | docker compose -f /var/www/suzanneravenall/suzanneravenall/infra/docker-compose.yml \
      exec -T postgres psql -U medusa -d medusa

# 4. Restart the service
docker compose -f /var/www/suzanneravenall/suzanneravenall/infra/docker-compose.yml start medusa

# 5. Confirm it starts cleanly
docker compose -f /var/www/suzanneravenall/suzanneravenall/infra/docker-compose.yml \
  logs medusa --tail 30
```

Service-to-database mapping:

| Service | Database | Stop command |
|---------|----------|-------------|
| medusa | medusa | `docker compose stop medusa` |
| payload | payload | `docker compose stop payload` |
| n8n | n8n | `docker compose stop n8n` |
| calcom | calcom | `docker compose stop calcom` |

---

## 4. Verify the restore

```bash
# Check row counts across key tables — compare against known baselines
docker compose -f /var/www/suzanneravenall/suzanneravenall/infra/docker-compose.yml \
  exec postgres psql -U medusa -d medusa \
  -c "SELECT schemaname, tablename, n_live_tup FROM pg_stat_user_tables ORDER BY n_live_tup DESC LIMIT 20;"

# Confirm all containers are healthy
docker compose -f /var/www/suzanneravenall/suzanneravenall/infra/docker-compose.yml ps

# Tail application logs for the restored service
docker compose -f /var/www/suzanneravenall/suzanneravenall/infra/docker-compose.yml \
  logs medusa --tail 50
```

---

## 5. Restore n8n workflows from the JSON export

The JSON export contains workflow definitions only, not execution history or
credentials. Credentials are stored encrypted in the n8n database (recovered
by step 3 above). Import this file after the n8n database is already restored.

```bash
# Download the workflow export
b2 file download-file-by-name suzanneravenall-backups \
  daily/2026-03-25/n8n-workflows_2026-03-25.json \
  /tmp/n8n-workflows.json

# Copy into the running n8n container
docker cp /tmp/n8n-workflows.json infra-n8n-1:/tmp/n8n-workflows.json

# Import — this merges workflows, it does not delete existing ones
docker compose -f /var/www/suzanneravenall/suzanneravenall/infra/docker-compose.yml \
  exec n8n n8n import:workflow --input=/tmp/n8n-workflows.json

# Restart n8n to activate imported workflows
docker compose -f /var/www/suzanneravenall/suzanneravenall/infra/docker-compose.yml \
  restart n8n
docker compose -f /var/www/suzanneravenall/suzanneravenall/infra/docker-compose.yml \
  logs n8n --tail 20
```

---

## 6. Full VPS rebuild (complete server loss)

Use this procedure if the original VPS is unrecoverable.

### Step 1 — Provision a new VPS

- Provider: Hetzner (or equivalent)
- Spec: CX32 or above — 8 GB RAM, 4 vCPU, 160 GB SSD
- OS: Ubuntu 22.04 LTS
- Note the new public IP address

### Step 2 — Initial server setup

```bash
ssh root@<new-vps-ip>

# Install Docker
curl -fsSL https://get.docker.com | sh
systemctl enable docker

# Install dependencies
apt-get update && apt-get install -y git python3-pip postgresql-client

# Install b2 CLI
pip3 install b2
```

### Step 3 — Clone the repo and configure environment

```bash
mkdir -p /var/www/suzanneravenall
cd /var/www/suzanneravenall
git clone git@github.com:jfdercksen/suzanneravenall.git
cd suzanneravenall/infra

# Copy the template and fill in all real values
cp .env.example .env
nano .env
```

### Step 4 — Start core infrastructure services

Start only the database and supporting services first so databases exist before
restoring data.

```bash
cd /var/www/suzanneravenall/suzanneravenall/infra
docker compose up -d postgres
# Wait for postgres to pass its health check (~30 seconds)
docker compose ps

# Create the additional databases that Postgres does not create automatically
docker compose exec postgres psql -U medusa -c "CREATE DATABASE n8n;"
docker compose exec postgres psql -U medusa -c "CREATE DATABASE payload;"
docker compose exec postgres psql -U medusa -c "CREATE DATABASE calcom;"
```

### Step 5 — Restore all databases from Backblaze B2

```bash
b2 authorize-account <B2_KEY_ID> <B2_APPLICATION_KEY>

LATEST_DATE="2026-03-25"  # Replace with the most recent backup date from: b2 ls suzanneravenall-backups daily/

for DB in medusa n8n payload calcom; do
  echo "Downloading $DB..."
  b2 file download-file-by-name suzanneravenall-backups \
    "daily/${LATEST_DATE}/${DB}_${LATEST_DATE}.sql.gz" \
    "/tmp/${DB}.sql.gz"

  echo "Restoring $DB..."
  gunzip -c "/tmp/${DB}.sql.gz" \
    | docker compose exec -T postgres psql -U medusa -d "$DB"

  echo "Restored: $DB"
done
```

### Step 6 — Start all remaining application services

```bash
docker compose up -d meilisearch n8n calcom medusa payload web nginx
docker compose ps
```

### Step 7 — Restore n8n workflows

Follow section 5 of this document.

### Step 8 — Obtain SSL certificates

Certbot is managed by the ssl-init script. Run it once DNS is pointing at the
new server.

```bash
bash /var/www/suzanneravenall/suzanneravenall/infra/scripts/ssl-init.sh
docker compose restart nginx
```

### Step 9 — Update DNS in Cloudflare

For each A record pointing to the old VPS IP:

1. Log in to Cloudflare → DNS
2. Update all A records to the new VPS IP
3. Set TTL to Auto (Cloudflare proxied) or 60 seconds if unproxied
4. Propagation is near-instant for Cloudflare-proxied records

Records to update:

| Record | Points to |
|--------|-----------|
| `suzanneravenall.com` | new VPS IP |
| `www.suzanneravenall.com` | new VPS IP |
| `n8n.suzanneravenall.com` | new VPS IP |
| `cal.suzanneravenall.com` | new VPS IP |
| `community.suzanneravenall.com` | new VPS IP |

### Step 10 — Reinstall the backup cron job

```bash
bash /var/www/suzanneravenall/suzanneravenall/infra/scripts/install-backup-cron.sh
b2 authorize-account <B2_KEY_ID> <B2_APPLICATION_KEY>
```

### Step 11 — Verify everything is running

```bash
# All containers should show "healthy"
docker compose ps

# Smoke-test each public endpoint
curl -sI https://suzanneravenall.com | head -3
curl -sI https://n8n.suzanneravenall.com | head -3
curl -sI https://cal.suzanneravenall.com | head -3

# Monitor Sentry for new errors over the next 24 hours
```

---

## Rollback after a bad deployment (no data loss)

If a deployment breaks an application service but the database is intact:

```bash
# On the VPS
cd /var/www/suzanneravenall/suzanneravenall

# Revert to the previous commit
git log --oneline -5          # identify the last good commit hash
git checkout <good-commit>    # or: git revert HEAD

# Rebuild and restart only the affected service
docker compose build medusa
docker compose up -d medusa
docker compose logs medusa --tail 20
```

---

## Contact

If you cannot recover from this guide, contact the infrastructure owner at
Ai Dynamic Advisory. All secrets are stored in the project's secure secrets
manager — do not attempt to regenerate them without coordination as some
(e.g., Supabase JWT secret, PayFast keys) are tied to live third-party accounts.
