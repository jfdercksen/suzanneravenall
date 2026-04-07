# Architectural Decisions — Suzanne Ravenall Platform

This is the decision log. Every significant architectural choice is recorded here with reasoning. Decisions are immutable once made — if a decision is reversed, add a new entry referencing the original.

---

## D001 — VPS over Vercel

**Decision:** All services on single VPS via Docker Compose. Not Vercel.
**Reason:** Medusa.js requires persistent Node.js process — incompatible with Vercel serverless. Single VPS keeps all services on Docker network, reducing latency.
**Date:** March 2026 | **Decided by:** Johan (Ai Dynamic Advisory)

---

## D002 — Supabase as central data layer

**Decision:** Supabase PostgreSQL is the single database for Next.js and Medusa. Supabase Auth is the single identity source.
**Reason:** One database, one auth, one storage. Medusa v2 supports external PostgreSQL natively.
**Date:** March 2026 | **Decided by:** Johan

---

## D003 — Wild Apricot retired not integrated

**Decision:** Wild Apricot fully replaced. Member data migrated to Supabase.
**Reason:** Client confirmed equivalent functionality acceptable. Building natively gives full ownership and removes ongoing SaaS cost.
**Date:** March 2026 | **Decided by:** Suzanne Ravenall + Johan

---

## D004 — Vtiger for sales pipeline only

**Decision:** Vtiger used exclusively for leads, discovery calls, pipeline stages, client notes. Not for member management.
**Reason:** Vtiger is a CRM not a membership platform. Member management belongs in Supabase/Medusa. Vtiger populated automatically via webhooks.
**Date:** March 2026 | **Decided by:** Johan

---

## D005 — Vibe Marketing replaces all email marketing tools

**Decision:** Ai Dynamic Advisory's proprietary Vibe Marketing platform handles all email marketing. No Mautic, Mailchimp or third-party marketing tools.
**Reason:** Same agency, same stack (Next.js + Supabase + Claude + n8n). Better integration, better control, no additional SaaS cost.
**Date:** March 2026 | **Decided by:** Johan

---

## D006 — Bunny Stream for video not Supabase Storage

**Decision:** Course and training videos hosted on Bunny Stream. Supabase Storage for documents, images and assets only.
**Reason:** Supabase Storage not built for video streaming. Bunny Stream has proper CDN, adaptive bitrate and South Africa-optimised delivery.
**Date:** March 2026 | **Decided by:** Johan

---

## D007 — n8n replaces Zapier

**Decision:** All workflow automation via self-hosted n8n. No Zapier.
**Reason:** Zapier costs per task. n8n is open source, self-hosted on VPS, no per-task pricing. All workflow JSON exports committed to infra/n8n/workflows/.
**Date:** March 2026 | **Decided by:** Johan

---

## D008 — PayFast primary PayPal international

**Decision:** PayFast for South African customers (ZAR). PayPal for international clients.
**Reason:** PayFast is the dominant SA gateway. PayPal required for international clients who cannot use PayFast.
**Date:** March 2026 | **Decided by:** Johan

---

## D009 — Discourse for community forums

**Decision:** Self-hosted Discourse with Supabase SSO integration.
**Reason:** Building custom forum is a rabbit hole. Discourse is open source, mature, self-hosted and supports SSO so members use one login.
**Date:** March 2026 | **Decided by:** Johan

---

## D010 — Three-environment workflow mandatory

**Decision:** Local → staging VPS → production VPS. Suzanne reviews and signs off on staging before anything goes to production.
**Reason:** No surprises on launch day. Suzanne sees exactly what goes live before it does.
**Date:** March 2026 | **Decided by:** Johan

---

## D011 — Next.js over plain React or Flutter for web

**Decision:** Next.js 14 App Router for web platform. Flutter reserved for Phase 2 mobile app.
**Reason:** Next.js IS React with SSR — critical for SEO on coaching content. Flutter Web has poor SEO. Flutter native app reserved for Phase 2.
**Date:** March 2026 | **Decided by:** Johan

---

## D012 — Payload CMS for content management

**Decision:** Payload CMS self-hosted for all content editing.
**Reason:** Suzanne's team needs to edit content without developer involvement. Payload integrates natively with Next.js App Router and connects to the same Supabase PostgreSQL instance.
**Date:** March 2026 | **Decided by:** Johan

---

## D013 — MeiliSearch for product and content search

**Decision:** Self-hosted MeiliSearch for all product, course and content search.
**Reason:** Native Medusa integration. Open source. Fast. Self-hosted on VPS keeps costs minimal.
**Date:** March 2026 | **Decided by:** Johan
