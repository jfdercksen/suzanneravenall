# n8n Workflow Documentation

n8n version: **n8nio/n8n:2.20.9**
n8n public URL: `http://169.239.180.49/n8n` (IP testing) / `https://n8n.suzanneravenall.com` (production)
n8n internal Docker hostname: `n8n:5678`

All workflows are stored as importable JSON in `infra/n8n/workflows/`.

## Importing workflows

1. Open the n8n editor at the URL above.
2. Click the hamburger menu (top left) → Import from File.
3. Select the JSON file from `infra/n8n/workflows/`.
4. After import, open the workflow and click Activate (toggle top right).

Workflows are imported in inactive state. Activate each one manually after verifying
the required env vars are set in the n8n container.

---

## Webhook URL pattern

Internal (Medusa → n8n, Docker-to-Docker):
```
http://n8n:5678/webhook/<path>
```

Public (external services → n8n, via Nginx):
```
http://169.239.180.49/n8n/webhook/<path>
```

`N8N_PATH=/n8n/` in docker-compose only controls the public-facing URL shown in the
n8n editor UI. Internal Docker traffic goes directly to port 5678 without the path prefix.

---

## Workflows

### medusa-order-to-sage

- **Purpose:** Creates a Sage Business Cloud tax invoice for every Medusa order.
- **Trigger (internal):** `POST http://n8n:5678/webhook/medusa-order-placed`
- **Trigger (public):** `POST http://169.239.180.49/n8n/webhook/medusa-order-placed`
- **Required env vars (n8n container):**
  - `SAGE_EMAIL`
  - `SAGE_PASSWORD`
  - `SAGE_API_KEY`
  - `SAGE_COMPANY_ID`
  - `SAGE_API_URL` (default: `https://accounting.sageone.co.za/api/2.0.0`)
  - `MEDUSA_API_TOKEN`
  - `RESEND_API_KEY`

### medusa-order-to-vtiger

- **Purpose:** Creates or updates a Vtiger CRM contact and logs a purchase activity for every Medusa order.
- **Trigger (internal):** `POST http://n8n:5678/webhook/medusa-order-vtiger`
- **Trigger (public):** `POST http://169.239.180.49/n8n/webhook/medusa-order-vtiger`
- **Required env vars (n8n container):**
  - `VTIGER_URL`
  - `VTIGER_USERNAME`
  - `VTIGER_ACCESS_KEY`
  - `RESEND_API_KEY`

### calcom-booking-to-vtiger

- **Purpose:** Creates a Vtiger activity and contact when a Cal.com booking is created.
- **Trigger (public):** `POST http://169.239.180.49/n8n/webhook/calcom-booking`
- **Required env vars (n8n container):**
  - `VTIGER_URL`
  - `VTIGER_USERNAME`
  - `VTIGER_ACCESS_KEY`
  - `RESEND_API_KEY`
  - `N8N_WEBHOOK_SECRET`

### medusa-thinkific-enrollment

- **Purpose:** Enrolls Medusa course buyers into Thinkific automatically on order placement.
  Only processes orders where at least one line item has `product.metadata.thinkific_course_id` set.
  Orders with no course items exit cleanly without error.
- **Trigger (internal):** `POST http://n8n:5678/webhook/medusa-order-complete`
- **Trigger (public):** `POST http://169.239.180.49/n8n/webhook/medusa-order-complete`
- **Thinkific subdomain:** `ravenallinstitute-9629`
- **Thinkific admin:** https://ravenallinstitute-9629.thinkific.com
- **Thinkific API base:** `https://api.thinkific.com/api/public/v1`
- **Required env vars (n8n container):**
  - `THINKIFIC_API_KEY` — Bearer token with `write:all` scope. Set in `infra/.env`, referenced in the workflow as `{{$env.THINKIFIC_API_KEY}}`. Never hardcoded in the workflow JSON.
  - `RESEND_API_KEY` — Resend API key for confirmation and error alert emails.
  - `N8N_WEBHOOK_SECRET` — Shared secret. The workflow verifies the `x-webhook-secret` header sent by the Medusa subscriber.
  - `SENTRY_DSN` / `SENTRY_DSN_WEB` / `SENTRY_DSN_MEDUSA` — Optional. Any one of these is used for Sentry context in error alerts.
- **Required env var (Medusa container):**
  - `N8N_THINKIFIC_ENROLLMENT_WEBHOOK_URL=http://n8n:5678/webhook/medusa-order-complete`
- **Error handling:**
  - Fatal Thinkific API failure (user lookup or create fails) → admin alert email to `admin@suzanneravenall.com` → workflow stops.
  - Per-course enrollment failure → other courses continue → customer gets confirmation for successful courses → admin alert lists the failed courses for manual remediation.
  - Customer confirmation email failure → admin error branch still runs.
  - Order is never blocked.
- **Manual steps after import:**
  1. Import `medusa-thinkific-enrollment.json` into n8n via the editor UI.
  2. Verify `THINKIFIC_API_KEY` is set in the n8n container environment (added to `docker-compose.yml` under `n8n.environment`).
  3. Activate the workflow (toggle in the editor top right).
  4. Deploy the updated `docker-compose.yml` and `order-placed.ts` subscriber via the normal deploy pipeline (`git push origin main`).
  5. Place a test order with a product that has `metadata.thinkific_course_id` set and verify the n8n execution log shows a successful enrollment.

---

## Common env vars (all workflows)

| Variable | Where set | Purpose |
|---|---|---|
| `N8N_WEBHOOK_SECRET` | `infra/.env` → n8n + Medusa containers | Shared secret for webhook signature verification |
| `RESEND_API_KEY` | `infra/.env` → n8n container | Resend email delivery |
| `THINKIFIC_API_KEY` | `infra/.env` → n8n container | Thinkific API Bearer token |
| `N8N_THINKIFIC_ENROLLMENT_WEBHOOK_URL` | `infra/.env` → Medusa container | Internal URL for Thinkific enrollment webhook |

## Missing env vars — flags

- `ADMIN_EMAIL` is not present in `infra/.env`. All existing n8n workflows (Sage, Vtiger) hardcode
  `admin@suzanneravenall.com` directly in the email node JSON bodies. The Thinkific workflow follows the
  same pattern. If the admin email address changes, update each workflow's error alert node manually
  in the n8n editor, or add `ADMIN_EMAIL` to `infra/.env`, pass it through `docker-compose.yml` under
  `n8n.environment`, and reference it as `{{$env.ADMIN_EMAIL}}` in each workflow.
- `SENTRY_DSN` for n8n is not set in `infra/.env` (only `SENTRY_DSN_MEDUSA` and `SENTRY_DSN_WEB`
  exist, both as placeholders). The Thinkific workflow checks all three variants and uses the first
  non-placeholder value. Set a real DSN to enable Sentry capture from n8n workflows.
