---
name: Project context
description: Platform rebuild for Dr. Suzanne Ravenall — tech stack, hosting, and monorepo shape
type: project
---

Full coaching business platform for Dr. Suzanne Ravenall. Next.js 14 App Router frontend in `apps/web`, Medusa.js v2 commerce in `apps/medusa`, Payload CMS in `apps/payload`. Shared UI components in `packages/ui`, DB migrations in `packages/database`. Turborepo monorepo. Self-hosted on a single VPS with Docker Compose + Nginx — NOT Vercel. CI/CD via GitHub Actions pushing to VPS. Supabase for auth/database/storage.

**Why:** Monorepo self-hosted setup means Vercel-specific patterns (edge config, Vercel env dashboard) are never correct here. Docker Compose health checks must work against the `/api/health` endpoint. Shared UI package content paths must be included in Tailwind config.
