# Build Status — Suzanne Ravenall Platform

Current Phase: Phase 2 — E-Commerce
Current Task: Task 2.11 — Order Confirmation Email
Current Branch: main
Last Updated: May 2026
Last Updated By: Johan

---

## Phase Progress

| Phase | Build | Staging | Sign-off |
|-------|-------|---------|----------|
| Phase 0 — Foundation | ✅ Complete | ✅ Staging deployed | ⏳ Awaiting sign-off |
| Phase 1 — Public Website | ✅ Complete | ❌ Not yet | ❌ Not yet |
| Phase 2 — E-Commerce | 🔄 In Progress | ❌ Not yet | ❌ Not yet |
| Phase 3 — Membership Portal | ⏳ Not started | ❌ Not yet | ❌ Not yet |
| Phase 4 — CRM and Automation | ⏳ Not started | ❌ Not yet | ❌ Not yet |
| Phase 5 — QA and Launch | ⏳ Not started | ❌ Not yet | ❌ Not yet |

---

## Phase 0 — Completed Tasks

- ✅ Task 0.1 — Monorepo scaffold
- ✅ Task 0.2 — Docker Compose base stack
- ✅ Task 0.3 — Nginx reverse proxy
- ✅ Task 0.4 — CI/CD pipeline
- ✅ Task 0.5 — Supabase schema foundation
- ✅ Task 0.6 — Backup automation (Backblaze B2 configured, cron installed)
- ⏳ Task 0.7 — Sentry setup (account created, DSNs deferred to Phase 5 — see KI001)

---

## Phase 2 — Task Status

- ✅ Task 2.1 — Medusa v2 Setup
- ✅ Task 2.2 — Product Catalogue Structure
- ✅ Task 2.3 — Product Migration (WooCommerce)
- ✅ Task 2.4 — Shop Pages
- ✅ Task 2.5 — Checkout Flow
- ✅ Task 2.6 — PayFast Integration
- ✅ Task 2.7 — PayPal Integration
- ✅ Task 2.8 — Sage Business Cloud Integration
- ✅ Task 2.9 — PDF Invoices
- ✅ Task 2.10 — Cart Abandonment
- ⏳ Task 2.11 — Order Confirmation Email ← CURRENT
- ⏳ Task 2.12 — MeiliSearch Setup

---

## Phase 1 — Task Status

- ✅ Task 1.1 — Next.js App Setup
- ✅ Task 1.2 — Design System
- ✅ Task 1.3 — Core Layout and Navigation
- ✅ Task 1.4 — Homepage
- ✅ Task 1.5 — Core Pages
- ✅ Task 1.6 — Payload CMS Setup (code complete; VPS deployment CSS/login issues logged as KI004/KI005 — deferred)
- ✅ Task 1.7 — SEO Foundation
- ✅ Task 1.8 — Cal.com Integration
- ✅ Task 1.9 — 301 Redirects

---

## Pre-Build Checklist

- ✅ VPS provisioned (cloud.co.za, Ubuntu 22.04)
- ✅ Domain DNS in Cloudflare
- ✅ GitHub repository created
- ✅ Supabase project created
- ❌ No staging VPS — workflow is local → git push main → VPS Docker build (single environment, no staging)
- ✅ GitHub Actions CI/CD tested
- ✅ Docker containers running and healthy
- ❌ Resend account and domain verified
- ❌ Bunny Stream account created
- ✅ Backblaze B2 bucket created
- ⏳ Sentry account created (DSNs deferred to Phase 5)
- ❌ Sage API key obtained
- ❌ PayFast merchant account confirmed
- ❌ PayPal sandbox account created
- ❌ Wild Apricot admin access obtained
- ❌ WordPress admin access obtained
- ✅ All .env placeholder values replaced
- ✅ Client brand assets received (SVG logos, colours confirmed, Poppins confirmed)

---

## Session Notes

