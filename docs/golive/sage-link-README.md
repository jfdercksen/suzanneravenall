# Sage invoice link

One Sage tax invoice per paid order, posted by our own code (no n8n). Built behind
a flag, off by default. Status 26 Nov 2026: built and unit tested with mocked
Sage answers; never run against Sage (no credentials yet).

## Stages

| # | Stage | Where |
|---|-------|-------|
| 1 | Auth: Basic (sandbox) or OAuth 2.0 (live), encrypted token store, connect flow | `apps/medusa/src/modules/sage/auth.ts`, `store.ts`, `crypto.ts`, `oauth-flow.ts` |
| 2 | Customer: map table first, Sage search only on a miss, then create | `modules/sage/resolvers.ts`, `client.ts` |
| 3 | Invoice body: pure function, item lines or income-account fallback, voucher line so totals match | `modules/sage/invoice.ts` |
| 4 | Currency: anything not ZAR is held, no Sage call, one staff alert | `automations/sage.ts` |
| 5 | Skip if already in Sage: look up reference SR-<order> first | `automations/sage.ts`, `client.ts` |
| 6 | Outbox job `sage_invoice` (key `sage_invoice:<orderId>`), dispatched from `order-placed.ts` | `automations/sage.ts`, `dispatch.ts`, `runtime.ts` |
| 7 | Refunds | Not built. Carla issues credit notes by hand. No refund subscriber exists, so no refund alert yet |

The old n8n call in `order-placed.ts` is removed. The n8n Sage workflows are retired.

## Flags and settings (names only)

- `AUTOMATION_SAGE`: `off` (default) | `shadow` (build the invoice, log a masked summary, no Sage call, nothing stored, works without credentials) | `code` (post). `AUTOMATION_DRY_RUN=true` also forces the shadow behaviour.
- `SAGE_AUTH`: `basic` (default) | `oauth`.
- Basic: `SAGE_EMAIL`, `SAGE_PASSWORD`, `SAGE_API_KEY`, `SAGE_COMPANY_ID`, `SAGE_API_URL`.
- Posting: `SAGE_TAX_TYPE_ID` (required, never guessed, the company is not VAT registered), `SAGE_INCOME_ACCOUNT_ID` (needed for fallback, discount and charge lines).
- Customer: `SAGE_CUSTOMER_MODE` (`per_customer` default | `cash`), `SAGE_CASH_CUSTOMER_ID` (required in cash mode).
- OAuth: `SAGE_OAUTH_AUTHORIZE_URL`, `SAGE_OAUTH_TOKEN_URL`, `SAGE_OAUTH_CLIENT_ID`, `SAGE_OAUTH_CLIENT_SECRET`, optional `SAGE_OAUTH_REDIRECT_URI`, `SAGE_OAUTH_SCOPE`; `SAGE_TOKEN_ENCRYPTION_KEY` (32 bytes, base64, AES-256-GCM; without it no token is stored).
- Existing and reused by the callback: `INTERNAL_WEBHOOK_SECRET` (legacy `N8N_WEBHOOK_SECRET`), `MEDUSA_BACKEND_URL` on the web service.

The Medusa variant carries the Sage item code in `variant.metadata.sage_item_code`. A variant without one, or with a code Sage does not know, is posted as a line on the income account and a warning is logged.

## Behaviour to know

- Medusa amounts are cents (249000 = R2,490.00). They are converted to rand exactly once, in `centsToRand` (`invoice.ts`), when the job payload is built; the Sage body is in rand, rounded to 2 decimals.
- The invoice total always equals the order total: a voucher becomes a negative "Discount" line, a fee a positive "Other charges" line.
- Held (USD order, tax type unset, cash customer unset, OAuth not connected, no income account for a needed account line, no email in per_customer mode): one staff alert, the job completes with outcome `held`, no retries burned. Invoice it by hand with the SR- reference, or fix the setting and delete the job row to replay.
- Free orders are skipped. Failures that can pass (Sage 5xx, network) use the queue retries (1 m, 5 m, 30 m, 2 h, 12 h) and the dead-job alert. A Sage 4xx on the invoice is dead at once.
- After posting, `sage_invoice_id`, `sage_document_number`, `sage_synced_at` are written to the order metadata, keeping the keys already there.
- The recovery sweep does not cover Sage: an order whose `order.placed` event is lost is not invoiced automatically. The SR- check means Carla's hand invoices and a later replay never double up.

## Tables (Migration20261126100000, run by `medusa db:migrate`)

`sage_oauth_token`, `sage_oauth_state`, `sage_customer_map` (email lower case, unique), `sage_item_cache`.

## Tested with mocks (shapes to be replaced by recorded sandbox answers)

Basic header, OAuth authorize URL, code exchange, refresh with the 60 s margin and a single refresh for concurrent calls, encryption round trip and refusal without a key, one-time state with 10 minute expiry, the connect hook (secret check, 500 when the secret is unset, Zod), the web callback, `$filter` support and the paging fallback for Email, Code and Reference (stops at the first match), customer map, item cache, invoice builder (voucher totals, SAST date, no 15% guess), handler outcomes (posted, already-in-sage, held, shadow, retry, dead), flag parsing and dispatch.

## Must be verified against the Sage trial company

1. Exact `LineType` values for an item line and an account line (`types.ts`: 0 and 1 assumed).
2. Whether `$filter` works on `Email` (Customer/Get), `Code` (Item/Get) and `Reference` (TaxInvoice/Get), and whether the match is case sensitive. If not, paging is used and is capped (customers 10 000, items and invoices 5 000); past the cap the job fails loudly instead of guessing.
3. The item lookup endpoint and field names (`/Item/Get`, `Code`, `ID`).
4. That a negative account line is accepted for the voucher discount.
5. That OAuth still needs the `apikey` and `companyid` query parameters (they are sent in both modes).
6. The OAuth endpoints, scope, token answer shape, and the refresh token lifetime.
7. The tax type id for "no VAT" and the income account id.

## Connecting OAuth once Sage issues the client

1. Set the `SAGE_OAUTH_*` names, `SAGE_TOKEN_ENCRYPTION_KEY` (`openssl rand -base64 32`), `SAGE_AUTH=oauth` in the VPS `.env` (secrets from Vaultwarden), then `docker compose up -d --no-deps medusa` and let `medusa db:migrate` create the tables.
2. Make sure the redirect address given to Sage is exactly `https://suzanneravenall.com/api/sage/oauth/callback`.
3. Log in to the Medusa admin and call `POST /admin/sage/connect`; it returns `url` (valid 10 minutes).
4. Open the URL as the Sage administrator and approve. Sage redirects to the callback, the web app hands code and state to Medusa (`POST /hooks/sage/oauth`, secret header), Medusa checks the one-time state, exchanges the code and stores the tokens encrypted. The page says "Sage is connected".
5. Set `AUTOMATION_SAGE=shadow`, place a test order, read the masked log line, then set `code` when the trial checks above pass.
