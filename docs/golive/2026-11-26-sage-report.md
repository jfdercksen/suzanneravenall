# Sage: what the new site has, what was tested, and what Stock2Shop did (26 Nov 2026)

Facts only. This answers Suzanne's mail of 26 Nov 13:23 (what replaces Stock2Shop, has it been tested, is the function the same).

**Sources:**
- the repo at origin/feature/design-standard e5e6758;
- the worklog, KNOWN_ISSUES and BUILD_STATUS;
- the EA's mail record;
- the public product lists of both shops, read today.

No Sage account, Stock2Shop console or server setting was opened. Nothing was built for Sage.

**Short answer:**
- The new site does **not** send orders to Sage today.
- It has never been tested against Sage.
- It will not on Friday.
- Orders from Friday are kept in full on the new site and can be invoiced in Sage by hand. They can also be sent automatically later, once Sage issues a live key.

## 1. What is built in the repo, and what is not

| Part | State | Where |
|---|---|---|
| Sage client code (find or create a customer by email, create a tax invoice) | Written in May 2026 (commit 0baff82). Never called by anything | apps/medusa/src/modules/sage/service.ts |
| Trigger on a new order | The order handler posts the order to an n8n webhook, fire-and-forget. n8n is retired on this project and its Sage workflow never had credentials, so nothing arrives in Sage. A failure leaves one log line, no alert | apps/medusa/src/subscribers/order-placed.ts:884 |
| n8n workflow "order to Sage" | Exported, never run against Sage. It reads only the first 100 Sage customers | infra/n8n/workflows/medusa-order-to-sage.json |
| Daily reconciliation (orders without a Sage number) | n8n workflow only, uses an old auth header, never run against Sage | infra/n8n/workflows/sage-invoice-sync.json |
| Sign-in to Sage | Basic auth with a Sage login plus API key (the **sandbox** method). The **live** method Sage asked for is OAuth 2.0 (their request for 8 client details, our reply drafted 4 Aug, never sent). OAuth is **not built**: no callback route, no token storage, no refresh | service.ts:35-52 |
| Invoice lines | One account-based line per item (description and amount on an income account). **No Sage item codes**, so no S0027-style codes on the invoice and no stock movement | service.ts:181-197 |
| Tax | Picks the 15% VAT type. **Wrong:** the company is not VAT registered (KI033) | service.ts:79-92 |
| Amounts | Divides the price by 100. Correct: this shop stores prices in cents (checked on the live store 26 Nov: R2,490 is held as 249000). An earlier version of this report called it a bug; it is not | service.ts:186 |
| Currency | No currency handling: a USD order would book as rand (KI093) | - |
| Payments in Sage (receipt allocated to the invoice) | Not built | - |
| Backfill (send past orders) | Not built | - |
| The customer's own invoice PDF from the site | Built and live. Numbered `SR-00123` (order number) until a Sage number exists, then shows the Sage number | apps/web/components/invoice/InvoiceDocument.tsx:288 |

## 2. What has actually been run against Sage

**Nothing.**
- 12 May: Sage mailed Shayna their process.
  - Develop and test against the sandbox.
  - Tell them when it is ready.
  - They review the sandbox call logs.
  - A live key is not guaranteed.
