---
name: add-payment-provider
description: Add a new payment provider plugin to Medusa.js v2. Use when integrating PayFast, PayPal or any future payment gateway. Always implement in sandbox mode first, verify ITN/webhook handling, and test the full purchase flow before going live.
allowed-tools: Bash, Read, Write, Edit, Glob, Grep
---

# Add Payment Provider

## Goal
Create a production-ready Medusa.js v2 payment provider plugin that handles the full payment lifecycle — initiation, capture, refund and webhook notification.

## Inputs
- Payment provider name (payfast, paypal)
- Provider documentation URL
- Sandbox credentials available
- Currencies supported
- Webhook/ITN notification method

## Key References
- Medusa payment provider: https://docs.medusajs.com/resources/commerce-modules/payment
- Medusa create payment provider: https://docs.medusajs.com/resources/references/payment/provider
- PayFast developer docs: https://developers.payfast.co.za/docs
- PayFast ITN: https://developers.payfast.co.za/docs#notify_validate
- PayFast sandbox: https://sandbox.payfast.co.za
- PayPal Orders API v2: https://developer.paypal.com/docs/api/orders/v2/
- PayPal sandbox: https://developer.paypal.com/tools/sandbox/

## Project Structure
- Payment providers: `apps/medusa/src/modules/payment-{provider}/`
- Provider index: `apps/medusa/src/modules/payment-{provider}/index.ts`
- Provider service: `apps/medusa/src/modules/payment-{provider}/service.ts`

## Process

### Step 1 — Research the provider
Spawn research agent:
"Research Medusa v2 payment provider implementation. Read https://docs.medusajs.com/resources/references/payment/provider and confirm the required methods: initiatePayment, authorizePayment, capturePayment, refundPayment, cancelPayment, retrievePayment, getWebhookActionAndData. Also read {provider docs URL} for their specific API flow."

### Step 2 — Create the provider service
File: `apps/medusa/src/modules/payment-{provider}/service.ts`
```typescript
import {
  AbstractPaymentProvider,
  PaymentProviderError,
  PaymentProviderSessionResponse,
  MedusaContainer,
} from "@medusajs/framework/utils"
import {
  AuthorizePaymentInput,
  AuthorizePaymentOutput,
  CancelPaymentInput,
  CapturePaymentInput,
  CapturePaymentOutput,
  InitiatePaymentInput,
  InitiatePaymentOutput,
  RefundPaymentInput,
  RefundPaymentOutput,
  RetrievePaymentInput,
  RetrievePaymentOutput,
  WebhookActionResult,
} from "@medusajs/types"

class {Provider}PaymentService extends AbstractPaymentProvider {
  static identifier = "{provider-id}" // e.g. "payfast", "paypal"

  constructor(container: MedusaContainer, config: Record<string, unknown>) {
    super(container, config)
    // initialise provider SDK or HTTP client
  }

  // Called when customer starts checkout — create payment session
  async initiatePayment(
    input: InitiatePaymentInput
  ): Promise<InitiatePaymentOutput> {
    // Create payment intent/order with provider
    // Return payment session data
  }

  // Called when customer completes payment — verify and authorise
  async authorizePayment(
    input: AuthorizePaymentInput
  ): Promise<AuthorizePaymentOutput> {
    // Verify payment status with provider
    // Return authorised or pending status
  }

  // Called to capture an authorised payment
  async capturePayment(
    input: CapturePaymentInput
  ): Promise<CapturePaymentOutput> {
    // Capture the payment with provider
  }

  // Called to issue a refund
  async refundPayment(
    input: RefundPaymentInput
  ): Promise<RefundPaymentOutput> {
    // Issue refund via provider API
  }

  // Called to cancel a payment
  async cancelPayment(input: CancelPaymentInput): Promise<void> {
    // Cancel payment with provider
  }

  // Called to get current payment status from provider
  async retrievePayment(
    input: RetrievePaymentInput
  ): Promise<RetrievePaymentOutput> {
    // Fetch payment status from provider API
  }

  // Called when webhook/ITN received — parse and return action
  async getWebhookActionAndData(
    payload: { data: Record<string, unknown>; rawData: string; headers: Record<string, string> }
  ): Promise<WebhookActionResult> {
    // Verify webhook signature
    // Return action: authorized, captured, failed, refunded
  }
}

export default {Provider}PaymentService
```

