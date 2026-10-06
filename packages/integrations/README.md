# @suzanne/integrations

Shared server-side clients for the automations that are moving out of n8n
(`docs/n8n-migration-plan.md`). Plain TypeScript, no Next or Medusa imports,
consumed from source by both apps:

- web: `transpilePackages` in `apps/web/next.config.mjs`, workspace dependency;
- medusa: `"@suzanne/integrations": "file:../../packages/integrations"`. The
  Medusa Dockerfile copies this folder to `/packages/integrations` before
  `npm install`, npm links it into `node_modules`, and the same ts-node
  runtime that loads `apps/medusa/src` compiles it (the link resolves outside
  `node_modules`, so ts-node does not skip it). Locally `apps/medusa/tsconfig.json`
  maps the name to the source for type checks.

| File | What it does |
|---|---|
| `src/http.ts` | `fetchWithRetry`: per-attempt timeout, retries network errors, timeouts, 429 and 5xx with jittered backoff; never retries other 4xx |
| `src/vtiger.ts` | `VtigerClient`: challenge + accessKey login, cached session, re-login once on `INVALID_SESSIONID`, `query` / `retrieve` / `create` / `update` / `revise` |
| `src/leads.ts` | `syncLeadToVtiger`: the lead-magnet-to-vtiger n8n workflow in code |
| `src/thinkific.ts` | `ThinkificClient`: find user by email, create user, find enrolment, enrol |
| `src/thinkific-enrolment.ts` | `enrolOrderInThinkific`: the medusa-thinkific-enrollment n8n workflow in code, resumable |
| `src/order-vtiger.ts` | `syncOrderToVtiger`: the medusa-order-to-vtiger n8n workflow in code, resumable |
| `src/orders.ts` | The order snapshot shape and the buyer name fallback both order workflows used |
| `src/brevo.ts` | `sendBrevoEmail` (Brevo v3, same request as the web sender) and `createStaffAlerter` (throttled staff alerts for Medusa) |
| `src/flags.ts` | `automationMode`: reads a cutover flag (`n8n` / `code` / `off`) |
| `src/dry-run.ts` | `AUTOMATION_DRY_RUN=true`: no network call at all; writes are logged with emails masked and return fake ids |