- 4 Aug: the sandbox API key and a trial company login were received (vault catalogue: "sandbox only, LIVE key comes later from Sage").
- 4 Aug: the reply with the 8 OAuth client details was drafted (`C:\Johan Brain\drafts\2026-08-04-sage-oauth-client-details.md`). It was never sent, so no live key has been requested.
- No call to the sandbox is recorded anywhere: no worklog entry, no test result, no Sage invoice id.
- The worklog line "Sage execution succeeded" on order #14 (22 Sep) is the n8n workflow's error branch, which always ends as success. It had no credentials.
- The trial company was asked to last to end October. It has likely lapsed (EA's reading).

## 3. What Stock2Shop does today and what the new site must match

**Known:**
- On the current site, orders flow WooCommerce to Stock2Shop to Sage invoices, automatically (Suzanne's mail).
- Stock2Shop is not visible from the site's public side. It reads WooCommerce over its API.

What Stock2Shop does in detail has to be read from her Stock2Shop console or from one recent Sage invoice it created. The table shows what we know and what must be confirmed.

| What | Current site (via Stock2Shop) | New site | Gap |
|---|---|---|---|
| Invoice per order | Yes, automatic | No | Whole flow |
| Customer record in Sage | To confirm: by email, by name, or one cash customer? | Code finds or creates by email | Confirm the rule |
| Item codes on the invoice (S0027, S0137...) | 147 of 148 old products carry an S-code (read today). Inferred: Stock2Shop matches them to Sage items | New products carry **no** S-codes: 3 of 149 published variants have a SKU, and those are Thinkific ids. The 14 Oct catalogue map links 142 of 145 new variants to an old product and its S-code, so the codes can be restored | Codes not on the new products; invoice code uses account lines, not items |
| Tax-inclusive prices, no VAT | To confirm the Sage tax type used | Inclusive, but the code picks 15% | Fix to the no-VAT type |
| Currency (the old shop also sells in USD) | To confirm: separate USD customer, converted to rand, or a foreign-currency invoice? | Orders keep their own currency (ZAR or USD) | Rule needed, then code |
| Stock levels | To confirm: digital products, probably none. Does Stock2Shop also push products, prices or stock from Sage into WooCommerce? | Prices live in Medusa | If Sage is the price master today, price changes in Sage will no longer reach the site |
| Payment / receipt in Sage | To confirm | Not built | Rule needed |
| Invoice number and reference | To confirm the format | Site invoice `SR-<order>`; code sends Reference `ORDER-<order>` | Agree one reference |

**At the switch:**
- WooCommerce stops receiving orders, so Stock2Shop simply has nothing new to send.
- It creates no duplicates and needs no action on Friday.
- Its subscription can be paused once the old shop is closed.

## 4. Orders taken from Friday: invoice by hand now, send automatically later

**What each new order holds** (Medusa, visible in the shop admin at /medusa/app):
- order number and date;
- customer name and email;
- billing address;
- each item with its variant, quantity and price;
- currency;
- discount or voucher;
- total;
- payment method and gateway reference;
- the customer's site invoice `SR-<order>`.

Nothing is lost.

**What is missing for hand invoicing:**
- **No team mail per order.** The confirmation goes to the customer only, so the team has to look in the shop admin.
- **No export.** There is no order export for the bookkeeper.
- **No S-code on the products** (see 3).

**Rules for hand invoicing, so a later automatic send can reconcile and never duplicate:**
1. Put the site order number in the Sage invoice reference, exactly `SR-<order>` as on the customer's PDF (for example SR-00512). A later send then checks Sage for that reference and skips the order.
2. Use the same Sage customer rule and item codes Stock2Shop used today, so reports stay continuous.
3. Choose one path per order: by hand, or the later automatic send. The reference in rule 1 enforces this.

**Could be prepared, each only with Johan's yes:**
- a daily order list mailed to the bookkeeper, or a CSV export from the shop admin (half a day);
- the S-codes put back on the new products from the 14 Oct map (half a day, with the 3 unmatched checked by hand).

## What remains once a live key exists

1. **Send Sage the 8 OAuth client details.**
   - The 4 Aug draft is ready.
   - The callback URL in it needs the route below to exist.
   - Ask them to extend or renew the trial company.
2. **Code** (about 2-3 days):
   - OAuth sign-in for live (callback, token storage, refresh);
   - invoice by Sage item code with the S-codes;
   - no-VAT tax type;
   - currency rule;
   - amounts in rand;
   - optional receipt;
   - run from the order outbox with retries and a staff alert, replacing the n8n call;
   - a reconciliation and backfill job keyed on the `SR-<order>` reference.
3. **Sandbox test:**
   - every product type, a USD order, a voucher order, a refund;
   - then tell Sage, who review the call logs.
4. **Sage's review and live key:** their timing. Their 12 May mail says a key is not guaranteed.
5. **Backfill:** run the orders from Friday that were not invoiced by hand.

**Inputs from Suzanne or her bookkeeper:**
- the Stock2Shop answers in section 3;
- one recent Sage invoice created by Stock2Shop, as an example;
- the Sage company to post to.
