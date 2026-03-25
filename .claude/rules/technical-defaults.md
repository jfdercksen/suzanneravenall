## Framework & Language
- Framework: Next.js 14 App Router (never Pages Router)
- Language: TypeScript always — no `any` types, no `// @ts-ignore`
- Monorepo: Turborepo — run tasks from root with `turbo run build`, `turbo run dev`

## Frontend (apps/web)
- Styling: Tailwind CSS installed package — never CDN, never inline styles
- Components: Server Components by default — add `"use client"` only when strictly needed (state, effects, browser APIs)
- Fonts: `next/font` — never a `<link>` tag to Google Fonts
- Images: `next/image` — never a bare `<img>` tag
- Links: `next/link` — never a bare `<a>` tag for internal navigation
- API routes: `app/api/<route>/route.ts` — always validate input, always wrap in try/catch
- Responsive: Mobile-first always — Suzanne's audience is 60%+ mobile
- Environment variables: `NEXT_PUBLIC_` prefix only for values safe to expose to the browser — never expose secrets

## Backend (apps/medusa)
- Medusa.js v2 — always use v2 module architecture, never v1 patterns
- Docs: https://docs.medusajs.com/
- All custom modules go in `apps/medusa/src/modules/`
- All custom API routes go in `apps/medusa/src/api/`
- Database: Supabase PostgreSQL — Medusa connects via DATABASE_URL environment variable
- Never use Medusa Cloud — this is self-hosted

## CMS (apps/payload)
- Payload CMS 3.x — always use the latest v3 App Router integration
- Docs: https://payloadcms.com/docs
- Collections go in `apps/payload/src/collections/`
- All content types must have proper access control configured

## Database (Supabase)
- All schema changes must go through migrations in `packages/database/migrations/`
- Never modify the database directly without a migration file
- Every table that contains user data MUST have Row Level Security (RLS) enabled
- Use Supabase MCP for direct schema changes from Claude Code
- Docs: https://supabase.com/docs
- RLS docs: https://supabase.com/docs/guides/database/postgres/row-level-security

## Authentication
- Supabase Auth is the single identity source for the entire platform
- Never build a custom auth system
- Member portal access is controlled via Supabase RLS policies tied to membership tier
- Discourse SSO connects via Supabase Auth — docs: https://meta.discourse.org/t/discourse-sso-provider/32511

## Payments
- PayFast (primary — South Africa): https://developers.payfast.co.za/docs
- PayPal (international): https://developer.paypal.com/docs/
- Both implemented as Medusa payment provider plugins
- Never store raw card data — always use the payment provider tokenisation

## Email
- Resend for all transactional email — docs: https://resend.com/docs
- Never use nodemailer, sendgrid, or any other email provider
- All email templates use React Email — docs: https://react.email/docs
- Templates go in `packages/ui/emails/`

## Video
- Bunny Stream for all gated video delivery — docs: https://docs.bunny.net/docs/stream-getting-started
- Never store video files in Supabase Storage — Supabase controls access rights, Bunny delivers the stream
- Bunny Stream embed URLs must be validated server-side before returning to client

## Search
- MeiliSearch for all product and content search — docs: https://www.meilisearch.com/docs
- Index updates triggered via n8n workflows on content change
- Never use Algolia or Elasticsearch

## Automation
- n8n for all workflow automation — docs: https://docs.n8n.io
- n8n replaces all Zapier workflows
- Webhook handlers go in `apps/web/app/api/webhooks/`
- Always validate webhook signatures before processing

## Hosting & Deployment
- Hosting: Single VPS — Docker Compose + Nginx (NOT Vercel, NOT Netlify)
- All services run in Docker containers defined in `infra/docker-compose.yml`
- Nginx is the reverse proxy — config in `infra/nginx/`
- SSL via Certbot — auto-renewal configured
- CI/CD: GitHub Actions — push to main auto-deploys to VPS via SSH
- Never run `vercel` commands — deployment is always via `git push origin main`
- Local dev must mirror production exactly — always use Docker Compose locally

## Docker Rules
- Every new service needs a Dockerfile and a docker-compose service definition
- Use named volumes for persistent data (databases, uploads)
- Never use `latest` tag for production images — always pin versions
- All services must define health checks
- Internal service communication uses Docker network hostnames (e.g., `http://medusa:9000`)

## PDF Generation
- react-pdf for all PDF generation (invoices, certificates, receipts)
- Docs: https://react-pdf.org/
- PDFs generated server-side only — never in the browser
- PDF templates go in `packages/ui/pdfs/`

## Monitoring & Error Tracking
- Sentry for all error tracking — docs: https://docs.sentry.io/
- Initialise Sentry in both Next.js and Medusa
- Never swallow errors silently — always log to Sentry in catch blocks

## Security Rules
- Never commit secrets — use `.env.local` locally, environment variables in CI/CD
- Never log sensitive data (passwords, tokens, card numbers)
- All API routes must validate and sanitise input
- All webhook endpoints must verify signatures
- Cloudflare WAF sits in front of everything — docs: https://developers.cloudflare.com/waf/

## Code Quality
- Run `turbo run build` before any deployment — never deploy a broken build
- TypeScript strict mode enabled — no type errors allowed
- All new API routes must have unit tests via Vitest
- Spawn `code-reviewer` agent on every non-trivial change before shipping
