---
name: add-n8n-workflow
description: Design and implement a new n8n automation workflow — replacing Zapier automations, connecting services via webhooks, or scheduling recurring jobs. Use when any automation between services is needed. Always export the workflow JSON and commit it to the repo.
allowed-tools: Bash, Read, Write, Edit, Glob, Grep
---

# Add n8n Workflow

## Goal
Design, document and implement a new n8n automation workflow that connects platform services reliably, handles errors gracefully and is version-controlled in the repository.

## Inputs
- Workflow name and purpose
- Trigger type (webhook, schedule, manual)
- Source service (what triggers it)
- Target service(s) (what it updates)
- Data transformation needed
- Error handling requirements

## Key References
- n8n docs: https://docs.n8n.io
- n8n webhook nodes: https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/
- n8n HTTP Request node: https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.httprequest/
- n8n error handling: https://docs.n8n.io/flow-logic/error-handling/
- n8n schedule trigger: https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.scheduletrigger/
- n8n Supabase node: https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.supabase/
- n8n code node: https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.code/

## Project Structure- Workflow exports: `infra/n8n/workflows/`
- Webhook handlers: `apps/web/app/api/webhooks/`
- Workflow documentation: `infra/n8n/README.md`

## Core Workflows This Project Needs

### Already Defined — implement in this order:
1. `medusa-order-to-sage` — New Medusa order → create invoice in Sage Business Cloud
2. `medusa-order-to-vtiger` — New Medusa purchase → create/update Vtiger contact
3. `calcom-booking-to-vtiger` — New Cal.com booking → create Vtiger activity
4. `lead-magnet-to-vibe` — New lead magnet signup → add to Vibe Marketing sequence
5. `membership-renewal-reminder` — Scheduled — check expiring memberships → send reminder via Resend
6. `cart-abandonment-recovery` — Cart abandoned in Medusa → 3-email recovery sequence via Resend
7. `meilisearch-content-sync` — New Payload CMS content → update MeiliSearch index
8. `bunny-video-access-check` — Member requests video → verify tier → return signed URL
9. `sage-invoice-sync` — Daily reconciliation between Medusa orders and Sage invoices
10. `weekly-report` — Scheduled — compile weekly stats → send to admin via Resend

## Process

### Step 1 — Document the workflow first
Before building anything, write the workflow spec:
```markdown
## Workflow: {workflow-name}

**Trigger:** {webhook URL / cron schedule / manual}
**Source:** {service that triggers this}
**Target:** {service(s) this updates}

**Flow:**
1. {trigger event description}
2. {data transformation or lookup}
3. {action in target service}
4. {error handling / notification}

**Error handling:**
- If {service} is unavailable: {fallback action}
- If data validation fails: {action}
- Alert channel: {Sentry / Resend admin email}

**Data mapping:**
| Source field | Target field | Transformation |
|---|---|---|
| {field} | {field} | {none / format / calculate} |
```

### Step 2 — Create the Next.js webhook handler (if webhook-triggered)
File: `apps/web/app/api/webhooks/{service}/route.ts`
```typescript
import { NextRequest, NextResponse } from "next/server"
import { verifyWebhookSignature } from "@/lib/webhooks/verify"

export async function POST(request: NextRequest) {
  // 1. Verify signature immediately
  const isValid = await verifyWebhookSignature(
    request,
    process.env.{SERVICE}_WEBHOOK_SECRET!
  )
  if (!isValid) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
  }
  // 2. Return 200 immediately — n8n expects fast response
  const payload = await request.json()

  // 3. Forward to n8n webhook URL
  fetch(process.env.N8N_{WORKFLOW}_WEBHOOK_URL!, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-N8N-Signature": process.env.N8N_WEBHOOK_SECRET!,
    },
    body: JSON.stringify(payload),
  }).catch(err => console.error("n8n forward error:", err))

  return NextResponse.json({ received: true })
}
```

### Step 3 — Build the n8n workflow
Build using n8n's visual editor. Every workflow must include:

**Required nodes for every workflow:**
1. Trigger node (Webhook, Schedule or Manual)
2. Input validation (IF node or Code node)
3. Main logic nodes
4. Success notification (optional but recommended)
5. Error workflow connected (always)

**Error workflow pattern:**
Error Trigger
→ Set node (format error message with workflow name, error, timestamp)
→ HTTP Request (POST to Sentry) OR Send Email via Resend to admin

### Step 4 — Export workflow JSON
After building in n8n UI:
1. Open workflow in n8n
2. Click ··· menu → Download
3. Save to `infra/n8n/workflows/{workflow-name}.json`
4. Commit to repository

### Step 5 — Document in README
Update `infra/n8n/README.md`:
```markdown
## {Workflow Name}
- **File:** `workflows/{workflow-name}.json`
- **Trigger:** {type and details}
- **Purpose:** {one sentence}
- **Services connected:** {list}
- **Webhook URL:** `/api/webhooks/{service}` (if applicable)
- **Environment variables required:** {list}
- **Last updated:** {date}
```

### Step 6 — Add environment variables
Add to `.env.example`:
N8N_{WORKFLOW_NAME}_WEBHOOK_URL=https://n8n.suzanneravenall.com/webhook/{id}

### Step 7 — Spawn code-reviewer
Ask code-reviewer to review the Next.js webhook handler.

### Step 8 — Spawn qa-unit
Ask qa-unit to test the webhook handler — mock the n8n forward call.

## n8n Node Selection Guide

| Use case | Node to use |
|---|---|
| Call any REST API | HTTP Request |
| Read/write Supabase | Supabase node |
| Send email | HTTP Request → Resend API |
| Transform data | Code node (JavaScript) |
| Conditional logic | IF node or Switch node |
| Wait between steps | Wait node |
| Loop over items | Split In Batches |
| Merge data streams | Merge node |
| Schedule trigger | Schedule Trigger |
| Incoming webhook | Webhook node |
| Handle errors | Error Trigger (separate workflow) |

## Webhook Security Pattern
```javascript
// n8n Code node — verify incoming webhook signature
const signature = $input.first().json.headers['x-n8n-signature']
const secret = $env.N8N_WEBHOOK_SECRET
const body = JSON.stringify($input.first().json.body)

const crypto = require('crypto')
const expected = crypto
  .createHmac('sha256', secret)
  .update(body)
  .digest('hex')

if (signature !== expected) {
  throw new Error('Invalid webhook signature — rejecting')
}

return $input.all()
```

## Rules
- Every workflow must have an error workflow connected — never silent failures
- Always return 200 from webhook handlers immediately — process async
- Always verify webhook signatures — reject unsigned requests
- Export workflow JSON and commit to repo — never leave workflows only in n8n UI
- Test with real sandbox data before connecting to production services
- Never hardcode API keys in n8n — always use n8n credentials manager
- Document every workflow in infra/n8n/README.md
- Workflows that modify financial data (Sage) must have a reconciliation check

## Output Format
Always report:
- Workflow name and trigger type
- Services connected and data flow
- Webhook URL registered (if applicable)
- n8n workflow file location in repo
- Environment variables added
- Error handling approach
- Test results
