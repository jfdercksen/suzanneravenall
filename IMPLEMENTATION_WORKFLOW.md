# Suzanne Ravenall Platform — Master Implementation Workflow
## Ai Dynamic Advisory | Claude Code Build Guide

This document is the single source of truth for building the platform. Development follows a three-environment workflow — build locally, deploy to staging for Suzanne to review, then promote to production after sign-off. Never push directly to main without staging approval.

---

## Three-Environment Workflow

| Environment | Branch | Domain | Who uses it |
|---|---|---|---|
| Local | feature/* | localhost | Developers — build and test |
| Staging | staging | staging.suzanneravenall.com | Suzanne — review and feedback |
| Production | main | suzanneravenall.com | Live site — real users |

### Daily development flow

1. **Create feature branch from staging**
   ```bash
   git checkout staging && git pull
   git checkout -b feature/task-name
   ```

2. **Build and test locally**
   ```bash
   docker-compose up -d
   # develop, test, iterate
   ```

3. **Push to staging for client review**
   ```bash
   git checkout staging
   git merge feature/task-name
   git push origin staging
   # GitHub Actions auto-deploys to staging VPS
   # You receive email confirmation when deploy is ready
   ```

4. **Share staging link with Suzanne**
   - URL: https://staging.suzanneravenall.com
   - Credentials: Basic auth — share username/password with Suzanne only
   - Suzanne reviews and gives feedback
   - If changes needed: fix on feature branch, merge back to staging
   - If approved: proceed to step 5

5. **Promote to production (after sign-off only)**
   ```bash
   git checkout main
   git merge staging
   git push origin main
   # GitHub Actions auto-deploys to production VPS
   ```

### Local development commands
```bash
# Start all services
docker-compose up -d

# Watch logs for a specific service
docker-compose logs -f web
docker-compose logs -f medusa

# Restart a single service after code change
docker-compose restart web

# Rebuild after adding dependencies
docker-compose up -d --build web

# Stop everything
docker-compose down

# Full reset including volumes (WARNING: deletes local data)
docker-compose down -v
```

### Staging access for Suzanne
- URL: https://staging.suzanneravenall.com
- Protected by HTTP Basic Auth — share credentials securely
- Staging uses its own Supabase project and Medusa database
- Payments use sandbox credentials only — no real charges on staging
- Resend emails on staging go to test addresses only

### What gets deployed per phase
Each phase is deployed to staging when complete — not before.
Suzanne reviews and signs off per phase before it promotes to production.

| Phase | What Suzanne reviews on staging |
|---|---|
| Phase 1 | Public website — all pages, design, content, Cal.com booking |
| Phase 2 | Shop, checkout, PayFast sandbox, order emails |
| Phase 3 | Member portal, resource access, Bunny videos, Discourse |
| Phase 4 | Full automation — bookings to Vtiger, Vibe Marketing emails |
| Phase 5 | Full platform — final sign-off before production DNS cutover |

---

## How to Use This Document

### Starting a task
1. Find the task in the relevant phase below
2. Check which agent or skill to use
3. Spawn the agent or invoke the skill with the context provided
4. Wait for confirmation before moving to the next task

### Spawning an agent
Spawn the {agent-name} agent to {task description}.
Context: {relevant details from this document}

### Invoking a skill
Use the {skill-name} skill to {task description}.
Inputs: {inputs listed in the task}

### Running a parallel agent team
Create an agent team with {N} teammates:

Teammate 1: {agent} to handle {task}
Teammate 2: {agent} to handle {task}
Teammate 3: {agent} to handle {task}
Wait for all teammates to complete before proceeding.


---

## Pre-Build Checklist
Complete every item before writing a single line of code.

- [ ] VPS provisioned — minimum 8GB RAM, 4 vCPU, 160GB SSD (Hetzner CX32 recommended)
- [ ] Domain DNS transferred to Cloudflare — suzanneravenall.com
- [ ] GitHub repository created — monorepo structure as per CLAUDE.md
- [ ] Supabase project created — note URL and keys
- [ ] Resend account created — verify sending domain suzanneravenall.com
- [ ] Bunny Stream account created — note API key and library ID
- [ ] Backblaze B2 bucket created — note bucket name and application key
- [ ] Cloudflare account configured — note API token
- [ ] Sage Business Cloud API key requested from Sage SA
- [ ] PayFast merchant account confirmed active — note merchant ID and key
- [ ] PayPal developer sandbox account created
- [ ] Wild Apricot admin access obtained — for member data export
- [ ] WordPress admin access obtained — for product and content migration
- [ ] Vtiger admin access confirmed — for CRM configuration
- [ ] All environment variables collected and added to .env.local
- [ ] Client brand assets received — logo SVG, colours, fonts
- [ ] Staging VPS provisioned — can be smaller than production (Hetzner CX22 is fine for staging)
- [ ] Staging domain configured in Cloudflare — staging.suzanneravenall.com → staging VPS IP
- [ ] Staging SSL certificate issued via Certbot
- [ ] HTTP Basic Auth configured on staging Nginx — credentials shared with Suzanne only
- [ ] Staging Supabase project created (separate from production)
- [ ] GitHub repository environments created — staging and production in GitHub Settings
- [ ] All GitHub Secrets added for both staging and production environments
- [ ] Staging deployment tested — push to staging branch confirms auto-deploy works

---

## PHASE 0 — Foundation and Infrastructure
**Duration:** Week 1 | **Owner:** DevOps developer + all developers setup locally

### Task 0.1 — Monorepo Scaffold
Use the following commands to scaffold the monorepo:
mkdir suzanne-ravenall && cd suzanne-ravenall
git init
npm init -y
npx create-turbo@latest --skip-transforms

Then create these directories manually:

apps/web (Next.js)
apps/medusa (Medusa v2)
apps/payload (Payload CMS)
packages/ui
packages/database
packages/config
infra/docker-compose
infra/nginx
infra/scripts
.claude/agents (already populated)
.claude/skills (already populated)

Copy all agent and skill files into .claude/agents/ and .claude/skills/
Copy CLAUDE.md, settings.json, technical-defaults.md, design-rules.md, workflow.md into root.

### Task 0.2 — Docker Compose Base Stack
Spawn devops-agent to create the base Docker Compose stack.
Context: Create infra/docker-compose.yml with these services in this order:

postgres (Supabase runs externally — this is for Medusa only)
medusa (apps/medusa — port 9000)
web (apps/web — port 3000)
payload (apps/payload — port 3001)
meilisearch (port 7700 — internal only)
n8n (port 5678)
calcom (port 3002)
All services on suzanne_network.
Named volumes for all persistent data.
Health checks on every service.
Resource limits on every service.
Reference: https://docs.docker.com/compose/


### Task 0.3 — Nginx Reverse Proxy
Spawn devops-agent to create Nginx configuration.
Context: Create infra/nginx/conf.d/ with config files for:

suzanneravenall.com → web:3000
suzanneravenall.com/api/store → medusa:9000
suzanneravenall.com/api/admin → medusa:9000
suzanneravenall.com/cms → payload:3001
n8n.suzanneravenall.com → n8n:5678
cal.suzanneravenall.com → calcom:3002
community.suzanneravenall.com → discourse (separate setup)
HTTPS only. HTTP redirects to HTTPS.
Security headers on all servers.
SSL via Certbot — Let's Encrypt.
Reference: https://nginx.org/en/docs/


### Task 0.4 — CI/CD Pipeline
Spawn devops-agent to create GitHub Actions workflow.
Context: Create .github/workflows/deploy.yml
Trigger: push to main branch
Steps:

turbo run build (fail fast)
turbo run test (fail if tests fail)
SSH to VPS using SSH_PRIVATE_KEY secret
git pull origin main
docker-compose pull
docker-compose up -d --remove-orphans
docker system prune -f
Health check — verify all containers are running
Required GitHub secrets: VPS_HOST, VPS_USER, SSH_PRIVATE_KEY
Reference: https://docs.github.com/en/actions


### Task 0.5 — Supabase Schema Foundation
Create an agent team with 2 teammates:
Teammate 1: Use add-supabase-table skill to create core tables:

profiles (id, user_id FK auth.users, full_name, phone, avatar_url, role)
membership_tiers (id, name, slug, description, price_monthly, price_annual, features JSONB)

Teammate 2: Use add-supabase-table skill to create membership tables:

member_subscriptions (id, user_id, tier_id, status, start_date, end_date, medusa_subscription_id)
resources (id, title, description, file_url, resource_type, allowed_tier_ids UUID[], is_published)
video_content (id, title, description, bunny_video_id, bunny_library_id, thumbnail_url, allowed_tier_ids UUID[], duration_seconds, is_published)

All tables must have RLS enabled.
Spawn security-agent to review all RLS policies after creation.

### Task 0.6 — Backup Automation
Spawn devops-agent to create automated backup system.
Context: Create infra/scripts/backup.sh
Daily at 02:00 SAST:

pg_dump Medusa database → compress → upload to Backblaze B2
Sync Supabase storage exports to Backblaze B2
Retention: 30 daily, 12 monthly
Also create infra/scripts/restore.md documenting the restore procedure.
Reference: https://www.backblaze.com/docs/cloud-storage


### Task 0.7 — Sentry Setup
Spawn devops-agent to configure Sentry monitoring.
Context:

Add Sentry DSN to all environment files
Initialise Sentry in apps/web (Next.js) — sentry.client.config.ts and sentry.server.config.ts
Initialise Sentry in apps/medusa
Configure source maps upload in CI/CD pipeline
Reference: https://docs.sentry.io/platforms/javascript/guides/nextjs/


**Phase 0 Sign-off Checklist:**
- [ ] All containers start with docker-compose up -d
- [ ] All health checks passing — docker-compose ps shows healthy
- [ ] Nginx serves correct domains with HTTPS
- [ ] SSL certificates valid
- [ ] GitHub Actions deploys successfully on push to main
- [ ] Supabase tables created with RLS enabled
- [ ] Backup script runs and uploads to Backblaze B2
- [ ] Sentry receiving test events
- [ ] All changes merged to staging branch and deployed to staging VPS
- [ ] Suzanne has reviewed staging and given written sign-off before merging to main

---

## PHASE 1 — Public Website and CMS
**Duration:** Weeks 2–5 | **Owner:** Frontend developer

### Task 1.1 — Next.js App Setup
In apps/web install and configure:

Next.js 14 App Router
TypeScript strict mode
Tailwind CSS
next/font with Suzanne's brand fonts
Sentry SDK
GA4 via next/script
Microsoft Clarity via next/script
Update next.config.ts with:
remotePatterns for Supabase storage and Bunny CDN
Security headers from technical-defaults.md
Strict CSP headers from security-agent patterns


### Task 1.2 — Design System
Create packages/ui/src/tokens.ts with Suzanne's brand design tokens:

Primary: #1A3A5C (dark blue)
Accent: #E8733A (orange)
Background: #F5F5F5
Text: #333333
Font sizes, spacing scale, border radius
Update tailwind.config.ts in packages/config to use these tokens.
These tokens must be used across ALL components — never hardcode colours.
Spawn code-reviewer after creation.


### Task 1.3 — Core Layout and Navigation
Use add-component skill to create:

components/layout/Header.tsx — logo, main navigation, mobile hamburger menu, member portal CTA button
components/layout/Footer.tsx — links, social media, credentials, Ai Dynamic Advisory credit
components/layout/MobileNav.tsx — full screen mobile navigation

Navigation links: Home, About, Services, Programs, Blog, Contact, Member Portal
Header must be sticky with scroll-aware background change.
Mobile-first. Spawn qa-visual after creation.

### Task 1.4 — Homepage
Use design-from-reference skill to build app/page.tsx
Sections required:

Hero — headline, subheadline, primary CTA (book discovery call), secondary CTA (free masterclass)
Trust bar — credentials, years experience, clients helped stats
Services overview — 1-on-1, group programs, practitioner licensing (3 cards)
Featured programs — top 3 programs with price and CTA
Testimonials — 3 video/text testimonials with results
About teaser — Suzanne photo, 2-sentence bio, link to About page
Lead magnet — free masterclass signup with Vibe Marketing email capture
Final CTA — book discovery call via Cal.com

Mobile-first. Target 90+ PageSpeed.
Spawn code-reviewer + qa-visual in parallel after build.

### Task 1.5 — Core Pages
Create an agent team with 3 teammates building pages in parallel:
Teammate 1: Use add-route skill for:

app/about/page.tsx — Suzanne's story, credentials, methodology, media appearances
app/contact/page.tsx — Cal.com embed, contact form, social links

Teammate 2: Use add-route skill for:

app/services/page.tsx — all service types with pricing tiers
app/blog/page.tsx — blog listing with search and category filter

Teammate 3: Use add-route skill for:

app/blog/[slug]/page.tsx — individual blog post with Payload CMS data
app/legal/privacy/page.tsx — privacy policy
app/legal/terms/page.tsx — terms of service

All pages must have metadata exported with title and description.
Spawn qa-visual on all pages after completion.

### Task 1.6 — Payload CMS Setup
Spawn backend-agent to configure Payload CMS.
Context: Set up apps/payload with these collections:

Pages (for page content management)
BlogPosts (title, slug, content, featuredImage, author, publishedAt, seoTitle, seoDescription)
Programs (name, slug, description, price, features, category, isPublished)
Testimonials (name, role, quote, photo, videoUrl, result)
Media (Payload built-in — connected to Supabase Storage)

Access control:

Public can read published content
Authenticated admins can create/update/delete all
Connect Payload to Supabase PostgreSQL via DATABASE_URL.
Reference: https://payloadcms.com/docs


### Task 1.7 — SEO Foundation
Spawn research agent first:
"Research Next.js 14 App Router SEO best practices. Read https://nextjs.org/docs/app/building-your-application/optimizing/metadata and confirm the correct patterns for generateMetadata, sitemap.ts, robots.ts and structured data."
Then implement:

app/sitemap.ts — dynamic sitemap including all pages, blog posts, programs
app/robots.ts — allow all crawlers, reference sitemap
Structured data components: Organization, Person, Service, Product schemas
Open Graph images for homepage and key pages
Spawn code-reviewer after implementation.


### Task 1.8 — Cal.com Integration
Spawn devops-agent to deploy Cal.com as Docker service.
Use add-docker-service skill.
Image: calcom/cal.com — pin to latest stable version.
Then spawn integration-agent to:

Configure Cal.com with Suzanne's availability and service types
Embed booking widget on contact page and services page
Set up Cal.com webhook at /api/webhooks/calcom
Use add-webhook skill for the webhook handler.
Reference: https://cal.com/docs


### Task 1.9 — 301 Redirects
Spawn migration-agent to create redirect map.
Context: The site is migrating from WordPress at suzanneravenall.com.
All existing WordPress URLs must have 301 redirects to new URLs.
Map must be saved to infra/scripts/migrations/redirects.json
Implement in apps/web/next.config.ts redirects array.
Common patterns:

/shop → /shop (preserve)
/product/{slug} → /shop/{slug}
/product-category/{slug} → /shop?category={slug}
/?page_id={id} → / (homepage redirect)


**Phase 1 Sign-off Checklist:**
- [ ] All pages render correctly on mobile (375px) and desktop (1280px)
- [ ] PageSpeed score 90+ on mobile and desktop
- [ ] All metadata and Open Graph tags present
- [ ] Sitemap accessible at /sitemap.xml
- [ ] Robots.txt accessible at /robots.txt
- [ ] Cal.com booking flow works end-to-end
- [ ] Payload CMS accessible and Suzanne's team can edit content
- [ ] 301 redirects all return correct status codes
- [ ] No console errors on any page
- [ ] All changes merged to staging branch and deployed to staging VPS
- [ ] Suzanne has reviewed staging and given written sign-off before merging to main

---

## PHASE 2 — E-Commerce and Payments
**Duration:** Weeks 2–5 (parallel with Phase 1) | **Owner:** Backend developer

### Task 2.1 — Medusa v2 Setup
Spawn backend-agent to initialise Medusa v2.
Context: Set up apps/medusa with:

Medusa v2 core installation
Connect to Supabase PostgreSQL via DATABASE_URL
Configure regions: South Africa (ZAR), International (USD)
Configure tax rates for South Africa (15% VAT)
Configure shipping profiles
Reference: https://docs.medusajs.com/learn/installation
Run initial database migration: cd apps/medusa && npx medusa db:migrate


### Task 2.2 — Product Catalogue Structure
Spawn backend-agent to create product structure in Medusa.
Context: Create these product collections matching Suzanne's offering tiers:

"Start Here" — entry level R1,500–R5,000
"Deep Dive" — mid tier R5,000–R20,000
"Master Level" — premium R20,000–R100,000+
"Practitioner" — licensing and certification programs

Then use add-medusa-module skill to create a custom programs module with:

program_type: course | session | group | licensing | bundle
delivery_method: online | in_person | hybrid
duration_weeks, max_participants, includes_certification


### Task 2.3 — Product Migration
Spawn migration-agent for WooCommerce product migration.
Context: Source is WooCommerce REST API at current WordPress site.
Target is Medusa v2 product catalogue.
Run DRY_RUN=true first.
Verify count match before committing.
Preserve all product slugs for SEO 301 redirects.
Reference: https://woocommerce.github.io/woocommerce-rest-api-docs/

### Task 2.4 — Shop Pages
Create an agent team with 2 teammates:
Teammate 1: Use add-route skill for:

app/shop/page.tsx — product catalogue with MeiliSearch filtering
Categories, price filter, search bar, sort options
Show 8–12 products max — no 144-product overwhelm

Teammate 2: Use add-route skill for:

app/shop/[slug]/page.tsx — individual program/product sales page
Long-form layout: Hero, Problem, Solution, Features, Testimonials, FAQ, CTA, Price
Multiple CTAs — one every screen length
Payment plan options displayed clearly
Mobile-first

Spawn qa-visual on both pages.

### Task 2.5 — Checkout Flow
Spawn backend-agent to build checkout with Medusa v2.
Context: Implement full checkout flow:

Cart management via Medusa Cart module
Address collection (South Africa + international)
Shipping method selection
Payment method selection (PayFast or PayPal)
Order confirmation

Use add-route skill for:

app/checkout/page.tsx — multi-step checkout
app/checkout/confirmation/page.tsx — order confirmation with summary
Reference: https://docs.medusajs.com/resources/storefront-development/checkout


### Task 2.6 — PayFast Integration
Use add-payment-provider skill for PayFast.
Inputs:

Provider name: payfast
Docs: https://developers.payfast.co.za/docs
Currencies: ZAR only
Webhook: ITN (Instant Transaction Notification)
Sandbox: https://sandbox.payfast.co.za

Start in sandbox mode.
Test full purchase flow before switching to production.
Spawn integration-agent to review ITN verification implementation.

### Task 2.7 — PayPal Integration
Use add-payment-provider skill for PayPal.
Inputs:

Provider name: paypal
Docs: https://developer.paypal.com/docs/api/orders/v2/
Currencies: USD, GBP, EUR (international clients)
Webhook: PayPal Orders webhooks
Sandbox: https://developer.paypal.com/tools/sandbox/

Start in sandbox mode.
Test full purchase flow before switching to production.

### Task 2.8 — Sage Business Cloud Integration
Use add-n8n-workflow skill for medusa-order-to-sage workflow.
Inputs:

Trigger: Medusa order.placed webhook
Target: Sage Business Cloud SA API
Action: Create invoice in Sage matching Medusa order
Error handling: Log to Sentry, never fail the order if Sage is down

Also spawn integration-agent to:

Build Sage OAuth 2.0 authentication flow
Create customer sync (Medusa customer → Sage customer)
Create product sync (Medusa product → Sage item)
Reference: https://www.sage.com/en-za/sage-business-cloud/accounting/developer-api/
Sage API spec: https://accounting.sageone.co.za/api/2.0.0


### Task 2.9 — PDF Invoices
Spawn backend-agent to implement PDF invoice generation.
Context: Use react-pdf to generate invoices server-side.
Triggered after successful Medusa order.
Invoice must include:

Suzanne Ravenall branding and logo
Order details, line items, subtotal, VAT, total
Customer details and billing address
Invoice number (from Sage if available)
Payment confirmation
Ai Dynamic Advisory credit in footer
Store PDF in Supabase Storage and attach URL to Medusa order metadata.
Reference: https://react-pdf.org/


### Task 2.10 — Cart Abandonment
Use add-n8n-workflow skill for cart-abandonment-recovery workflow.
Use add-email-template skill for 3 cart abandonment emails:

cart-abandonment-1: 1 hour after abandonment — "Did you forget something?"
cart-abandonment-2: 24 hours after abandonment — "Your program is waiting"
cart-abandonment-3: 72 hours after abandonment — "Last chance — special offer"

Trigger: Medusa cart.updated webhook with no subsequent order.placed within 1 hour.

### Task 2.11 — Order Confirmation Email
Use add-email-template skill for order-confirmation email.
Trigger: Medusa order.placed event.
Include: order summary, line items, total paid, PDF invoice link, next steps.
Spawn qa-unit to test sending function.

### Task 2.12 — MeiliSearch Setup
Use add-docker-service skill to add MeiliSearch to Docker Compose.
Then spawn backend-agent to:

Create search indexes: products, blog_posts, resources
Configure searchable attributes and ranking rules
Build search API route at app/api/search/route.ts
Add search component to shop page and blog page
Use add-n8n-workflow skill for meilisearch-content-sync workflow.
Reference: https://www.meilisearch.com/docs


**Phase 2 Sign-off Checklist:**
- [ ] All products migrated from WooCommerce — counts match
- [ ] Shop page loads under 2 seconds
- [ ] Search returns relevant results
- [ ] PayFast sandbox checkout completes successfully
- [ ] PayPal sandbox checkout completes successfully
- [ ] Sage invoice created for each test order
- [ ] PDF invoice generated and attached to order
- [ ] Order confirmation email received after purchase
- [ ] Cart abandonment emails triggered correctly
- [ ] No checkout errors in Sentry
- [ ] All changes merged to staging branch and deployed to staging VPS
- [ ] Suzanne has reviewed staging and given written sign-off before merging to main

---

## PHASE 3 — Membership Portal and Gated Content
**Duration:** Weeks 4–7 | **Owner:** Full-stack developer

### Task 3.1 — Membership Products in Medusa
Spawn backend-agent to create membership subscription products.
Context: Create membership tiers as Medusa subscription products:

Free Member (R0/month)
Silver Member (price TBC)
Gold Member (price TBC)
Practitioner License (price TBC)

Use add-medusa-module skill for a memberships module:

Handles recurring billing via Medusa subscription workflows
Updates Supabase member_subscriptions table on purchase
Triggers welcome email via Resend on first purchase
Reference: https://docs.medusajs.com/resources/commerce-modules/product


### Task 3.2 — Supabase Auth Configuration
Spawn backend-agent to configure Supabase Auth.
Context:

Email/password sign up and sign in
Magic link login option
OAuth providers: Google (optional — confirm with client)
Email confirmation required before portal access
Password reset flow using password-reset email template
JWT custom claims to include membership tier_id and role
Reference: https://supabase.com/docs/guides/auth


### Task 3.3 — Member Portal
Create an agent team with 2 teammates:
Teammate 1: Use add-route skill for portal core:

app/portal/page.tsx — dashboard with membership status, quick links, upcoming bookings
app/portal/profile/page.tsx — edit profile, membership details, billing history
app/(auth)/login/page.tsx — sign in page
app/(auth)/signup/page.tsx — sign up / membership purchase flow
Teammate 2: Use add-route skill for portal content:

app/portal/resources/page.tsx — resource library filtered by member tier
app/portal/videos/page.tsx — gated video content filtered by member tier
app/portal/bookings/page.tsx — upcoming and past Cal.com bookings

All portal routes protected by Next.js middleware checking Supabase session.
Redirect unauthenticated users to /login.

### Task 3.4 — Middleware Auth Protection
Create apps/web/middleware.ts to protect portal routes.
Use Supabase Auth helpers for Next.js.
Protected paths: /portal/*

Public paths: everything else
On unauthenticated request to /portal/*: redirect to /login?redirect={original URL}
After login: redirect back to original URL.
Reference: https://supabase.com/docs/guides/auth/server-side/nextjs
Spawn security-agent to review middleware implementation.

### Task 3.5 — Resource Access Control
Spawn security-agent to implement full resource access control.
Context: Implement the three-layer access control model from security-agent.md.
Layer 1 — Cloudflare WAF rules (reference security-agent.md)
Layer 2 — Next.js middleware (Task 3.4 above)
Layer 3 — Supabase RLS on resources and video_content tables
Use add-rls-policy skill for:

resources table: members see only resources their tier allows
video_content table: members see only videos their tier allows
member_subscriptions table: users see only their own subscriptions
profiles table: users see only their own profile

Test every policy with all four roles: unauthenticated, free, gold, admin.

### Task 3.6 — Bunny Stream Integration
Spawn integration-agent for Bunny Stream video integration.
Context:

Video metadata stored in Supabase video_content table
Bunny API key server-side only — never exposed to browser
Access pattern: member requests video → server checks RLS → if authorised → fetch signed URL from Bunny → return to client → signed URL expires in 1 hour

Use add-api-route skill for:

app/api/videos/[id]/stream/route.ts — returns signed Bunny embed URL

Use add-webhook skill for Bunny Stream webhooks (video processing complete).
Reference: https://docs.bunny.net/docs/stream-getting-started

### Task 3.7 — Wild Apricot Member Migration
Spawn migration-agent for Wild Apricot member migration.
Context:
Source: Wild Apricot API — GET /accounts/{accountId}/contacts
Target: Supabase Auth + profiles + member_subscriptions
Critical rules:

Never import passwords
Use Supabase Auth admin API to invite members
Members must reset password on first login
Map Wild Apricot membership levels to new tiers — document mapping
Only migrate active members unless client approves otherwise

DRY_RUN=true first. Client sign-off required on sample before full migration.
Reference: https://gethelp.wildapricot.com/en/articles/182-using-wild-apricot-s-api

### Task 3.8 — Discourse Community
Spawn devops-agent to deploy Discourse via Docker.
Use add-docker-service skill for Discourse.
Then spawn integration-agent to:

Configure Discourse SSO using Supabase Auth tokens
Map membership tiers to Discourse groups (free, silver, gold, practitioner)
Restrict categories by group membership
Configure email settings via Resend SMTP
Style Discourse to match Suzanne's brand
Reference: https://meta.discourse.org/t/discourse-sso-provider/32511


### Task 3.9 — Membership Emails
Use add-email-template skill for:

membership-welcome: After first membership purchase
membership-renewal-reminder: 7 days before expiry
membership-expired: On expiry date

Use add-n8n-workflow skill for membership-renewal-reminder scheduled workflow:

Runs daily at 09:00 SAST
Checks member_subscriptions for expiry_date = today + 7 days
Sends renewal-reminder email via Resend to each expiring member


**Phase 3 Sign-off Checklist:**
- [ ] Member can sign up and log in successfully
- [ ] Unauthenticated users redirected from /portal/* to /login
- [ ] Free member sees only free resources
- [ ] Gold member sees gold and below resources
- [ ] Unauthorised member cannot access higher tier content via direct URL
- [ ] Bunny Stream videos play correctly for authorised members
- [ ] Wild Apricot members migrated — counts verified
- [ ] Migrated members can log in with password reset flow
- [ ] Discourse forum accessible with platform SSO login
- [ ] Membership tier controls Discourse group access
- [ ] Welcome email received after membership purchase
- [ ] RLS policies reviewed and signed off by security-agent
- [ ] All changes merged to staging branch and deployed to staging VPS
- [ ] Suzanne has reviewed staging and given written sign-off before merging to main

---

## PHASE 4 — CRM, Vibe Marketing and Automation
**Duration:** Weeks 6–8 | **Owner:** Automation developer

### Task 4.1 — Vtiger CRM Configuration
Spawn integration-agent to configure Vtiger for sales pipeline.
Context: Vtiger is used ONLY for:

Lead tracking (pre-purchase prospects)
Sales pipeline stages
Discovery call notes and follow-ups
Client relationship history

Configure pipeline stages:

New Lead
Discovery Call Booked
Discovery Call Completed
Proposal Sent
Closed Won
Closed Lost

Do NOT use Vtiger for member management — that is in Supabase.
Reference: https://www.vtiger.com/docs/vtiger-rest-api/

### Task 4.2 — Vtiger Automation Workflows
Use add-n8n-workflow skill for these Vtiger workflows:

calcom-booking-to-vtiger:
Trigger: Cal.com BOOKING_CREATED webhook
Action: Check if contact exists in Vtiger (match by email) → create if not → create Activity record for booking → set pipeline stage to "Discovery Call Booked"
medusa-order-to-vtiger:
Trigger: Medusa order.placed webhook
Action: Check if contact exists → create if not → update pipeline stage to "Closed Won" → add order value to contact record
lead-magnet-to-vtiger:
Trigger: Lead magnet form submission via Vibe Marketing
Action: Create new Lead in Vtiger → set source to "Lead Magnet" → set pipeline stage to "New Lead"


### Task 4.3 — Vibe Marketing Connection
Spawn integration-agent to connect Vibe Marketing to the platform.
Context: Vibe Marketing is Ai Dynamic Advisory's proprietary AI marketing platform.
It runs on its own infrastructure (Next.js + Supabase + Claude + n8n).
Connections needed:

Lead magnet form on suzanneravenall.com → Vibe Marketing via n8n webhook

New signup added to Vibe Marketing contact list for Suzanne
5-email lead nurture sequence triggered


New Medusa customer → Vibe Marketing contact sync

Post-purchase onboarding sequence triggered


Membership renewal reminders (Task 3.9) coordinated with Vibe Marketing sequences

Ensure no duplicate emails when Vibe and platform both send



Use add-n8n-workflow skill for lead-magnet-to-vibe workflow.
Document all Vibe Marketing webhook URLs in infra/n8n/README.md.

### Task 4.4 — Remaining n8n Workflows
Use add-n8n-workflow skill for remaining workflows:

sage-invoice-sync:
Trigger: Daily schedule 06:00 SAST
Action: Compare Medusa orders from last 24h with Sage invoices → log any missing invoices → alert admin if discrepancies found
weekly-report:
Trigger: Every Monday 08:00 SAST
Action: Compile stats (new members, revenue, bookings, new leads) → send summary email to admin via Resend
bunny-video-access-check:
Trigger: n8n webhook called from apps/web/app/api/videos
Action: Verify member tier → return signed Bunny URL if authorised → log access attempt

Export all workflow JSONs and commit to infra/n8n/workflows/

### Task 4.5 — Staff Training Documentation
Create docs/admin-guide.md covering:

How to add new blog posts in Payload CMS
How to add new products in Medusa admin
How to manage members in Supabase dashboard
How to view the Vtiger sales pipeline
How to check n8n workflow logs
How to view Sentry errors
How to interpret GA4 and Microsoft Clarity reports
How to upload new videos to Bunny Stream

Create docs/developer-runbook.md covering:

How to SSH to the VPS
How to restart individual Docker services
How to run database migrations
How to rollback a deployment
How to restore from Backblaze B2 backup
Common errors and fixes


**Phase 4 Sign-off Checklist:**
- [ ] Vtiger pipeline stages configured
- [ ] Cal.com booking → Vtiger activity created automatically
- [ ] Medusa purchase → Vtiger contact updated automatically
- [ ] Lead magnet signup → Vibe Marketing sequence triggered
- [ ] Sage daily reconciliation runs without errors
- [ ] Weekly report email arrives Monday morning
- [ ] All n8n workflow JSONs committed to repo
- [ ] Admin guide reviewed and approved by Suzanne's team
- [ ] Developer runbook reviewed by all developers
- [ ] All changes merged to staging branch and deployed to staging VPS
- [ ] Suzanne has reviewed staging and given written sign-off before merging to main

---

## PHASE 5 — QA, Security Audit and Launch
**Duration:** Weeks 9–10 | **Owner:** All developers

### Task 5.1 — Full Security Audit
Spawn security-agent to run the full pre-launch security checklist from security-agent.md.
Every item must be checked and passing before proceeding to launch.
Pay special attention to:

RLS policies on all tables
Webhook signature verification on all handlers
No secrets in codebase (git log scan)
Cloudflare WAF rules active
Security headers present on all responses
Report all findings. All critical and high issues must be fixed before launch.


### Task 5.2 — Performance Audit
Run PageSpeed Insights on all key pages:

Homepage: https://pagespeed.web.dev/?url=https://staging.suzanneravenall.com
Shop page
Individual program page
Member portal

Target: 90+ mobile and desktop on all pages.
If any page below 90 mobile: spawn research agent to identify bottleneck then fix.
Also run:

Lighthouse audit in Chrome DevTools
WebPageTest.org for waterfall analysis
Check Core Web Vitals in Google Search Console


### Task 5.3 — Cross-Device QA
Create an agent team with 3 teammates for parallel QA:
Teammate 1: Test all public pages

Homepage, About, Services, Programs, Shop, Blog, Contact
At 375px (iPhone SE), 768px (iPad), 1280px (desktop)
Use qa-visual agent on each page
Report any layout issues

Teammate 2: Test full purchase flow

Browse shop → add to cart → checkout → PayFast payment → confirmation
Browse shop → add to cart → checkout → PayPal payment → confirmation
Verify order in Medusa admin
Verify invoice in Sage
Verify email received

Teammate 3: Test full member journey

Sign up → email confirmation → portal access
Browse resources with free tier → see only free content
Upgrade to gold tier → see gold content
Watch a gated video
Access Discourse forum
Password reset flow


### Task 5.4 — Load Testing
Spawn devops-agent to run load testing.
Context: Simulate peak concurrent traffic.
Tool: k6 (https://k6.io/docs/)
Scenarios:

50 concurrent users browsing shop
20 concurrent users in checkout
30 concurrent users in member portal
Spike test: 100 users in 30 seconds

Success criteria:

Response time < 2s at p95
Error rate < 0.1%
All containers healthy throughout
Fix any bottlenecks before launch.


### Task 5.5 — End-to-End Checklist
Run through every item in this final checklist.
Do not proceed to DNS cutover until every item is checked:
Public Website:

 All pages load under 2 seconds on mobile
 All pages score 90+ on PageSpeed mobile and desktop
 All metadata, Open Graph and schema markup present
 Sitemap accessible and valid
 All 301 redirects from WordPress URLs working
 Contact form submits successfully
 Cal.com booking flow completes end-to-end

Commerce:

 PayFast purchase flow completes end-to-end (real sandbox test)
 PayPal purchase flow completes end-to-end (real sandbox test)
 Order confirmation email received within 60 seconds
 PDF invoice generated and accessible
 Sage invoice created for each order
 Vtiger contact updated for each purchase
 Cart abandonment email received after 1 hour

Member Portal:

 Sign up, email confirmation and first login work
 Wild Apricot migrated members can reset password and log in
 Resource access control correct for all tiers
 Video playback works for authorised members
 Discourse SSO login works
 Membership renewal reminder email sends correctly

Integrations:

 n8n all workflows active and last run successful
 Sentry receiving events — test error triggered and received
 GA4 receiving pageviews — verified in GA4 real-time
 Microsoft Clarity recording sessions
 Backblaze B2 backup ran successfully last night
 Vibe Marketing sequences triggering correctly

Security:

 All RLS policies tested with multiple roles
 All webhook signatures verified
 No secrets in git history
 Cloudflare WAF rules active
 SSL A+ rating on SSL Labs test
 Security headers present — verify at securityheaders.com


### Task 5.6 — DNS Cutover
Spawn devops-agent to execute DNS cutover.
Context: This is the point of no return — execute carefully.

DNS cutover only happens after Phase 5 has been fully reviewed on staging and Suzanne has signed off in writing. At this point the staging site IS the production site — cutover simply points the live domain at it. There should be no surprises on launch day because Suzanne has already seen and approved everything.

Pre-cutover (24 hours before):

Lower DNS TTL to 300 seconds in Cloudflare for suzanneravenall.com
Confirm WordPress site still live and accessible
Confirm new platform fully passing all Task 5.5 checklist items
Schedule cutover for lowest-traffic time (Tuesday–Wednesday 02:00–04:00 SAST)
Notify Suzanne's team of maintenance window

Cutover steps:

Update Cloudflare DNS A record for suzanneravenall.com → VPS IP
Update Cloudflare DNS for all subdomains (n8n, cal, community)
Monitor Cloudflare analytics — confirm traffic shifting to new platform
Test all critical flows immediately after cutover:

Homepage loads
PayFast checkout works
Member portal login works
Cal.com booking works


Monitor Sentry for 48 hours — fix any production errors immediately

Post-cutover (48 hours after):

Confirm no critical errors in Sentry
Confirm GA4 receiving normal traffic levels
Archive WordPress site — do not delete, keep for reference
Restore DNS TTL to 3600 seconds
Send launch notification to Suzanne's team


### Task 5.7 — Handover
Deliver these documents to Suzanne and her team:

docs/admin-guide.md — how to manage content, products and members day-to-day
docs/developer-runbook.md — how to maintain and troubleshoot the platform
infra/scripts/migrations/ — all migration scripts and logs
infra/n8n/README.md — all n8n workflow documentation
.env.example — all environment variables documented (not values)

Final handover meeting agenda:

Walk through admin guide with Suzanne's team
Demonstrate Payload CMS content editing
Demonstrate Medusa admin — products, orders, members
Show Vtiger pipeline and how leads flow in automatically
Show Vibe Marketing dashboard for Suzanne's account
Show Sentry, GA4 and Clarity dashboards
Explain 30-day post-launch support process


**Phase 5 Sign-off Checklist:**
- [ ] Security audit complete — no critical or high issues open
- [ ] All pages 90+ PageSpeed mobile and desktop
- [ ] Load test passed — all criteria met
- [ ] End-to-end checklist 100% complete
- [ ] DNS cutover executed successfully
- [ ] 48-hour post-launch monitoring complete with no critical errors
- [ ] All handover documents delivered
- [ ] Handover meeting completed
- [ ] Suzanne and team sign off on platform
- [ ] All changes merged to staging branch and deployed to staging VPS
- [ ] Suzanne has reviewed staging and given written sign-off before merging to main

---

## Post-Launch — 30-Day Support Window
**Owner:** Ai Dynamic Advisory

- Monitor Sentry daily for new errors
- Monitor GA4 weekly for traffic and conversion trends
- Fix any bugs reported by Suzanne's team within 48 hours
- Weekly check-in call with Suzanne's team for first 4 weeks
- Document any issues and resolutions in docs/post-launch-log.md

---

## Phase 2 Preview — Future Work
The following is out of scope for this build and will be scoped separately:

**Affiliate and Referral Programme:**
- Native build within Medusa using promotions and custom referral module
- Unique referral links per practitioner
- Commission tracking and automated payouts
- Estimated: 4–6 additional weeks

**Flutter Mobile App:**
- Native iOS and Android app for members
- Access to portal, videos, resources and community
- Push notifications
- Single codebase via Flutter

---

## Quick Reference — Agent and Skill Cheat Sheet

| Need to... | Use... |
|---|---|
| Set up Docker service | add-docker-service skill |
| Configure Nginx or CI/CD | devops-agent |
| Create new React component | add-component skill |
| Build page from design | design-from-reference skill |
| Add new Next.js route | add-route skill |
| Add API endpoint | add-api-route skill |
| Create Supabase table | add-supabase-table skill |
| Add RLS policy | add-rls-policy skill |
| Build Medusa module | add-medusa-module skill |
| Add payment provider | add-payment-provider skill |
| Connect external API | integration-agent |
| Build n8n workflow | add-n8n-workflow skill |
| Add webhook handler | add-webhook skill |
| Create email template | add-email-template skill |
| Migrate data | migration-agent |
| Review security | security-agent |
| Review code | code-reviewer agent |
| Run unit tests | qa-unit agent |
| Check visual output | qa-visual agent |
| Research unfamiliar API | research agent |

---

## Feedback and Iteration Process

### How to collect Suzanne's feedback per phase
1. Deploy phase to staging
2. Send Suzanne the staging URL with basic auth credentials
3. Schedule a 30-minute walkthrough call — screen share on staging
4. Document all feedback in a GitHub Issue labelled `feedback/phase-{N}`
5. Prioritise feedback:
   - **Must fix before production:** blocking issues, wrong content, broken features
   - **Nice to have:** cosmetic tweaks, copy changes, future enhancements
6. Fix must-fix items on feature branch → merge to staging → Suzanne re-reviews
7. Once Suzanne confirms all must-fix items resolved — merge staging to main

### Feedback issue template
When creating a GitHub Issue for Suzanne's feedback use this format:
```
Title: [Phase N Feedback] Brief description
Environment: staging.suzanneravenall.com
Page/Feature: [which page or feature]
Priority: Must fix / Nice to have
Description:
[What Suzanne observed]
Expected:
[What it should look like or do]
Screenshots:
[Attach screenshots from staging]
```

### Version tracking
Each staging deployment is tagged in GitHub for easy reference:
```bash
# After deploying a phase to staging
git tag staging-phase-{N}-v{iteration}
git push origin staging-phase-{N}-v{iteration}

# Example: first deploy of phase 1
git tag staging-phase-1-v1
# After Suzanne's feedback fixes
git tag staging-phase-1-v2
```