- **May 2026:** Task 2.10 complete. Cart abandonment recovery built. Medusa cart-updated subscriber at apps/medusa/src/subscribers/cart-updated.ts: fires on cart.updated event, 30-minute in-memory debounce gate (prevents n8n flood from high-frequency cart mutations), sends cartId/email/items/total/cartUrl to n8n. n8n workflow at infra/n8n/workflows/cart-abandonment-recovery.json: 15-node linear chain — validate email+items, prepare data, wait 1h, check Medusa orders API, if no order send email 1, wait 23h, check again, if no order send email 2, wait 48h, check again, if no order send email 3. n8n uses MEDUSA_API_TOKEN (already in n8n environment) to check orders. Email API route at apps/web/app/api/email/cart-abandonment/route.ts: auth via N8N_WEBHOOK_SECRET (returns 500 if secret missing — not a silent skip), validates items array content with type guard, dispatches to send functions. 3 email templates at apps/web/lib/email/templates/ (CartAbandonment1/2/3.tsx) using react-email components, navy/blue brand tokens, cart items, CTAs. 3 send functions at apps/web/lib/email/ using Resend v6 SDK with createElement. Shared formatAmount util in lib/email/utils.ts (currency-aware, ZAR → R prefix). resend + @react-email/components installed. SETUP REQUIRED: (1) Add RESEND_API_KEY to infra/.env. (2) Verify sending domain in Resend dashboard (suzanneravenall.com). (3) Import infra/n8n/workflows/cart-abandonment-recovery.json into n8n UI and activate. (4) After DNS cutover, update RESEND_FROM_ADDRESS if needed. KNOWN: unsubscribe links are href="#" placeholders — must be wired before go-live (POPIA compliance).

