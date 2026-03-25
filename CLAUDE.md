# Suzanne Ravenall — Full Platform Rebuild

## Project Overview

Full coaching business platform for Dr. Suzanne Ravenall (suzanneravenall.com), built by Ai Dynamic Advisory. Covers public website, e-commerce, membership portal, community, scheduling, CRM, and accounting in a self-hosted monorepo.

- **Live Site**: https://suzanneravenall.com
- **Client**: Dr. Suzanne Ravenall
- **Agency**: Ai Dynamic Advisory

---

## Monorepo Structure

```
suzanne-ravenall/
├── apps/
│   ├── web/                    # Next.js 14 frontend (App Router)
│   ├── medusa/                 # Medusa.js v2 commerce backend
│   └── payload/                # Payload CMS
├── packages/
│   ├── ui/                     # Shared React components
│   ├── database/               # Supabase schema, migrations, RLS policies
│   └── config/                 # Shared TypeScript, Tailwind, ESLint configs
├── infra/
│   ├── docker-compose.yml      # All services
│   ├── nginx/                  # Reverse proxy config
│   └── scripts/                # Deployment, backup, migration scripts
├── .claude/
│   ├── agents/                 # Agent definition files
│   └── skills/                 # Skill definition files
├── .env.example
├── CLAUDE.md
└── settings.json
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 App Router + TypeScript + Tailwind CSS |
| CMS | Payload CMS (self-hosted) |
| Commerce | Medusa.js v2 |
| Database / Auth / Storage | Supabase (PostgreSQL, Auth, Storage) |
| Scheduling | Cal.com (self-hosted) |
| CRM | Vtiger (self-hosted, sales pipeline only) |
| Accounting | Sage Business Cloud SA API (OAuth 2.0, JSON REST API) |
| Payments | PayFast + PayPal via Medusa payment plugins |
| Email | Resend |
| Marketing | Vibe Marketing (Ai Dynamic Advisory — Next.js + Supabase + Claude + n8n) |
| Search | MeiliSearch (self-hosted) |
| Community | Discourse (self-hosted, SSO via Supabase Auth) |
| Video | Bunny Stream |
| Automation | n8n (self-hosted, replaces Zapier) |
| PDF Generation | react-pdf |
| Analytics | GA4 + Microsoft Clarity |
| CDN / Security | Cloudflare |
| Monitoring | Sentry |
| Backups | Backblaze B2 + pg_dump (automated daily) |
| Hosting | Single VPS — Docker Compose + Nginx |
| CI/CD | GitHub Actions (push to main → auto deploy to VPS) |

**Key API docs:**
- Sage API: https://www.sage.com/en-za/sage-business-cloud/accounting/developer-api/
- Resend: https://resend.com/docs
- Bunny Stream: https://docs.bunny.net/docs/stream-getting-started

---

## Deployment

**This project is NOT deployed to Vercel.** Everything runs on a single VPS using Docker Compose. Nginx is the reverse proxy. SSL via Certbot. All services communicate internally on the Docker network. Local dev environment mirrors production exactly via Docker Compose.

```bash
# Deploy to VPS
git push origin main
# GitHub Actions handles the rest — SSH to VPS, docker compose pull, docker compose up -d
```

---

## Environments

| Environment | Branch | Domain | Purpose |
|---|---|---|---|
| Local | feature/* | localhost | Development and testing |
| Staging | staging | staging.suzanneravenall.com | Client review and feedback |
| Production | main | suzanneravenall.com | Live site |

### Branch workflow
```
feature/task-name
↓ PR reviewed and approved
staging branch
↓ Auto-deploys to staging VPS
↓ Suzanne reviews and approves
main branch
↓ Auto-deploys to production VPS
```

### Local development
```bash
# Start all services locally
docker-compose up -d

# View logs
docker-compose logs -f web

# Stop everything
docker-compose down

