# @suzanne/integrations

Shared server-side clients for the automations that are moving out of n8n
(`docs/n8n-migration-plan.md`). Plain TypeScript, no Next or Medusa imports,
consumed from source (`transpilePackages` in `apps/web/next.config.mjs`).
Only the web app uses it so far; Medusa joins when the order automations move.

| File | What it does |
|---|---|
| `src/http.ts` | `fetchWithRetry`: per-attempt timeout, retries network errors, timeouts, 429 and 5xx with jittered backoff; never retries other 4xx |
| `src/vtiger.ts` | `VtigerClient`: challenge + accessKey login, cached session, re-login once on `INVALID_SESSIONID`, `query` / `retrieve` / `create` / `update` / `revise` |
| `src/leads.ts` | `syncLeadToVtiger`: the lead-magnet-to-vtiger n8n workflow in code |
| `src/flags.ts` | `automationMode`: reads a cutover flag (`n8n` / `code` / `off`) |
| `src/dry-run.ts` | `AUTOMATION_DRY_RUN=true`: no network call at all; writes are logged with emails masked and return fake ids |

Tests: `cd apps/web && npx vitest run ../../packages/integrations` (they run in
the web app's vitest, mocked fetch only).

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