Tests: `cd apps/web && npx vitest run ../../packages/integrations` (they run in
the web app's vitest, mocked fetch only). The parity tests load the n8n
exports from `infra/n8n/workflows/` and run their Code nodes
(`src/n8n-test-harness.ts`).

## Website leads (migration step 3)

`POST /api/lead-magnet` now:

1. validates the form (unchanged),
2. saves the lead in Supabase `public.leads` (migration
   `supabase/migrations/20261006120000_leads.sql`),
3. sends it to Vtiger (`LEADS_AUTOMATION=code`, the default) or to the old n8n
   webhook (`LEADS_AUTOMATION=n8n`), never both; `off` sends it nowhere,
4. marks the row `synced`, or leaves it `failed` and mails one throttled alert
   to `AUTOMATION_ALERT_EMAIL`.

The visitor sees an error (502) only when the lead was saved nowhere. If the
`leads` table does not exist yet, the route logs a warning and relies on Vtiger.

### Env (web service, names only)

| Name | Meaning |
|---|---|
| `LEADS_AUTOMATION` | `code` (default), `n8n` or `off`. `AUTOMATION_LEADS` is accepted as an alias |
| `AUTOMATION_ALERT_EMAIL` | Staff alert recipient. Empty = no mail, log only |
| `AUTOMATION_DRY_RUN` | `true` = log the Vtiger payloads, send nothing; rows stay `pending` |
| `INTERNAL_WEBHOOK_SECRET` | Secret for `/api/leads/retry`; falls back to `N8N_WEBHOOK_SECRET` |
| `VTIGER_URL`, `VTIGER_USERNAME`, `VTIGER_ACCESS_KEY` | Already on the web service |
| `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Already on the web service |

### Resending leads that did not reach Vtiger

No cron yet. Run on the VPS, from `infra/` (the secret is expanded inside the
container, so it is never typed or printed):

```sh
docker compose exec web sh -c 'curl -s -X POST http://localhost:3000/api/leads/retry \
  -H "content-type: application/json" \
  -H "x-webhook-secret: ${INTERNAL_WEBHOOK_SECRET:-$N8N_WEBHOOK_SECRET}" \
  -d "{\"limit\": 25}"'
```

It answers `{ ok, processed, synced, failed, dryRun }`. It resends rows with
status `pending` or `failed`, oldest first, at most 100 per call, and refuses
(409) unless `LEADS_AUTOMATION=code`. Repeat until `processed` is 0.

### Applying the migration (Johan, aimate-db1)

Run `supabase/migrations/20261006120000_leads.sql` against the site's
self-hosted Supabase database, then reload the PostgREST schema cache
(`NOTIFY pgrst, 'reload schema';`) so the web app sees the new table.

### Differences from the n8n workflow

- Existing contacts are changed with `revise` (only the listed fields), not
  `update`, which replaced the whole record and blanked every field not sent.
  Same fields and values as n8n. Instances without `revise` fall back to
  read-merge-update.
- The Event description also carries the quiz result, when there is one.
- Event date and time are both UTC (n8n used a UTC date with the container's
  local time).
- Failures: n8n mailed one alert per failed lead, to `ALERT_EMAIL` or
  admin@. Code mails at most one per 15 minutes to `AUTOMATION_ALERT_EMAIL`,
  without the visitor's email, and keeps the lead for the retry.
- The visitor no longer gets an error when only the CRM is down.

## Order automations (migration steps 0, 1 and 2)

Thinkific enrolment and order-to-Vtiger run inside Medusa, on a durable queue
in Medusa's own Postgres. Both flags default to `n8n`, so deploying this
changes nothing until a flag is flipped.

### Where the code lives

| Path | What it does |
|---|---|
| `apps/medusa/src/modules/automations/` | Module `automationsModule`: tables `automation_job` and `automation_mode_state` (migration `Migration20261006130000.ts`), the queue (`queue.ts`), its Postgres store (`pg-store.ts`, row locks with `FOR UPDATE SKIP LOCKED`, `ON CONFLICT` idempotency) and an in-memory store for dry runs and tests |
| `apps/medusa/src/automations/` | Flags (`config.ts`), the three job handlers (`handlers.ts`), dispatch per flag (`dispatch.ts`), the recovery sweep (`sweep.ts`), wiring (`runtime.ts`) |
| `apps/medusa/src/jobs/automation-runner.ts` | Scheduled job, every minute: recovery sweep, then every due retry |
| `apps/medusa/src/subscribers/order-placed.ts` | Calls the n8n webhook only in `n8n` mode; hands the order to the queue in `code` mode. Sage, invoice, confirmation mail, memberships, portal access and Vibe are unchanged |
| `apps/web/app/api/email/course-access/route.ts`, `apps/web/lib/email/course-access.ts`, `apps/web/lib/email/templates/CourseAccess.tsx` | The buyer's "course access is ready" mail as a React Email template, sent by the web app's Brevo sender; Medusa calls the route with the secret header |

Medusa tests: `cd apps/medusa && npx vitest run` (vitest comes from the
workspace root on purpose, so the Medusa image carries no test tooling).

### How a course order runs in `code` mode

1. `order.placed` creates one job per automation, keys
   `thinkific_enrolment:<order id>` and `vtiger_order:<order id>` (unique, so a
   replayed event is a no-op), and runs them at once in the background.
2. Thinkific: find the user by email or create it (`send_welcome_email: true`),
   then per course: skip if an active enrolment exists, else enrol. Progress
   (user id, per-course result) is saved after every step.
3. Newly opened courses get a `course_access_email:<order id>:<course ids>` job
   that POSTs to the web route (its own retries, so a mail outage never
   repeats an enrolment).
4. Vtiger: find the contact by email; revise it (spend plus this order, last
   purchase date, Closed Won) or create it (lead source Shop); then one Event.
   The contact step is saved before the Event, so a retry never adds the
   total twice.
5. Failure: retry after 1 min, 5 min, 30 min, 2 h, 12 h; after the sixth
   failed attempt the job is `dead`. Errors a retry cannot fix (HTTP 4xx
   other than 408/429, bad data) go `dead` at once. Staff get one alert when a
   job has failed 3 times (still retrying) and one when it is dead; a course
   Thinkific refuses (4xx) gets the n8n-style "partial failure" alert at once.
   Alerts go to `AUTOMATION_ALERT_EMAIL`, at most one per kind per 15 minutes.
6. A job left `running` by a crash is picked up again after its 10 minute lease.
7. Recovery sweep (every minute): orders placed since the flag went to `code`,
   older than 2 minutes and younger than 48 hours, that have no job yet (a
   lost `order.placed` event across a restart) are queued.

`off` holds queued jobs (not run, not failed) and queues nothing new.

### Env (medusa service, names only)

| Name | Meaning |
|---|---|
| `AUTOMATION_THINKIFIC` | `n8n` (default) / `code` / `off`. Thinkific enrolment and the course-access mail |
| `AUTOMATION_ORDER_VTIGER` | `n8n` (default) / `code` / `off`. Order to Vtiger. `AUTOMATION_VTIGER_ORDER` is accepted as an alias |
| `AUTOMATION_DRY_RUN` (fed from `MEDUSA_AUTOMATION_DRY_RUN` in `infra/.env`) | `true` = run the code with no network call and nothing stored, log what it would do; in `n8n` mode this is a shadow run next to the real n8n call |
| `AUTOMATION_ALERT_EMAIL` | Staff alert recipient (same variable as the web app). Empty = log only |
| `THINKIFIC_API_KEY` | Now also passed to medusa (was n8n only) |
| `BREVO_API_KEY` | Now also passed to medusa, for staff alerts |
| `INTERNAL_WEBHOOK_SECRET` | Optional; Medusa signs the course-access call with it, else with `N8N_WEBHOOK_SECRET` |
| `VTIGER_*`, `WEB_BASE_URL`, `N8N_WEBHOOK_SECRET` | Already on medusa |

### Migration

`apps/medusa/src/modules/automations/migrations/Migration20261006130000.ts`,
hand-written like the memberships one. It is applied by `medusa db:migrate`,
which the medusa container runs on every start (Dockerfile `CMD`), so a
normal rebuild and recreate of medusa creates the two tables. Additive only
(`CREATE TABLE IF NOT EXISTS`); nothing existing is touched.

### Looking at the queue on the box

```sh
docker compose exec postgres psql -U medusa -d medusa -c \
  "select automation, idempotency_key, status, attempts, next_attempt_at, last_error from automation_job order by created_at desc limit 20;"
```

A dead job can be retried by hand (Johan's ok first) with
`update automation_job set status='pending', attempts=0, next_attempt_at=now() where id='<id>';`.

### Differences from the n8n workflows

Thinkific (`medusa-thinkific-enrollment.json`):

- Durable and retried (1 min to 12 h); n8n had no retry, and orders were lost
  while n8n restarted (KI056). A lost `order.placed` event is recovered by the sweep.
- Idempotent: the same order never enrols twice; each course is checked for an
  active enrolment before the POST. An already active enrolment counts as
  success (and is in the mail) instead of a second POST. An expired one is
  enrolled again, as n8n would have done.
- The Thinkific user must match the buyer's email exactly; n8n took the first
  search result.
- A course id listed twice in one order is enrolled once.
- The buyer mail is the React Email template (same subject, wording, link,
  reply-to and sender) in the site's mail layout, with a plain-text part. If
  only some courses open now, the mail lists those; courses that open on a
  later retry get their own mail.
- No webhook secret check (no HTTP hop any more).
- Alerts go to `AUTOMATION_ALERT_EMAIL` (n8n: `ALERT_EMAIL` or admin@),
  throttled, buyer email masked (order number given instead). Network and 5xx
  failures are retried before anyone is alerted; n8n alerted on the first
  failure.

Order to Vtiger (`medusa-order-to-vtiger.json`):

- Existing contacts are changed with `revise` (only the listed fields), not
  `update`; same fields and values. Instances without `revise` fall back to
  read-merge-update.
- Durable and retried; the contact step is recorded, so a retry after a failed
  Event never adds the order total to `cf_total_spend_zar` twice, and the same
  order twice is a no-op (n8n double-counted a replay).
- Event times are UTC (n8n used the container's local time, which is UTC).
- Alerts as above; n8n mailed one alert per failure and still ended "success".
