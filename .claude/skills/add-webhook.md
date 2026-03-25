---
name: add-webhook
description: Add a new inbound webhook handler in Next.js that receives events from an external service and forwards to n8n or processes directly. Use when any external service needs to send events to the platform. Always verify signatures.
allowed-tools: Bash, Read, Write, Edit, Glob, Grep
---

# Add Webhook Handler

## Goal
Create a secure, production-ready inbound webhook handler that verifies the source, processes the payload and triggers the appropriate workflow.

## Inputs
- Service sending the webhook (PayFast, Cal.com, Medusa, n8n, Vtiger)
- Event types to handle
- Signature verification method for that service
- What should happen when each event is received
- Whether to forward to n8n or process directly

## Key References
- Next.js route handlers: https://nextjs.org/docs/app/building-your-application/routing/route-handlers
- PayFast ITN: https://developers.payfast.co.za/docs#notify_validate
- Cal.com webhooks: https://cal.com/docs/core-features/webhooks
- n8n webhook node: https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/
- Resend webhooks: https://resend.com/docs/dashboard/webhooks/introduction

## Project Structure
- Webhook handlers: `apps/web/app/api/webhooks/{service}/route.ts`
- Signature verification: `apps/web/src/lib/webhooks/verify.ts`
- Webhook types: `apps/web/src/lib/webhooks/types.ts`

## Process

### Step 1 — Research signature verification
Spawn research agent:
"How does {service} sign webhook payloads? What header contains the signature? What algorithm is used (HMAC-SHA256, RSA, custom)? Read {service webhook docs URL} and return the exact verification method."

### Step 2 — Add verification to lib
File: `apps/web/src/lib/webhooks/verify.ts`
```typescript
import crypto from "crypto"
import { NextRequest } from "next/server"

// Generic HMAC-SHA256 verification
export async function verifyHmacSignature(
  request: NextRequest,
  secret: string,
  headerName: string
): Promise<boolean> {
  const signature = request.headers.get(headerName)
  if (!signature) return false

  const body = await request.text()
  const expected = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex")

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  )
}

// PayFast ITN verification (custom — must call PayFast validation endpoint)
export async function verifyPayFastITN(
  payload: Record<string, string>
): Promise<boolean> {
  const params = new URLSearchParams(payload)
  const response = await fetch(
    `https://www.payfast.co.za/eng/query/validate?${params}`
  )
  const text = await response.text()
  return text.trim() === "VALID"
}
```

### Step 3 — Create the webhook handler
File: `apps/web/app/api/webhooks/{service}/route.ts`
```typescript
import { NextRequest, NextResponse } from "next/server"
import { verifyHmacSignature } from "@/lib/webhooks/verify"

// Disable body parsing — needed for raw body signature verification
export const config = {
  api: { bodyParser: false }
}

export async function POST(request: NextRequest) {
  try {
    // Step 1 — Verify signature FIRST, before anything else
    const isValid = await verifyHmacSignature(
      request,
      process.env.{SERVICE}_WEBHOOK_SECRET!,
      "x-{service}-signature"
    )

    if (!isValid) {
      console.error("{Service} webhook: invalid signature")
      return NextResponse.json(
        { error: "Unauthorised" },
        { status: 401 }
      )
    }

    // Step 2 — Parse payload
    const payload = await request.json()
    const eventType = payload.type || payload.event

    // Step 3 — Return 200 immediately
    const response = NextResponse.json({ received: true })

    // Step 4 — Process async
    handleWebhookAsync(eventType, payload).catch(err => {
      console.error("{Service} webhook processing error:", err)
    })

    return response

  } catch (error) {
    console.error("{Service} webhook error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

async function handleWebhookAsync(
  eventType: string,
  payload: unknown
): Promise<void> {
  // Forward to n8n
  await fetch(process.env.N8N_{SERVICE}_WEBHOOK_URL!, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-N8N-Signature": process.env.N8N_WEBHOOK_SECRET!,
    },
    body: JSON.stringify({ eventType, payload }),
  })
}
```

### Step 4 — Add webhook types
File: `apps/web/src/lib/webhooks/types.ts`
```typescript
// Add typed payload interfaces for each service
export interface {Service}WebhookPayload {
  type: string
  // add all expected fields
}
```

### Step 5 — Register webhook URL in external service
Document exactly where to register:
- PayFast: Merchant dashboard → Notifications → ITN URL
- Cal.com: Settings → Developer → Webhooks → Add webhook
- n8n: Workflow → Webhook node → copy URL
- Medusa: `apps/medusa/medusa-config.ts` → subscriberExecution

### Step 6 — Add environment variables to .env.example
{SERVICE}_WEBHOOK_SECRET=
N8N_{SERVICE}_WEBHOOK_URL=

### Step 7 — Spawn integration-agent
Ask integration-agent to review the signature verification implementation.

### Step 8 — Spawn code-reviewer
Ask code-reviewer to review the handler file.

### Step 9 — Spawn qa-unit
Ask qa-unit to write tests — mock fetch calls, test valid and invalid signatures.

## Signature Verification by Service

| Service | Header | Algorithm | Notes |
|---------|--------|-----------|-------|
| PayFast | None | Custom | Call PayFast validation endpoint |
| Cal.com | X-Cal-Signature-256 | HMAC-SHA256 | Compare with webhook secret |
| n8n | X-N8N-Signature | HMAC-SHA256 | Shared secret |
| Resend | svix-signature | SVIX | Use svix library |
| Medusa | x-medusa-signature | HMAC-SHA256 | Medusa webhook secret |

## Rules
- Signature verification is mandatory — never skip it for any webhook
- Always return 200 immediately — never make external service wait for processing
- Process webhooks asynchronously after returning 200
- Never log full payload if it may contain PII or payment data
- Always handle the case where the n8n forward fails — log to Sentry
- Test with both valid and invalid signatures before going live
- Register webhook URLs in external service dashboards and document them

## Output Format
Always report:
- Service and event types handled
- Signature verification method used
- Webhook URL to register in external service dashboard
- Environment variables added
- n8n workflow triggered (if applicable)
- Test results — valid signature, invalid signature, missing signature
