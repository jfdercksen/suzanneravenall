# Infrastructure

Docker Compose stack for suzanneravenall.com.

## Prerequisites

- Docker 24+ with the Compose plugin (`docker compose version`)
- At least 4 GB of free RAM on the host

## First-time setup

```bash
cp infra/.env.example infra/.env
# Open infra/.env and replace every "change_me_*" placeholder with real values
```

## Day-to-day commands

All commands are run from the `infra/` directory.

**On the VPS (production) — always use `-f docker-compose.yml` explicitly:**
```bash
# Start all services
docker compose -f docker-compose.yml up -d

# Stop all services
docker compose -f docker-compose.yml down

# View live logs for a specific service
docker compose -f docker-compose.yml logs -f web
docker compose -f docker-compose.yml logs -f medusa
docker compose -f docker-compose.yml logs -f postgres

# Rebuild a single service after code changes
docker compose -f docker-compose.yml up -d --build web
docker compose -f docker-compose.yml up -d --build medusa

# Check health and status of all containers
docker compose -f docker-compose.yml ps
```

**Locally (dev machine) — add the local override file for bind mounts and exposed ports:**
```bash
# Start all services with hot reload and exposed ports
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d

# Stop all services
docker compose -f docker-compose.yml -f docker-compose.local.yml down
```

> `docker-compose.local.yml` adds bind mounts (hot reload) and exposes Postgres and MeiliSearch ports to the host. It must NEVER be loaded on the VPS.

## Services and ports

| Service | Internal port | Publicly routed via Nginx |
|---------|--------------|--------------------------|
| web | 3000 | suzanneravenall.com |
| medusa | 9000 | suzanneravenall.com/api/store, /api/admin |
| payload | 3001 | suzanneravenall.com/cms |
| meilisearch | 7700 | Internal only |
| n8n | 5678 | n8n.suzanneravenall.com |
| calcom | 3002 | cal.suzanneravenall.com |
| postgres | 5432 | Internal only (exposed to host in dev override) |

## SSL Setup

Run once on the VPS after the nginx container is up and port 80 is reachable.

1. SSH into the VPS.

2. Ensure Docker is running and the nginx container is up:

```bash
docker compose -f docker-compose.yml ps nginx
```

3. Issue certificates for all domains:

```bash
bash infra/scripts/ssl-init.sh
```

4. Once all certificates are issued, restart nginx:

```bash
docker compose -f docker-compose.yml restart nginx
```

5. Renewal runs automatically if certbot is configured with a cron job or systemd timer. To renew manually:

```bash
docker compose -f docker-compose.yml exec nginx certbot renew
```