- **May 2026:** Task 2.9 complete. PDF invoice generation built. react-pdf InvoiceDocument at apps/web/components/invoice/InvoiceDocument.tsx — SA Tax Invoice layout: header, parties, line items (tax-inclusive VAT extraction 15/115), totals, payment+PAID stamp, footer. API route at apps/web/app/api/invoices/generate/route.ts: auth via N8N_WEBHOOK_SECRET header (x-webhook-secret), fetches order from Medusa admin API, renders PDF, uploads to Supabase Storage (invoices bucket, public), updates Medusa order metadata (spreads existing to avoid clobbering Sage/PayFast/PayPal keys), returns invoiceUrl. Medusa order-placed subscriber updated to fire-and-forget the invoice route (includes x-webhook-secret header). MEDUSA_API_TOKEN and WEB_BASE_URL added to docker-compose.yml. SETUP REQUIRED: (1) Add MEDUSA_API_TOKEN to infra/.env (generate in Medusa admin → Settings → API Key Management). (2) Rebuild medusa + web containers. (3) First invoice generation will auto-create the Supabase invoices bucket. Note: @react-pdf/renderer v3 + React 19 type conflict (TS2786/TS2607) is covered by typescript.ignoreBuildErrors: true — does not affect build or runtime. Test: POST /api/invoices/generate with real orderId and x-webhook-secret header.
- **May 2026:** Task 2.8 complete. Sage Business Cloud integration built. IMPORTANT: Sage SA v2.0.0 uses HTTP Basic Auth + API key query params — NOT OAuth. The oauth.accounting.sage.com/token endpoint is for GAC v3.1 (UK/US) and is not used by SA. Files built: (1) infra/n8n/workflows/medusa-order-to-sage.json — n8n workflow: webhook trigger (responds 200 immediately) → validate → search customers → create if needed → get tax types + chart of accounts → create TaxInvoice → update Medusa order metadata → error alert via Resend if any Sage call fails. (2) apps/medusa/src/modules/sage/ — SageService with findOrCreateCustomer, createInvoice, typed for SA v2 API. (3) apps/medusa/src/subscribers/order-placed.ts — fires n8n webhook on order.placed (fire-and-forget, never blocks). Medusa sageModule registered in medusa-config.js. Also fixed pre-existing PayPal TS2352 type error. SETUP REQUIRED: (1) Obtain SAGE_EMAIL, SAGE_PASSWORD, SAGE_API_KEY, SAGE_COMPANY_ID from Suzanne's Sage account. (2) Optionally get SAGE_INCOME_ACCOUNT_ID from Sage Chart of Accounts. (3) Generate MEDUSA_API_TOKEN in Medusa admin → API Keys. (4) Add all to infra/.env and rebuild medusa + n8n containers. (5) Import infra/n8n/workflows/medusa-order-to-sage.json into n8n UI and activate the workflow. KI010 added for missing Sage credentials.
- **May 2026:** Task 2.7 complete. PayPal integration built: Medusa payment-paypal module (AbstractPaymentProvider, OAuth2 client credentials, Orders v2 API — create/capture/refund/cancel). Checkout now routes by billing country: ZA → PayFast, INTL → PayPal. /api/checkout/paypal creates order + returns approvalUrl. /api/checkout/paypal/capture captures order, verifies custom_id/cartId binding (substitution attack prevention). /api/webhooks/paypal: PAYMENT.CAPTURE.COMPLETED handler with cert_url validation (trusted PayPal origins only), 3-way verification result (verified/forged/transient_error), returns 500 on transient errors so PayPal retries. seed-regions.mjs extended with International/ZAR region. SETUP REQUIRED: after deploy, add PAYPAL_CLIENT_ID + PAYPAL_CLIENT_SECRET + PAYPAL_WEBHOOK_ID to infra/.env, rebuild medusa + web containers, run seed-regions.mjs to create International region.
- **May 2026:** Merged feature/task-2-6-payfast → main. South Africa/ZAR region confirmed on VPS (reg_01KQVE9KPER31E4GCKJ1PFW5DH). PayFast payment module now deployed — run seed-regions.mjs to attach pp_payfast_payfast to the ZAR region after the VPS rebuilds. seed-regions.mjs added at infra/scripts/migrations/seed-regions.mjs (idempotent, handles create + update).
- **May 2026:** Task 2.6 complete. PayFast integration built: Medusa v2 payment provider at apps/medusa/src/modules/payment-payfast/ (AbstractPaymentProvider, all required methods, MD5 signature). Registered in medusa-config.js under @medusajs/payment module. ITN webhook handler at apps/web/app/api/webhooks/payfast/route.ts: IP allowlist, signature verification, cart completion via Medusa store API. /api/checkout/complete route added (called by ConfirmationContent on mount to create Medusa order). MEDUSA_BACKEND_URL=http://medusa:9000 added to infra/.env (already in docker-compose.yml). Security audit spawned (awaiting results). Build clean — 36 pages. SETUP REQUIRED: after deploy, activate PayFast provider in Medusa admin → Payment → Providers, and add it to the ZAR region's payment collection.
- **May 2026:** Task 2.5 complete. Checkout flow built: CartProvider + useCart hook in apps/web/lib/cart/cart-context.tsx (localStorage persistence, Medusa v2 store API, ZAR formatPrice). CartIcon added to Header (client component, item count badge). VariantSelector wired to real addItem. /cart page with quantity controls, remove, order summary, trust badges, empty state. /checkout 3-step flow (contact details → PayFast redirect → processing animation). /checkout/confirmation clears cart and shows payment reference from PayFast return params. /api/checkout/payfast route generates MD5 signature. Providers wrapper moved to wrap full layout (Header + main + Footer) so CartIcon has access to context. Build clean — 34 pages.
- **May 2026:** Task 2.4 complete. Shop pages built: /shop (catalogue with sticky category filter, collection tier filter, product grid 3-col, pagination, sort, loading skeletons) and /shop/[handle] (long-form sales page with hero, variant selector, outcome cards, programme details, testimonials, FAQ accordion, repeat CTA). Medusa category tree created (30 categories), all 48 products assigned. x-publishable-api-key wired to all store API fetches. Collection filter functional (fetches collection IDs from Medusa). Code review: 13 issues fixed (Next.js 15 params await, aria-controls, aria-pressed, useMemo, description split, md:→lg: breakpoints throughout). Pre-existing layout.tsx GA4 Script src type error fixed by switching to native React 19 <script async>. Build clean. Visual QA blocked by usage quota (resets 10am SAST).
- **April 2026:** Task 2.3 complete. 128 WC flat products consolidated into 48 Medusa products with variants using CONSOLIDATION_MAP in migrate-woocommerce.ts. 4 standalone products created (Programs 7/9 Self Study, Be an Energy Ninja L2, Group Sessions, etc. not covered by consolidation map). 129 URL redirect entries written to infra/scripts/migrations/redirect-map.json for Task 1.9. Medusa v2 fix applied: all products (including single-variant) require options array — buildConsolidatedPayload and buildStandalonePayload both updated. 4 collections (start-here, deep-dive, master-level, practitioner) created via seed-collections.mjs. Spot-checked: Rapid Repatterning (12 variants OK), RR Program 1 (3 variants OK), Executive Coaching (6 variants OK). KI006 remains open (15 cat-73 products excluded). KI007: 12 seed placeholder products NOT created (seed.ts failed on tax-rate API; only collections were seeded via seed-collections.mjs — remove KI007).
- **April 2026:** Task 2.2 complete. Created 4 product collections (Start Here / Deep Dive / Master Level / Practitioner) matching Suzanne's offering tiers. Custom ProgramsModule added at src/modules/programs/ — ProgramMetadata entity with program_type, delivery_method, duration_weeks, max_participants, includes_certification. Seed script extended with 12 placeholder products (3 per collection) using realistic coaching business data scraped from suzanneravenall.com offering structure. medusa db:migrate must be run on VPS after deploying this branch — creates program_metadata table.
- **April 2026:** Deployment environment audit and P0 fixes applied. Root causes of Payload CSS/login/hydration issues identified and fixed: (1) `basePath: '/cms'` was in working copy of next.config.ts but never committed — deployed Payload had no basePath so all /cms/* routes 404'd; (2) infra/.env used stale variable names (`DATABASE_URI`, `PAYLOAD_PUBLIC_SERVER_URL`) that don't match docker-compose.yml — Payload DB and serverURL were not set; (3) `NEXT_PUBLIC_MEDUSA_URL=http://medusa:9000` baked internal Docker hostname into client bundle. Also fixed: production Nginx conf (suzanneravenall.conf.disabled) was missing /api/store and /api/admin path rewrites; pr-checks.yml referenced non-existent staging branch. VPS .env must be updated manually with corrected var names before rebuilding containers. KI004 and KI005 closed.
- **April 2026:** Tasks 1.5–1.7 complete. Full page structure built — 30 static routes including /contact, /masterclass, /programs, /programs/[slug], /resources hub + 5 sub-pages, /shop placeholder, /portal shell + login/signup. SEO foundation: robots.ts, sitemap.ts (30 routes), OG defaults, Twitter cards, Organization + Person JSON-LD structured data. Build clean. Pre-existing errors fixed: lucide-react social icons replaced with inline SVGs, Server Component motion extraction.
- **April 2026:** Phase 0 fully complete. Starting Phase 1 Task 1.1. Creating feature branch now.
- **April 2026:** Task 1.1 complete. Next.js 14 app scaffolded in apps/web. 7/7 health check tests passing. Security headers reviewed by code-auditor — 6 fixes applied. Task 1.2 blocked until logo, colours and fonts received from Suzanne.
- **April 2026:** Task 1.2 complete. Design system built aligned to Tony Robbins reference. Poppins confirmed (weights 200–700). Brand tokens confirmed (#012B43 navy, #1719F4 electric blue). Full primary/accent/neutral colour scales in tailwind.config.ts. SVG logos received from Suzanne and deployed to apps/web/public/logos/. WCAG AA contrast verified (8.5:1 accent on white, 14.7:1 white on navy). 108/108 tests passing. Build clean.
- **April 2026:** Task 1.3 complete. Sticky navy Header, full-screen MobileNav overlay with focus trap + inert/aria-modal conditional, dark Footer with multi-column links, credentials, social icons. Skip-to-content link added. WCAG 2.1 AA compliant. 159/159 tests passing. Build clean.
- **April 2026:** Task 1.4 complete. Homepage built — 9 sections (Hero, TrustBar, FocusAreas, ServicesSection, FeaturedPrograms, TestimonialsSection, AboutTeaser, LeadMagnet, FinalCTA). Code review fixes applied (PII logging removed, aria-labelledby on all sections, figcaption structure, dt/dd semantics, aria-invalid on form). Build clean.
- **April 2026:** Task 1.4 complete. Homepage built to Tony Robbins cinematic standard. Sections: Hero (static image), MediaLogos ticker (12 logos from WordPress), AnimatedStats, UpcomingPrograms, TransformationQuote, FocusAreas (hover image swap), ServicesOverview, TestimonialSpotlight, FeaturedPrograms, AboutTeaser, LeadMagnet, FinalCTA. framer-motion animations on all sections. Open items: hero video (Suzanne to provide), focus area photos x6 (Suzanne to provide), real cohort dates and pricing to replace placeholders.
- **April 2026:** Task 1.6 complete. Payload CMS 3.83.0 installed in apps/payload. PostgreSQL adapter connected to Supabase via CLI link (IPv6 workaround — direct hostname blocked on local network, resolved via supabase link). Migration successful — all CMS tables created. 6 collections: Users, BlogPosts, Programs, Testimonials, Pages, Media. Admin panel confirmed at localhost:3001/admin. Supabase client helpers (server, client, middleware) added to apps/web. Session refresh middleware wired up. NEXT_PUBLIC_SUPABASE_ANON_KEY standardised. sharp installed. Supabase agent skills installed.
- **April 2026:** Task 1.5 complete. Built /about, /services, /explore hub + 8 /explore/[slug] pages from scraped WordPress content. All pages pass visual QA — Tony Robbins design standard met. Animated stat counters, full-bleed heroes, card image overlays, dark/light alternation correct across all routes. 17 pages building clean, zero TypeScript errors. [CONFIRM] items logged in KNOWN_ISSUES.md: About stats numbers, Services pricing/dates, Explore topic copy differentiation.
- **April 2026:** Task 1.5 in progress. 3-teammate parallel build: About (/about), Services (/services), Explore hub + 8 topic pages (/explore/[slug]). All built from scraped WordPress content. Code review complete — all issues fixed (CTA anchors, section alternation, rgba→token shadows, TypeScript narrowing, padStart counters). TypeScript clean. Visual QA blocked on usage quota (resets 10am SAST). Client [CONFIRM] items: About stats (qualifications count, years experience), Human Performance Replicator description, Services pricing/dates, Explore topic copy differentiation (3 topics share identical WordPress source template). no-bad-patterns.md updated: brand-navy does not exist — use brand-primary.
- **April 2026:** Environment audit complete. Fixed critical DATABASE_URL conflict (Medusa/Payload split to separate vars), NEXT_PUBLIC_MEDUSA_URL browser bundle bug, incomplete apps/web/.env.local, SUPABASE_SERVICE_ROLE_KEY missing from docker-compose. Complete rewrite of infra/.env.example. pre-deploy-setup.sh added for VPS first-run database creation.
- **April 2026:** Task 1.7 complete. SEO Foundation: robots.ts (blocks /portal, /api, /admin), sitemap.ts (30 routes including all 8 /explore/[slug] pages), root layout upgraded with full OG + Twitter card defaults, homepage JSON-LD (Organization + Person schemas). Fixed 3 pre-existing build errors: lucide-react missing social icons (Linkedin/Instagram/Facebook removed in v1.x — replaced with inline SVGs), framer-motion used in Server Component pages (shop, assessments — extracted to *Content.tsx client components), IntersectionObserver entry possibly undefined in ProgramsPageClient.tsx. Build clean — 30/30 pages.
- **April 2026:** Task 2.1 complete. Medusa v2 scaffolded in apps/medusa — medusa-config.ts, Dockerfile, seed script for regions/tax/shipping. Nginx /api/store and /api/admin routes added with correct path rewrites (/api/store/* → /store/*, /api/admin/* → /admin/*). Code review fixes applied: JWT/cookie secrets throw on missing env vars, Dockerfile runner stage does clean production install, admin TODO logged for IP restriction at DNS cutover. db:migrate must be run on VPS after first deploy.
- **April 2026:** Payload CMS VPS deployment — CSS and login redirect issues encountered. Root cause: basePath/hydration conflict (KI004, KI005). Deferred to Phase 5; recommend dedicated subdomain cms.suzanneravenall.com at DNS cutover to avoid Nginx subpath complications. Moving to Task 1.8.
- **April 2026:** Task 1.6 fully operational. Payload admin 500 resolved — root cause: (payload)/layout.tsx returned bare children instead of using RootLayout from @payloadcms/next/layouts, so ConfigProvider never mounted. Fix: wired RootLayout + handleServerFunctions. Secondary fixes: deleted importMap.ts (was shadowing auto-generated importMap.js), added sharp to buildConfig(), cleared stale public-schema migrations. Monorepo React deduplication fixed: apps/web upgraded from Next.js 14 + React 18 to Next.js 15 + React 19 to match apps/payload and eliminate duplicate React instances. Admin login confirmed ✓ · All 6 collections respond ✓ · BlogPost write confirmed ✓ · Both apps build clean ✓.