# Rebuild after dependency changes
docker-compose up -d --build web
```

### GitHub Secrets required
Add these in GitHub → Settings → Secrets and variables → Actions:

**Staging secrets:**
- `STAGING_VPS_HOST`
- `STAGING_VPS_USER`
- `STAGING_SSH_PRIVATE_KEY`
- `STAGING_NEXT_PUBLIC_SITE_URL`
- `STAGING_NEXT_PUBLIC_SUPABASE_URL`
- `STAGING_NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `STAGING_NEXT_PUBLIC_MEDUSA_URL`

**Production secrets:**
- `VPS_HOST`
- `VPS_USER`
- `SSH_PRIVATE_KEY`
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_MEDUSA_URL`

**Shared secrets:**
- `RESEND_API_KEY` (for deployment notifications)

---

## MCP Connections

### Supabase MCP
Direct database schema changes, RLS policies, and storage management from Claude Code.
Docs: https://supabase.com/docs/guides/ai/mcp

### GitHub MCP
Repo, PR, and branch management.
Docs: https://github.com/github/github-mcp-server

### n8n MCP
Creating and managing automation workflows.
Docs: https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.mcp/

### Cloudflare MCP
DNS, WAF rules, and cache management.
Docs: https://developers.cloudflare.com/agents/

---

## Route Map — apps/web

| Route | File | Purpose |
|-------|------|---------|
| `/` | `app/page.tsx` | Homepage |
| `/about` | `app/about/page.tsx` | About Dr. Ravenall |
| `/services` | `app/services/page.tsx` | Services overview |
| `/shop` | `app/shop/page.tsx` | Product catalogue |
| `/shop/[slug]` | `app/shop/[slug]/page.tsx` | Individual product/program page |
| `/blog` | `app/blog/page.tsx` | Blog and resources |
| `/blog/[slug]` | `app/blog/[slug]/page.tsx` | Individual post |
| `/contact` | `app/contact/page.tsx` | Contact + Cal.com booking |
| `/portal` | `app/portal/page.tsx` | Member portal dashboard |
| `/portal/resources` | `app/portal/resources/page.tsx` | Member resource library |
| `/portal/videos` | `app/portal/videos/page.tsx` | Gated video content |
| `/portal/community` | `app/portal/community/page.tsx` | Discourse forum embed |

---

## Component Conventions

- Filename: `PascalCase.tsx` (e.g., `HeroSection.tsx`)
- Default export for page-level components
- Named export for shared utility components
- `"use client"` only when the component needs browser APIs or React state/effects
- Shared components live in `packages/ui/` — app-specific components in `apps/web/components/`

---

## Data Fetching

- Server Components for data that doesn't change per user
- `"use client"` + `useState`/`useEffect` for interactive/real-time data
- API routes at `app/api/[route]/route.ts` for backend logic
- Medusa storefront API for commerce data
- Supabase client for auth-gated member content

---

## Environment Variables

| Variable | Exposed to Browser | Purpose |
|----------|-------------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | No | Supabase service role — server only |
| `NEXT_PUBLIC_MEDUSA_URL` | Yes | Medusa storefront URL |
| `MEDUSA_BACKEND_URL` | No | Medusa backend URL — server only |
| `DATABASE_URL` | No | Direct PostgreSQL connection string |
| `NEXT_PUBLIC_SITE_URL` | Yes | Base URL |
| `RESEND_API_KEY` | No | Resend email API — server only |
| `PAYFAST_MERCHANT_ID` | No | PayFast merchant ID |
| `PAYFAST_MERCHANT_KEY` | No | PayFast merchant key |
| `PAYFAST_PASSPHRASE` | No | PayFast passphrase |
| `PAYPAL_CLIENT_ID` | No | PayPal client ID |
| `PAYPAL_CLIENT_SECRET` | No | PayPal client secret |
| `SAGE_CLIENT_ID` | No | Sage API OAuth client ID |
| `SAGE_CLIENT_SECRET` | No | Sage API OAuth client secret |
| `BUNNY_STREAM_API_KEY` | No | Bunny Stream API key |
| `BUNNY_STREAM_LIBRARY_ID` | No | Bunny Stream library ID |
| `SENTRY_DSN` | No | Sentry error tracking DSN |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Yes | Google Analytics 4 measurement ID |
| `MEILISEARCH_HOST` | No | MeiliSearch host URL |
| `MEILISEARCH_ADMIN_KEY` | No | MeiliSearch admin API key |
| `N8N_WEBHOOK_SECRET` | No | Shared secret for n8n webhook verification |
| `VTIGER_URL` | No | Vtiger CRM instance URL |
| `VTIGER_USERNAME` | No | Vtiger username |
| `VTIGER_ACCESS_KEY` | No | Vtiger access key |
| `ANTHROPIC_API_KEY` | No | Claude API — server only |

### Adding an environment variable
1. Add to `.env.local` with real value
2. Add placeholder to `.env.example`
3. Add to VPS environment (via `.env` file or Docker Compose `environment:` block)

---

## Git Workflow

- `feature/description` — new features
- `fix/description` — bug fixes
- `infra/description` — infrastructure and Docker changes
- `integration/description` — third-party service integrations
- Run `npm run build` in `apps/web` before merging to main

---

## Build Workflow

For every non-trivial change (new component, route, API route, Docker service, integration):

1. **Write** — Implement the code
2. **Review** — Spawn `code-reviewer` agent. Reports issues, does NOT fix them.
3. **QA (unit)** — Spawn `qa-unit` agent to generate and run Vitest tests. Reports results, does NOT fix them.
4. **QA (visual)** — Spawn `qa-visual` agent to screenshot and compare against reference. Reports differences, does NOT fix them.
5. **Fix** — Apply all fixes from review and QA reports
6. **Build check** — `npm run build` in `apps/web` — fix any errors
7. **Ship** — Only after review passes, tests pass, build succeeds, and visual QA passes

Spawn `code-reviewer` + `qa-unit` + `qa-visual` in parallel when they cover independent concerns.

For unfamiliar integrations, spawn `research` agent first.

---

## Available Agents

| Agent | Purpose |
|-------|---------|
| `code-reviewer` | TypeScript/React/Node.js code review (correctness, security, patterns) |
| `qa-unit` | Vitest unit and integration tests |
| `qa-visual` | Screenshot and visual comparison |
| `research` | Docs, APIs, and patterns research |
| `devops-agent` | Docker, Nginx, VPS, CI/CD, SSL |
| `backend-agent` | Medusa modules, Supabase schema, API integrations |
| `integration-agent` | Sage API, Vtiger webhooks, PayFast, n8n workflows |
| `migration-agent` | WooCommerce and Wild Apricot data migration |
| `security-agent` | Supabase RLS policies, API authentication, Cloudflare WAF rules |

---

## Available Skills

| Skill | Purpose |
|-------|---------|
| `add-component` | New React component |
| `add-route` | New Next.js App Router page |
| `add-api-route` | New API route handler |
| `design-from-reference` | Build page from screenshot or brief |
| `screenshot-compare` | Visual comparison against reference |
| `add-supabase-table` | New table with schema, migration, and RLS policies |
| `add-medusa-module` | New Medusa v2 custom module or plugin |
| `add-n8n-workflow` | New n8n automation workflow |
| `add-docker-service` | New service in Docker Compose |
| `add-rls-policy` | New Supabase Row Level Security policy |
| `add-webhook` | New webhook handler between services |
| `add-email-template` | New Resend email template |
| `add-payment-provider` | New Medusa payment provider plugin |

---

## Common Tasks

### Add a new page
Create `apps/web/app/[route]/page.tsx` and add it to the route map above.

### Add a new component
- Shared across apps: `packages/ui/src/ComponentName.tsx`
- Web-app only: `apps/web/components/ComponentName.tsx`

### Add a new Supabase table
Use the `add-supabase-table` skill — generates schema, migration SQL, and RLS policies.

### Add a new Medusa module
Use the `add-medusa-module` skill — scaffolds the module directory, service, and registration.

### Add a new Docker service
Use the `add-docker-service` skill — adds the service to `infra/docker-compose.yml` and Nginx config.

### Add an n8n workflow
Use the `add-n8n-workflow` skill — generates the workflow JSON and webhook handler.
