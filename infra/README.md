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

```bash
# Start all services (production config)
docker compose up -d

# Stop all services
docker compose down

# View live logs for a specific service
docker compose logs -f web
docker compose logs -f medusa
docker compose logs -f postgres

# Rebuild a single service after code changes
docker compose up -d --build web
docker compose up -d --build medusa

# Check health and status of all containers
docker compose ps

# Start with local development overrides (bind mounts + exposed ports)
docker compose -f docker-compose.yml -f docker-compose.override.yml up -d
```

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
docker compose ps nginx
```

3. Issue certificates for all domains:

```bash
bash infra/scripts/ssl-init.sh
```

4. Once all certificates are issued, restart nginx:

```bash
docker compose restart nginx
```

5. Renewal runs automatically if certbot is configured with a cron job or systemd timer. To renew manually:

```bash
docker compose exec nginx certbot renew
```

6. Create the staging `.htpasswd` file for HTTP Basic Auth:

```bash
htpasswd -c /etc/nginx/.htpasswd staging_username
```
