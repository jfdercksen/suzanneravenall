# n8n migration plan: move all 13 automations into our own code

Date: 2026-10-06. Author: Claude (read-only analysis, nothing deployed or changed on the server).
Decision (Johan): every automation moves out of n8n into code that runs on the review VPS, so the n8n container can be switched off.

Sources read: all 13 exports in `infra/n8n/workflows/*.json`, `infra/n8n/README.md`, the three Medusa subscribers (`apps/medusa/src/subscribers/`), every `n8n` / `N8N_` reference in `apps/web`, the existing Medusa modules (`vtiger`, `sage`, `memberships`), `infra/docker-compose.yml` (env var names only), `infra/supabase/migrations/001_foundation.sql`, `KNOWN_ISSUES.md`, `BUILD_STATUS.md`, `.claude/worklog.md`, `docs/testing/SELF-TEST-PLAN.md`.

All exports carry `"active": false` (that is how they are stored in git). Live state below comes from BUILD_STATUS (11 activated May 2026), KI041 (Thinkific imported and published 22 Sep) and the worklog up to 1 Oct. Live n8n state was NOT checked on the box for this plan.

---

## 1. Executive summary

- Of the 13 workflows, only **three are proven to work today**: Thinkific enrolment (orders #6 and #14), order to Vtiger (orders #13 and #14), and cart abandonment as far as queuing (execution 802, delivery of reminder 1 not yet confirmed).
- **Seven are active but broken or never triggered** (details per workflow below): lead forms to Vtiger (fixed in git on 1 Oct, not re-imported), Cal.com to Vtiger (no Cal.com webhook configured, same Vtiger faults), MeiliSearch sync (env vars missing in the n8n container), video access log (the web container never calls it), membership expiry and renewal (query columns that do not exist in the repo schema), weekly report (same schema problem plus a Medusa v1 auth header).
- **Two are blocked on Sage credentials** (KI010): order to Sage fails on every order today and emails an alert each time; the Sage daily audit uses a Medusa v1 auth header and would 401.
- **One is dead**: Vibe Marketing sync monitor is inactive and nothing (not even Vibe) calls it.
- Moving to code fixes KI056 for free (orders lost while n8n restarts) because the work runs in-process with a durable retry queue.
- Recommended order: foundation, then Thinkific, order to Vtiger, lead forms, cart abandonment, membership lifecycle, then Cal.com, search, video log, Sage pair, weekly report, retire the monitor, switch n8n off.
- **Estimate: about 79 hours** in total (range 70 to 90). The customer-critical part (foundation plus the first five) is about 54 hours.

---

## 2. Inventory

Legend for "Live state": PROVEN = shown working end to end on the review VPS; BROKEN = active but cannot succeed as built; IDLE = active but its trigger never fires; BLOCKED = waiting on external credentials; DEAD = inactive and unused.

| # | Workflow (file) | Trigger | Systems touched | Live state | Needed? | Already in our code |
|---|---|---|---|---|---|---|
| 1 | medusa-thinkific-enrollment | Webhook `POST /webhook/medusa-order-complete`, from `order-placed.ts` (only when `N8N_THINKIFIC_ENROLLMENT_WEBHOOK_URL` is set) | Thinkific (find/create user, enrol per course), Brevo (buyer mail, admin alerts) | PROVEN (KI041, orders #6, #14) | Yes, customer-critical | Nothing. Order payload already built by the subscriber |
| 2 | medusa-order-to-vtiger | Webhook `POST /webhook/medusa-order-vtiger`, from `order-placed.ts` | Vtiger (login, find, create/update contact, create Event), Brevo alert | PROVEN (KI054, order #13) | Yes | `apps/medusa/src/modules/vtiger/service.ts` (registered, unused, still has the KI054 defects) |
| 3 | lead-magnet-to-vtiger | Webhook `POST /webhook/lead-magnet-submission`, awaited by `apps/web/app/api/lead-magnet/route.ts` (6 forms post there) | Vtiger, Brevo alert | BROKEN on the box (KI054 faults), fixed in git 86ea858, not re-imported, never proven | Yes | The route already validates, waits (B13) and forwards to Vibe |
| 4 | cart-abandonment-recovery | Webhook `POST /webhook/cart-updated`, from `cart-updated.ts` (30 min in-memory debounce) | Medusa store API (cart status), web `/api/email/cart-abandonment` (Brevo) | Queuing PROVEN 29 Sep (exec 802); reminder delivery unconfirmed | Yes (consent wording open) | All three templates and the send route in `apps/web/lib/email/cart-abandonment-*.ts`; route re-checks cart status and suppression list |
| 5 | membership-expiry-check | Cron `0 7 * * *` (09:00 SAST) | Supabase REST (`member_subscriptions`), web `/api/email/membership-expired` | BROKEN: selects `tier_slug`, `expires_at`, `profiles(first_name,email)`; repo schema has `tier_id`, `end_date`, and `profiles` has no email | Yes, if paid memberships are sold | Email template and route `apps/web/lib/email/membership-expired.ts`; Medusa `memberships` module has `expires_at` |
| 6 | membership-renewal-check | Cron `0 7 * * *` | Supabase REST, web `/api/email/membership-renewal-reminder` | BROKEN (same columns). Also no dedupe: a 7-day window run daily would send up to 7 reminders. Error branch posts junk to the reminder route | Yes, if paid memberships are sold | Template and route `membership-renewal-reminder.ts` |
| 7 | calcom-booking-to-vtiger | Webhook `POST /webhook/calcom-booking`, forwarded by `apps/web/app/api/webhooks/calcom/route.ts` (HMAC verified there) on `BOOKING_CREATED` | Vtiger (contact, Activity, pipeline stage), Brevo alert | IDLE: Cal.com has no webhook configured (worklog 1 Oct). Would also fail: elementType `Activities`, no `assigned_user_id`, update drops mandatory fields | Yes (discovery calls into CRM) | Signature check and payload schema already in the route |
| 8 | meilisearch-content-sync | Webhook `POST /webhook/product-updated` from `product-updated.ts`, plus cron `0 0 * * *` full reindex | Medusa admin API, MeiliSearch `products` index | BROKEN: n8n container has no `MEDUSA_BACKEND_URL`, `MEILISEARCH_HOST`, `MEILISEARCH_ADMIN_KEY`; webhook branch reads `$json.productId` instead of `body.productId`; Bearer auth with an `sk_` key (KI048) | Yes (search goes stale otherwise) | `apps/medusa/src/scripts/seed-meilisearch.ts` (document shape, index settings); Medusa container already has the Meili env vars |
| 9 | bunny-video-access-log | Webhook `POST /webhook/video-access-log` from `apps/web/app/api/video/[videoId]/route.ts` | Supabase REST insert into `video_access_log` | IDLE: route only calls it when `N8N_BASE_URL` is set, and the web container does not have that var. `video_access_log` is not created by any migration in the repo | Doubtful (see open questions) | Route has user, video and tier at hand |
| 10 | medusa-order-to-sage | Webhook `POST /webhook/medusa-order-placed` from `order-placed.ts` | Sage SA v2 (customer, tax types, accounts, TaxInvoice), Medusa admin (order metadata), Brevo alert | BLOCKED (KI010): fails on every order, alert mail each time. Also uses the 15% VAT tax type although the company is not VAT registered (KI033, KI007) | Only if Sage goes live | `apps/medusa/src/modules/sage/service.ts` (same logic, registered, unused) |
| 11 | sage-invoice-sync (daily audit) | Cron `0 4 * * *` (06:00 SAST) | Medusa admin orders, Brevo alert | BLOCKED, and sends `x-medusa-access-token` (v1 header), so it most likely 401s on v2 | Only with #10 | Nothing |
| 12 | weekly-report | Cron `0 6 * * 1` (Mon 08:00 SAST) | Supabase counts, Medusa orders (`status=completed`), Brevo | BROKEN: `tier_slug` column, v1 auth header; digital orders may never reach `completed`, so revenue would read 0 | Ask Johan | Nothing |
| 13 | vibe-marketing-sync-monitor | Webhook `POST /webhook/vibe-sync-confirm` | n8n SMTP node (credential never created) | DEAD: inactive; no caller anywhere (searched `C:\Projects\vibe-marketing`) | No, retire | Vibe calls already live in `order-placed.ts` and the lead route |

Note: the Medusa `order-placed.ts` subscriber also does invoice PDF, order confirmation mail, membership activation, portal access and Vibe onboarding in-process. Those are not n8n and stay as they are.

---

## 3. Per-workflow detail and target design

Conventions used below:
- "Flag" means the per-automation switch from section 5 (`AUTOMATION_<NAME>` = `n8n` | `shadow` | `code` | `off`).
- "Outbox" means the durable job table from section 4.2. "Clients" means the shared package from section 4.1.
- Customer and staff mails keep their current senders: buyer mail from `EMAIL_FROM_ADDRESS` (hello@), staff alerts from noreply@ to `ALERT_EMAIL`.

### 3.1 Thinkific enrolment (workflow 1)

**Today, step by step**
1. Reads `x-webhook-secret` from headers, compares to `N8N_WEBHOOK_SECRET` (only if set).
2. Parses `body`: email (lowercased), first/last name with fallback customer -> billing address -> shipping address -> email local part (Thinkific 422s on a blank last name).
3. Course items: every line item whose `variant.product.metadata.thinkific_course_id` is set, as `Number(...)`. None -> exit quietly.
4. `GET https://api.thinkific.com/api/public/v1/users?query[email]=` with `Authorization: Bearer THINKIFIC_API_KEY`.
5. Not found -> `POST /users` `{first_name,last_name,email,send_welcome_email:true}`.
6. For each course: `POST /enrollments` `{course_id,user_id,activated_at:now}`; per-course failures are collected, others continue.
7. Any success -> Brevo mail to buyer "Your course access is ready - <titles>", sender Dr Suzanne Ravenall, reply-to sravenall@, link to the Thinkific collections page.
8. Any failure -> Brevo alert to `ALERT_EMAIL` (default admin@suzanneravenall.com) listing failed course ids. User lookup/create failure -> fatal alert, stop.

Retries: none. Idempotency: none (a replayed webhook re-POSTs enrolments). Env: `THINKIFIC_API_KEY`, `BREVO_API_KEY`, `N8N_WEBHOOK_SECRET`, `ALERT_EMAIL`, `EMAIL_FROM_ADDRESS` (via the 29 Sep change).

**Target**
- `order-placed.ts`: when flag = `code`, call `automations.enqueue('thinkific_enrolment', order.id, slimOrder)` and trigger an immediate run. No HTTP hop.
- Handler `apps/medusa/src/automations/thinkific-enrolment.ts` uses `ThinkificClient` from the shared package. Idempotency key per course: `thinkific:<order_id>:<course_id>`; before POSTing, check `GET /enrollments?query[user_id]=&query[course_id]=` so a retry never duplicates.
- Buyer mail: move the inline HTML into a React Email template `apps/web/lib/email/course-access.ts` plus route `/api/email/course-access` (same pattern and secret check as `membership-welcome`). Medusa calls it like the existing membership welcome call. Copy unchanged except to match the design standard.
- Failures: outbox retries (1m, 5m, 30m, 2h, 12h); after the last attempt the job goes `dead`, Sentry event with order id (no email in the event, POPIA), and one staff alert listing the courses to enrol by hand.
- Env moves to the medusa service: `THINKIFIC_API_KEY`, `BREVO_API_KEY`, `ALERT_EMAIL`.

**Test plan**
- Unit (mocked fetch): course extraction incl. no-course order; name fallbacks; existing vs new user; partial failure keeps going; already-enrolled skip; retry schedule; dead-job alert fires once.
- Shadow run: flag `shadow` on the next N QA orders; code logs the exact Thinkific calls it would make, compare with the n8n execution.
- Live (Johan approves): one voucher order with the QA buyer on one course product, flag `code`. Writes one enrolment for the existing QA Thinkific user in Suzanne's live Thinkific; enrolment deleted afterwards per the SELF-TEST-PLAN cleanup table. Buyer mail goes to `QA_BUYER_EMAIL` only.

**Effort:** 8 h (client 2, handler + idempotency 3, mail template + route 2, live check 1).

### 3.2 Order to Vtiger (workflow 2)

**Today**
1. Requires `body.customer.email` and `body.total >= 0`.
2. Names with the same fallback chain; `totalZar = total/100`; product names joined (variant title appended unless "Default").
3. Vtiger auth: `getchallenge` -> MD5(token + `VTIGER_ACCESS_KEY`) -> `login`; keeps `sessionName` and `userId`.
4. `SELECT * FROM Contacts WHERE email='...' LIMIT 1;`
5. Existing: `update` with id, `assigned_user_id`, firstname, lastname, email (update replaces the record), `cf_last_purchase_date`, `cf_total_spend_zar` = old + this order, `cf_pipeline_stage = 'Closed Won'`.
6. New: `create` Contacts with `leadsource 'Shop'`, the same custom fields.
7. `create` Events: activitytype Call, subject "Purchase - <products>, R<total>", 15 min, eventstatus Held, linked to the contact.
8. Any error -> Brevo alert. Ends "success" either way, which hid KI046.

Retries: none. Idempotency: none; a replay double-counts `cf_total_spend_zar`. Env: `VTIGER_URL`, `VTIGER_USERNAME`, `VTIGER_ACCESS_KEY`, `BREVO_API_KEY`, `ALERT_EMAIL`.

**Target**
- Outbox job `vtiger_order` keyed by order id (stops double-counted spend), enqueued in `order-placed.ts`.
- Handler uses the shared `VtigerClient.upsertContactByEmail()` and `createEvent()`; the four KI054 fixes live in the client once, not per workflow. Prefer Vtiger `revise` (partial update) over `update` so mandatory fields cannot be dropped; fall back to the read-merge-update pattern if `revise` is not enabled on Suzanne's instance.
- Replace `apps/medusa/src/modules/vtiger/service.ts` internals with a thin wrapper around the shared client (keeps the module key `vtigerModule`).

**Test plan**
- Unit: spend increment, create vs update branch, mandatory fields present on update, Events payload, session re-login on `INVALID_SESSIONID`, idempotent replay.
- Live (Johan approves): one QA order; updates the existing QA contact 12x188 and adds one Event in Vtiger; Event removed afterwards by Johan via `/crm` if wanted.

**Effort:** 5 h (handler 2, shared Vtiger client counted in section 4, tests 2, live 1).

### 3.3 Lead forms to Vtiger (workflow 3)

**Today**
Webhook body from the lead route: `email`, `firstName`, `source`, `quizResult`, `timestamp`. Validates email, first name, source. Vtiger auth, find by email; existing -> update with mandatory fields and `leadsource` only if blank; new -> create with `leadsource 'Lead Magnet'`, `cf_pipeline_stage 'New Lead'`; then an Event "Website form - <source>". Error -> Brevo alert. `quizResult` is dropped. The web route waits up to 10 s and returns 502 to the visitor if n8n fails (B13).

**Target**
- In `apps/web/app/api/lead-magnet/route.ts`, replace the n8n `fetch` with `await syncLeadToVtiger({...})` from `apps/web/lib/integrations/vtiger.ts` (wrapping the shared client). Keep the 10 s budget, one retry, and the 502 semantics.
- Recommended improvement: first insert the lead into a Supabase `leads` table (durable), then push to Vtiger; a Vtiger outage then never loses a lead and a nightly job can re-push unsynced rows. Needs Johan's yes (open question 9).
- Map `quizResult` into the Event description (cheap, useful for Suzanne's team).
- Sentry on failure without the email (already the pattern in this route).

**Test plan**
- Unit: existing route tests (`route.test.ts`) re-pointed from the n8n URL to a mocked client; 502 on client failure; Vibe not called on failure; quizResult in the Event.
- Live (Johan approves): one submission per distinct form source with the QA email; creates/updates the QA contact and one Event per submission.

**Effort:** 4 h (+2 h if the Supabase leads table is approved).

### 3.4 Cart abandonment (workflow 4)

**Today**
`cart.updated` subscriber (in-memory 30 min debounce per cart, lost on restart) posts `cartId, email, firstName, items, total, currency, cartUrl`. n8n checks email and items, verifies the secret, then: wait 1 h -> store cart `completed_at`? -> email 1; wait 23 h -> check -> email 2; wait 48 h -> check -> email 3. Each send goes to web `/api/email/cart-abandonment` (template 1/2/3), which checks the cart again and the suppression list. Env in n8n: `N8N_WEBHOOK_SECRET`, `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`.

Gaps: the clock starts at the first queued update, not the last activity; a cart updated again after 30 min starts a second parallel n8n chain (duplicate reminders possible); waits sit in n8n's DB.

**Target**
- New model `cart_recovery` in the automations module: `cart_id` (unique), `email`, `first_name`, `step` (0..3), `next_send_at`, `last_activity_at`, `status` (active, completed, stopped).
- `cart-updated.ts`: upsert the row (no debounce needed, the unique key is the debounce); `next_send_at = last_activity_at + 1h` while step = 0.
- Medusa scheduled job `jobs/cart-recovery.ts` every 10 min: for due rows, read the cart in-process via Query (completed -> mark completed, stop), else POST to the existing web route with the template number, then step+1 and next_send_at += 23 h / 48 h. Stop after step 3.
- Web route gains a sent-log check `(cart_id, template)` so n8n and code can never both send the same reminder during the overlap (n8n chains already waiting keep running up to 72 h after the flip).

**Test plan**
- Unit: upsert idempotency, schedule math, stop on completed / not found / unknown, step progression, dedupe at the route.
- Time-compressed live test: env `CART_RECOVERY_DELAYS=60s,120s,180s` on the review box only, QA cart, three mails to `QA_BUYER_EMAIL`. Johan approves the env change and restores it.

**Effort:** 8 h.

### 3.5 Membership expiry and renewal (workflows 5 and 6)

**Today**
Expiry: daily 07:00 UTC, select active rows with `expires_at <= now`, PATCH `status=expired` by `user_id`, POST `/api/email/membership-expired` (email, firstName, tier). Renewal: daily, select active rows expiring within 7 days, POST `/api/email/membership-renewal-reminder` (email, firstName, tier, renewalDate). Env: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL`, `N8N_WEBHOOK_SECRET`.

Problems found:
- Column names do not match the repo schema (`001_foundation.sql`: `tier_id` uuid FK, `end_date`; `profiles` has `full_name`, no `email`, and joins on `user_id`, not by FK from `member_subscriptions`). Unless the live DB differs, both crons fail on every run.
- Renewal has no "already reminded" marker: up to 7 mails per member.
- Two stores of truth: the Medusa `memberships` module (`expires_at`, set by `activateMembership`) and Supabase `member_subscriptions` (what the portal reads). `order-placed.ts` writes `tier_id: <slug>` into what the repo schema says is a uuid FK; that mirror may be failing too (verify).

**Target**
- One Medusa scheduled job `jobs/membership-lifecycle.ts`, daily 07:00 UTC (09:00 SAST).
- Source of truth: the Medusa memberships module (it has `expires_at` and the order link). For each due record: set Medusa status expired, mirror to Supabase `member_subscriptions` (status `expired`) for the portal, send the expiry mail via the existing web route.
- Renewal: add `renewal_reminder_sent_at` to the Medusa model; send once when `expires_at` is within 7 days and the marker is empty; clear it on reactivation.
- Email address from the Medusa customer (always present), not from `profiles`.

**Test plan**
- Unit: due selection, single reminder, expiry mirrors to Supabase, missing Supabase user handled, mail payloads.
- Live (Johan approves): one QA membership row with `expires_at` set into the 7-day window, then into the past, on the review DB; two mails to `QA_BUYER_EMAIL`; row removed afterwards.

**Effort:** 9 h (depends on open question 2).

### 3.6 Cal.com booking to Vtiger (workflow 7)

**Today**
Validates attendee email, title, start time; normalises Cal.com v1 and v2 payload shapes; Vtiger auth; find or create contact (`leadsource 'Discovery Call'`, `cf_pipeline_stage 'Discovery Call Booked'`); create `Activities` (Call, Planned, booking date/time, booking UID in description); update pipeline stage; Brevo alert on error. Never fired: Cal.com has no webhook pointing at the site.

**Target**
- In `apps/web/app/api/webhooks/calcom/route.ts`, after the existing HMAC check, schedule `syncBookingToVtiger()` with Next 15 `after()` so Cal.com still gets an immediate 200. Inline retry (3 attempts, backoff) inside the shared client; Sentry on final failure plus staff alert.
- Uses Events with duration from `startTime`/`endTime`, `assigned_user_id`, and `revise` for the stage. Idempotency: skip if an Event with the booking UID already exists for the contact.
- Also handle `BOOKING_CANCELLED` / `BOOKING_RESCHEDULED` later (not in n8n today; optional).

**Test plan**
- Unit: v1 and v2 payloads, signature failure path unchanged, Events payload, idempotent replay.
- Live (Johan approves): Johan adds the Cal.com webhook (`CALCOM_WEBHOOK_SECRET` already exists in the web env), one test booking with the QA email, then cancels it.

**Effort:** 4 h.

### 3.7 MeiliSearch product sync (workflow 8)

**Today**
Webhook branch: fetch one product from the Medusa admin API, transform (id, handle, title, description, thumbnail, status, lowest ZAR price, collection, categories, variant titles), `POST /indexes/products/documents`. Cron branch: fetch up to 500 published products, `PUT` documents. Broken as described in the inventory. Index was seeded manually on 19 Aug.

**Target**
- Subscriber `product-search-sync.ts` on `product.created`, `product.updated`, `product.deleted` (replaces `product-updated.ts`): read the product in-process via Query (no admin token), reuse the document transform from `seed-meilisearch.ts` (move it into the shared package so the seed script and the sync share one shape), upsert; delete on `product.deleted` or when status is not published.
- Nightly job `jobs/search-reindex.ts` 00:00 UTC: full rebuild, paginated (no 500 cap), removes documents for products that no longer exist.
- Env already on medusa: `MEILISEARCH_HOST`, `MEILISEARCH_ADMIN_KEY`.

**Test plan**
- Unit: transform parity with the seed script, unpublished -> delete, pagination.
- Live (no approval needed, no customer data): edit a draft product title on the review admin, search for it, revert.

**Effort:** 4 h.

### 3.8 Video access log (workflow 9)

**Today**
Secret check, then `POST {SUPABASE_URL}/rest/v1/video_access_log` with `user_id, video_id, tier, accessed_at`. Never called.

**Target (if kept)**
- Insert directly from `apps/web/app/api/video/[videoId]/route.ts` with the service-role client, fire-and-forget, `logError` on failure. Add the missing migration for `video_access_log` (with RLS: service role only) and a retention rule (POPIA).
- Otherwise delete the call and the workflow.

**Test plan:** unit test on the route with a mocked Supabase client; live: play one video as the QA member, check one row.

**Effort:** 1.5 h (or 0.5 h to retire).

### 3.9 Order to Sage and the Sage daily audit (workflows 10 and 11)

**Today**
Per order: Basic auth (`SAGE_EMAIL`:`SAGE_PASSWORD`) plus `apikey` and `companyid` query params; customer search (first 100 only, so it misses customers beyond page 1), create customer if not found, get tax types and chart of accounts, pick default or 15% tax type and an income account by heuristic, create `TaxInvoice/Save` with tax-inclusive lines, write `sage_invoice_id`, `sage_document_number`, `sage_synced_at` to the order metadata via the admin API (v1 header), alert on error. Audit: daily, list last 24 h orders, alert for those without `sage_document_number`.

**Target**
- Outbox job `sage_invoice` keyed by order id, handler calls the Sage client (logic already in `modules/sage/service.ts`, which paginates customers properly). Metadata written in-process via the order module (no admin token).
- Tax type: must not be 15% VAT while the company is not VAT registered (KI033). Use a configured `SAGE_TAX_TYPE_ID` (no VAT / exempt) and `SAGE_INCOME_ACCOUNT_ID`; refuse to run without them.
- The audit becomes a check inside the outbox: any `sage_invoice` job `dead` or missing for an order older than 24 h appears in one daily staff alert. No separate cron needed beyond the outbox report job.
- Flag default `off` until credentials and the tax decision exist. This alone stops the per-order failure alerts n8n sends today.

**Test plan**
- Unit only until credentials exist (mocked Sage responses, pagination, tax-type guard).
- Live (Johan and Suzanne's bookkeeper approve): only against a Sage trial company if Sage offers one; never against her real books without a named approver.

**Effort:** 7 h (5 per-order, 2 audit/report), parked until KI010 closes.

### 3.10 Weekly report (workflow 12)

**Today**
Monday 06:00 UTC: Supabase counts of new paid and new free subscriptions, Medusa completed orders revenue for 7 days, total videos; Brevo HTML report to `ALERT_EMAIL`.

**Target (if kept)**
- Medusa job `jobs/weekly-report.ts`: orders and revenue via Query in-process (use `payment_status` captured or all placed orders, not `status=completed`), memberships from the Medusa module, video count from Supabase, plus useful additions now available in code: Thinkific enrolments made, leads captured, cart recoveries sent and recovered, outbox failures. Recipient list from an env var.

**Test plan:** unit test of the aggregation; live run once to Johan's address only.

**Effort:** 4 h (or 0 if retired).

### 3.11 Vibe Marketing sync monitor (workflow 13)

Retire. Nothing calls it, the workflow is inactive, and the Vibe calls that matter already log to Sentry in the lead route. If a delivery confirmation is wanted later, add a small signed web route then.

**Effort:** 0.5 h (delete the export, update docs).

---

## 4. Shared modules

### 4.1 `packages/integrations` (new workspace package)

The monorepo already has `packages/config` and `packages/ui`, and `order-placed.ts` notes that cross-app code cannot be shared without a package. One plain TypeScript package (no Medusa or Next imports) used by both apps:

| File | Purpose |
|---|---|
| `http.ts` | `fetchWithRetry(req, { retries: 3, baseDelayMs: 500, timeoutMs: 10000 })`: retries on network errors, 429 and 5xx with jittered backoff; never retries 4xx except 429; returns parsed JSON or throws a typed `IntegrationError { system, status, code, retriable }` |
| `vtiger.ts` | `VtigerClient`: challenge/login with cached session and re-login on `INVALID_SESSIONID`/`ACCESS_DENIED`; `findContactByEmail` (escaped, trailing semicolon); `upsertContactByEmail(fields, opts)` using `revise` or read-merge-update with mandatory fields; `createEvent(contactId, {subject, description, start, durationMin})` with `assigned_user_id` from login; `findEventByMarker` for idempotency |
| `thinkific.ts` | `ThinkificClient`: `findUserByEmail`, `createUser`, `getEnrolment(userId, courseId)`, `enrol(userId, courseId)` |
| `sage.ts` | `SageClient`: moved from `modules/sage/service.ts`, plus tax-type guard |
| `brevo.ts` | `sendTransactional` (for Medusa-side staff alerts), `sendStaffAlert(subject, rows)` with a per-subject throttle (max 1 per 15 min) so an outage cannot flood the inbox |
| `meili.ts` | `upsertDocuments`, `deleteDocument`, `productToSearchDoc` (one shape for sync and seed) |
| `dry-run.ts` | When `AUTOMATION_DRY_RUN=true` or an automation is in `shadow`, every write method logs the exact payload (with emails masked) and returns a fake id; reads still run |

Build wiring: add the package to the Medusa and web Dockerfiles and to `transpilePackages` in Next; Medusa compiles it through its own build. This is the riskiest bit of plumbing, so it goes first and is proven with one trivial import before any automation moves.

### 4.2 Medusa `automations` module (durable outbox)

The review stack has no Redis: Medusa runs the in-memory event bus and workflow engine, so a restart mid-handler loses work (KI056 is the same problem on the n8n side). A small Postgres-backed outbox in the Medusa DB fixes that without new infrastructure:

- Model `automation_job`: `id`, `automation`, `idempotency_key` (unique), `payload` (json), `status` (pending, running, done, failed, dead), `attempts`, `next_attempt_at`, `last_error` (no PII), `result` (json), timestamps.
- Service: `enqueue(automation, key, payload)` (insert, ignore on duplicate key), `runOne(id)`, `runDue(limit)`.
- `jobs/automation-runner.ts`: Medusa scheduled job every minute, picks due jobs with a row lock (`FOR UPDATE SKIP LOCKED`), backoff 1 m, 5 m, 30 m, 2 h, 12 h, then `dead`.
- Subscribers enqueue and kick `runOne` immediately, so the happy path is still seconds, not a minute.
- Model `cart_recovery` (section 3.4) lives in the same module.
- `jobs/automation-report.ts`: daily 05:00 UTC, one staff mail only if there are `dead` jobs or Sage gaps (replaces the Sage audit).

### 4.3 Failure logging and alerting

- Medusa has `SENTRY_DSN` mapped (from `SENTRY_DSN_MEDUSA`) but no Sentry SDK installed. Add `@sentry/node`, init in `instrumentation` / a loader, reuse the scrubbing rules from `apps/web/lib/sentry-scrub.ts` (no emails in events).
- Every handler logs one structured line per attempt: `[automation] name=... key=... attempt=... outcome=... ms=...`.
- Sentry: every `dead` job and every unexpected exception (tag `automation`, `system`). Staff alert mail only for things a human must do (enrol by hand, fix a contact, Sage gap), throttled.
- Web side keeps `logError` from `apps/web/lib/log.ts`.

### 4.4 Env changes (names only)

- medusa service: add `THINKIFIC_API_KEY`, `BREVO_API_KEY`, `ALERT_EMAIL`, `EMAIL_FROM_ADDRESS`, `SAGE_EMAIL`, `SAGE_PASSWORD`, `SAGE_API_KEY`, `SAGE_COMPANY_ID`, `SAGE_API_URL`, `SAGE_INCOME_ACCOUNT_ID`, new `SAGE_TAX_TYPE_ID`, the `AUTOMATION_*` flags, `AUTOMATION_DRY_RUN`.
- web service: add the `AUTOMATION_LEADS`, `AUTOMATION_CALCOM`, `AUTOMATION_VIDEO_LOG` flags and `ALERT_EMAIL`. `VTIGER_*` already present.
- After cutover: remove `N8N_WEBHOOK_URL`, `N8N_BASE_URL`, `N8N_THINKIFIC_ENROLLMENT_WEBHOOK_URL`; rename `N8N_WEBHOOK_SECRET` to `INTERNAL_WEBHOOK_SECRET` (read both during a transition release); drop the stale `SAGE_CLIENT_ID` / `SAGE_CLIENT_SECRET` from the web service; remove the n8n service, its volume and its nginx route.
- Real values are pulled from Vaultwarden into the VPS `infra/.env` at the point of use, never written into the repo.

---

## 5. Running both safely during cutover

One flag per automation, read at call time:

| Flag | Where read | Values |
|---|---|---|
| `AUTOMATION_THINKIFIC` | medusa `order-placed.ts` | `n8n` (default), `shadow`, `code`, `off` |
| `AUTOMATION_VTIGER_ORDER` | medusa `order-placed.ts` | same |
| `AUTOMATION_SAGE` | medusa `order-placed.ts` | default `off` |
| `AUTOMATION_CART_RECOVERY` | medusa `cart-updated.ts` and the job | same |
| `AUTOMATION_MEMBERSHIP` | medusa job | `n8n` means job does nothing |
| `AUTOMATION_SEARCH_SYNC` | medusa subscriber and job | same |
| `AUTOMATION_WEEKLY_REPORT` | medusa job | same |
| `AUTOMATION_LEADS` | web lead route | same |
| `AUTOMATION_CALCOM` | web Cal.com route | same |
| `AUTOMATION_VIDEO_LOG` | web video route | same |

Why this guarantees no double firing:
- **Webhook-triggered workflows** (1, 2, 3, 4, 7, 8, 9, 10) only run when our own code calls n8n. Each call site picks exactly one branch: `n8n` calls the webhook, `code` runs in-process, `off` does nothing. `shadow` calls n8n for real and runs the code in dry-run (logs payloads, writes nothing), which lets us compare on real traffic with zero risk.
- **Cron workflows** (5, 6, 11, 12 and the nightly half of 8) fire on their own inside n8n, so a flag cannot stop them. For these the flip is a two-step change in one window: deactivate the n8n workflow in the n8n UI first, then set the flag to `code`. The job refuses to run if its flag is not `code`.
- **Cart abandonment overlap:** n8n chains already waiting keep running up to 72 h after the flip. Both paths send through the same web route, and the new `(cart_id, template)` sent-log makes the second send a no-op.

Per-automation cutover routine:
1. Deploy the code with the flag at `n8n` (no behaviour change). Unit tests green in CI.
2. Flag `shadow` for 2 to 7 days; compare dry-run logs with n8n executions.
3. Johan approves the flip. Flag `code`; for crons, deactivate the n8n workflow first.
4. One live verification with the QA identity (section 6), approved per item.
5. Watch Sentry and the outbox for 7 days. Rollback is setting the flag back to `n8n` (and re-activating a cron workflow), one env change and a container recreate.
6. Deactivate the n8n workflow permanently once stable.

Flags are env vars, so a flip is a `docker compose up -d --no-deps medusa` (or `web`). n8n must not be restarted while order flags are still `n8n` (KI056).

---

## 6. Test principles (all automations)

- **Unit tests** use mocked `fetch` only. Medusa has no test script today although `modules/vtiger/__tests__/vtiger.test.ts` is written for vitest; add vitest to `apps/medusa` and wire it into `turbo run test`.
- **No mail to Suzanne's team:** on the review box set `ALERT_EMAIL` to Johan's own address for the whole migration; buyer mail only to `QA_BUYER_EMAIL`. Confirm both before any live step.
- **No real records by accident:** every live check uses the single QA identity from SELF-TEST-PLAN (`QA SelfTest`, `QA_BUYER_EMAIL`, voucher `QA-SELFTEST-100`), the existing Vtiger contact 12x188 and the existing QA Thinkific user. Thinkific is Suzanne's live account and Vtiger is ours, so each live write is listed and approved by Johan per item, with the cleanup step named up front.
- **Dry-run first:** `AUTOMATION_DRY_RUN=true` or `shadow` before any `code` flip.

### What Johan must approve for live verification

| Automation | Live action | Real records created | Cleanup |
|---|---|---|---|
| Thinkific | 1 voucher order, 1 course product | 1 enrolment in Suzanne's live Thinkific (QA user) | Delete the enrolment via API, Johan's ok |
| Order to Vtiger | Same order | Update of contact 12x188, 1 Event | Optional Event removal via `/crm` |
| Lead forms | 1 submission per source | Contact update, 1 Event each | Optional |
| Cart abandonment | Compressed delays env on review box, 1 QA cart | 3 mails to QA inbox | Restore env |
| Membership | Edit 1 QA membership row twice | 2 mails to QA inbox | Remove the row |
| Cal.com | Add the Cal.com webhook, 1 test booking | Contact update, 1 Event | Cancel booking |
| Search | Edit a draft product title | Index entry | Revert title |
| Video log | Play 1 video as QA member | 1 log row | None |
| Sage | Only on a trial company, if any | Sage customer and invoice | Per bookkeeper |
| Weekly report | 1 run | 1 mail to Johan | None |

---

## 7. Cutover order and effort

Order follows "customer depends on it" first, lowest risk within that, then reports and monitors.

| Step | Item | Why here | Hours |
|---|---|---|---|
| 0 | Foundation: `packages/integrations` + Docker/Next wiring (4), outbox module + runner job (6), flags + staff alert + Sentry in Medusa (3), vitest in Medusa (1) | Everything else uses it | 14 |
| 0b | Shared Vtiger client with the KI054 fixes and tests | Used by steps 2, 3, 6 | 4 |
| 0c | Shared Thinkific client | Used by step 1 | 2 |
| 1 | Thinkific enrolment | A paying buyer gets nothing without it; also removes the KI056 restart hazard | 8 |
| 2 | Order to Vtiger | Proven flow, simple port, fixes the replay double-count | 5 |
| 3 | Lead forms to Vtiger | Probably never reached the CRM; the visitor waits on it | 4 (+2 optional leads table) |
| 4 | Cart abandonment | Revenue recovery; removes 72 h waits from n8n | 8 |
| 5 | Membership expiry + renewal | Broken today; customer-facing mails | 9 |
| 6 | Cal.com to Vtiger | Needs the Cal.com webhook anyway | 4 |
| 7 | MeiliSearch sync | Broken today; search stale after edits | 4 |
| 8 | Video access log | Never ran; keep or drop | 1.5 |
| 9 | Sage per order + daily report | Blocked on KI010; build behind `off` | 7 |
| 10 | Weekly report | Broken today; may be dropped | 4 |
| 11 | Retire Vibe monitor | Dead | 0.5 |
| 12 | Decommission: remove n8n service, env, nginx route, webhook code paths, rename secret, update README/runbook/KNOWN_ISSUES | Done when all flags are `code` or `off` for 7 days | 4 |
| | **Total** | | **79** (range 70 to 90) |

Customer-critical slice (steps 0 to 5): about 54 h. Calendar time is longer than the hours because of the shadow and watch windows (about 2 to 3 weeks if steps overlap).

Quick wins that need no migration and could ship now: set `AUTOMATION_SAGE`-equivalent behaviour today by deactivating the n8n Sage workflow (stops a failure alert per order); re-import the fixed lead workflow so leads reach Vtiger until step 3 lands.

---

## 8. Open questions for Johan

1. **Sage:** are Suzanne's Sage credentials still coming? If yes, which tax type and income account (she is not VAT registered, so not the 15% type)? If no, do we drop Sage and rely on our PDF invoice?
2. **Memberships:** the Supabase columns the n8n crons use do not exist in the repo schema, and `order-placed.ts` writes a tier slug into a uuid column. Should the Medusa memberships module be the single source of truth (portal mirrors it)? Are paid memberships on sale at launch, and is "renewal" a manual re-purchase every 30 days?
3. **Alerts:** who should receive staff alerts in production (`ALERT_EMAIL` defaults to admin@suzanneravenall.com)? OK to point it at you for the whole migration?
4. **Sentry:** are real DSNs in place for web and Medusa now, or do we need a Sentry project for Medusa first?
5. **Cart abandonment:** timing from last cart activity (proposed) or first? Consent wording at checkout is still unchecked (KI057); who approves it?
6. **Weekly report:** keep it? Recipients and the metrics you actually want?
7. **Video access log:** keep (needs a migration and a POPIA retention rule) or drop?
8. **Vibe monitor:** confirm we retire it.
9. **Lead durability:** add a Supabase `leads` table so a Vtiger outage never loses a lead (+2 h)? Should leads stay in Vtiger Contacts or go to the Leads module?
10. **Cal.com:** will the booking webhook be added to Cal.com, and do the Vtiger custom fields (`cf_pipeline_stage`, `cf_total_spend_zar`, `cf_last_purchase_date`) exist on Suzanne's instance (KI013 said they still had to be created)?
11. **Shared package:** OK to add `packages/integrations` (touches both Dockerfiles), or keep separate copies of the clients per app (faster, more drift)?
12. **Course-access mail:** OK to move it into a React Email template under the design standard (copy unchanged)?
13. **Housekeeping found while reading:** `BUILD_STATUS.md` contains the n8n admin login in plain text (lines near "n8n admin login"). It should move to Vaultwarden, be scrubbed from the file, and the n8n password rotated (moot once n8n is off). The worklog also notes a VPS root password held in a memory file.
