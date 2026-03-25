---
name: add-docker-service
description: Add a new service to the Docker Compose stack. Use when any new self-hosted service needs to be added to the platform — database, tool, or application. Always pin versions, define health checks and use named volumes.
allowed-tools: Bash, Read, Write, Edit, Glob, Grep
---

# Add Docker Service

## Goal
Add a new containerised service to the platform's Docker Compose stack following production-ready standards.

## Inputs
- Service name
- Docker image and version to use
- Ports needed (internal and external if any)
- Environment variables required
- Persistent data volumes needed
- Which other services it depends on

## Key References
- Docker Compose docs: https://docs.docker.com/compose/compose-file/
- Docker Hub: https://hub.docker.com/
- Docker health checks: https://docs.docker.com/engine/reference/builder/#healthcheck

## Project Structure
- Docker Compose file: `infra/docker-compose.yml`
- Nginx config: `infra/nginx/conf.d/`
- Environment template: `.env.example`

## Process

### Step 1 — Research the image
Spawn research agent:
"Find the official Docker image for {service}. Confirm the latest stable version tag, required environment variables, default ports and recommended volume mounts. Check https://hub.docker.com for official image documentation."

### Step 2 — Add service to docker-compose.yml
```yaml
# Add inside the services: block
{service-name}:
  image: {image}:{pinned-version}  # never use latest
  container_name: suzanne_{service_name}
  restart: unless-stopped
  environment:
    - ENV_VAR=${ENV_VAR}
  volumes:
    - {service_name}_data:/path/in/container  # named volume always
  networks:
    - suzanne_network
  depends_on:
    - {dependency-service}
  healthcheck:
    test: ["CMD", "{health-check-command}"]
    interval: 30s
    timeout: 10s
    retries: 3
    start_period: 40s
  deploy:
    resources:
      limits:
        memory: 512M
        cpus: '0.5'

# Add at bottom of volumes: block
{service_name}_data:
  driver: local
```

### Step 3 — Add Nginx config (if service needs external access)
File: `infra/nginx/conf.d/{service-name}.conf`
```nginx
server {
    listen 80;
    server_name {subdomain}.suzanneravenall.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name {subdomain}.suzanneravenall.com;

    ssl_certificate /etc/letsencrypt/live/suzanneravenall.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/suzanneravenall.com/privkey.pem;

    location / {
        proxy_pass http://{service-name}:{port};
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Step 4 — Add environment variables to .env.example
Document every variable the new service needs.

### Step 5 — Validate config
```bash
docker-compose config
```
Fix any syntax errors before proceeding.

### Step 6 — Test locally
```bash
docker-compose up -d {service-name}
docker-compose ps
docker-compose logs {service-name}
```

### Step 7 — Spawn devops-agent for review
Ask devops-agent to review the new service definition.

## Rules
- Never use latest tag — always pin to a specific version
- Every service must have a health check
- Every service must use named volumes for persistent data — never bind mounts
- Every service must define memory and CPU limits
- All services connect to suzanne_network — never expose databases externally
- Internal services (databases, search) must NOT have external port mappings
- Always document rollback: `docker-compose stop {service} && docker-compose rm {service}`

## Output Format
Always report:
- Service added and image version pinned
- Ports exposed (internal only or external)
- Volumes created
- Environment variables added to .env.example
- Nginx config added (if applicable)
- DNS record needed in Cloudflare (if applicable)
- Health check status after local test