### Step 3 — Create provider module index
File: `apps/medusa/src/modules/payment-{provider}/index.ts`
```typescript
import { ModuleProvider, Modules } from "@medusajs/framework/utils"
import {Provider}PaymentService from "./service"

export default ModuleProvider(Modules.PAYMENT, {
  services: [{Provider}PaymentService],
})
```

### Step 4 — Register in medusa-config.ts
```typescript
import {Provider}PaymentModule from "./src/modules/payment-{provider}"

module.exports = defineConfig({
  modules: [
    {
      resolve: "./src/modules/payment-{provider}",
      definition: {Provider}PaymentModule,
    },
  ],
})
```

### Step 5 — Add webhook handler
Use the add-webhook skill to create:
`apps/web/app/api/webhooks/{provider}/route.ts`

For PayFast specifically — ITN must be validated by calling PayFast validation endpoint:
```typescript
// PayFast ITN validation
const params = new URLSearchParams(itnData)
const validation = await fetch(
  `https://www.payfast.co.za/eng/query/validate?${params}`
)
const result = await validation.text()
if (result.trim() !== "VALID") {
  return NextResponse.json({ error: "Invalid ITN" }, { status: 400 })
}
```

### Step 6 — Add environment variables to .env.example
PayFast
PAYFAST_MERCHANT_ID=
PAYFAST_MERCHANT_KEY=
PAYFAST_PASSPHRASE=
PAYFAST_SANDBOX=true
PayPal
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_SANDBOX=true

### Step 7 — Test in sandbox
Full checkout flow test checklist:
- [ ] Customer adds item to cart
- [ ] Customer reaches checkout
- [ ] Payment session created successfully
- [ ] Customer redirected to provider payment page
- [ ] Customer completes payment in sandbox
- [ ] ITN/webhook received and verified
- [ ] Order status updated to paid in Medusa
- [ ] Order confirmation email sent via Resend
- [ ] Invoice created in Sage via n8n workflow
- [ ] Vtiger contact updated via n8n workflow

### Step 8 — Spawn integration-agent
Ask integration-agent to review the payment flow end-to-end.

### Step 9 — Spawn code-reviewer
Ask code-reviewer to review the provider service.

### Step 10 — Spawn qa-unit
Ask qa-unit to write tests — mock all provider API calls.

### Step 11 — Switch to production credentials
Only after sandbox testing passes completely:
1. Update environment variables to production values
2. Set PAYFAST_SANDBOX=false and PAYPAL_SANDBOX=false
3. Register production webhook URLs in provider dashboards
4. Run one real test transaction before go-live

## PayFast Specific Notes
- Sandbox URL: https://sandbox.payfast.co.za/eng/process
- Production URL: https://www.payfast.co.za/eng/process
- ITN URL must be publicly accessible — cannot test on localhost
- Use ngrok for local ITN testing: https://ngrok.com
- Signature calculation: MD5 hash of all parameters sorted alphabetically
- Always include passphrase in signature calculation
- Test cards: https://developers.payfast.co.za/docs#testing

## PayPal Specific Notes
- Always use Orders API v2 — never v1 (deprecated)
- Sandbox dashboard: https://developer.paypal.com/dashboard/
- Webhook simulator available in PayPal developer dashboard
- Supports ZAR but verify currency availability before going live

## Rules
- Always start in sandbox mode — never configure production credentials first
- Never store raw card data — always use provider tokenisation
- Always verify webhook signatures before updating order status
- Never mark an order as paid without provider confirmation
- Test the full refund flow in sandbox before going live
- Keep PAYFAST_SANDBOX and PAYPAL_SANDBOX env vars — easy production switch
- Document the exact webhook URLs to register in each provider dashboard

## Output Format
Always report:
- Provider integrated and sandbox/production status
- Payment lifecycle methods implemented
- Webhook URL to register in provider dashboard
- Environment variables required
- Full sandbox test checklist results
- Any provider-specific gotchas discovered
