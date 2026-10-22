# KI096 proposal: Medusa upgrade and the complete-cart race

Status: proposal, not started. Written 22 Oct 2026 for Johan. Nothing was upgraded.

## The problem it would solve

Under load, Medusa 2.14.1's complete-cart run can end unfinished. The store route then answers 409 "Cart is already being completed by another request" (it raises that whenever the workflow transaction has not finished: `@medusajs/medusa/dist/api/store/carts/[id]/complete/route.js`). The buyer has paid, an order row may exist without its payment, and order.placed never fires. Seen on #399 and #400 (20 Oct, KI089, caused there by a workflow composed twice) and once more on #418 (21 Oct, KI095, a loaded box, one caller). Our diagnosis: a "Transaction storage is locked" checkpoint conflict makes the orchestrator reload the run while a parallel step is still running, and that step's success lands on the stale copy.

Since 22 Oct the KI095 safety net catches the result (the payment-reconcile job every 10 minutes, and the PayPal webhook): the order is repaired once or staff are alerted with the gateway reference. The upgrade question is whether we can also remove the cause.

## What the changelog says (checked 22 Oct 2026)

Latest stable is 2.22.0 (21 Oct 2026). Releases after 2.14.1: 2.14.2, 2.15.0 to 2.15.5, 2.16.0, 2.17.0 to 2.17.2, 2.18.0, 2.19.0, 2.20.0/2.20.1, 2.21.0 to 2.21.2, 2.22.0 (https://github.com/medusajs/medusa/releases).

No released version fixes this race. The relevant work is all still open:

| Item | State | What it does |
|---|---|---|
| PR #16567 (https://github.com/medusajs/medusa/pull/16567) | Open, not reviewed, merge conflicts | Closest match: fixes a reload after "Transaction storage is locked" and stops the in-memory engine locking parallel sync steps |
| Issue #17161 (https://github.com/medusajs/medusa/issues/17161) | Open | Checkpoint save error after a successful step, cart lock left held; reproducible on the in-memory engine (reported on 2.14.2) |
| PR #17412 (https://github.com/medusajs/medusa/pull/17412) | Open | Partial fix for #17161; says a concurrent-finalisation race remains |
| PR #17324 (https://github.com/medusajs/medusa/pull/17324) | Open | Scopes lock owner to the transaction id |
| PR #17367 (https://github.com/medusajs/medusa/pull/17367) | Open draft | "Workflow engine v2", a rewrite that may replace the above |

Released items that touch cart completion but not this race: #15231 (2.15.0, cart must have items), #15527 (2.15.5, no refund of captures from a separate complete run), #17293 (2.22.0, do not compensate a completed workflow when event release fails).

Redis is not needed for the open fixes (they are in the shared orchestrator and the in-memory engine); Redis only adds cross-instance locking, which a single Medusa process does not need.

## Breaking changes between 2.14.1 and 2.22.0 that would touch us

- 2.15.0: use 2.15.1 or later (2.15.0 shipped with missing PRs). Product dimensions become float.
- 2.15.5: `AUTH_MFA_ENCRYPTION_KEY` (64 characters) required when the Auth module is configured.
- 2.16.0: production start fails without `http.jwtSecret` and `http.cookieSecret` (we set both today, check the names); MikroORM 6.6.14 throws on unknown relations in `find` (our order-placed and cancel code use Query, check the rest); ESLint runs in build.
- 2.17.0: auth verification rework with a migration (`auth_verification_token` replaced); use 2.17.1 or later.
- 2.18.0: default load strategy SELECT_IN to BALANCED.
- 2.19.0: Node ^20.19 or ^22.12 (our image is node:20-alpine, check the minor); admin on Vite 7 and React Router 7 (our admin widgets need a check); `*` on carts and orders now includes computed totals.
- 2.20.0: store routes get a relations-depth limit; run `db:migrate`.
- 2.21.0: every store route enforces an allowed-fields list. Our storefront asks for `+variants.inventory_quantity`, `*variants.prices`, `*categories`, `*collection` and cart fields by name; each needs checking or an `allowFields` middleware.
- 2.22.0: Node 22.22 or later required (image change from node:20 to node:22).

Not found in the notes, but to test anyway: our PayPal and PayFast providers (AbstractPaymentProvider), the admin cancel override, scheduled jobs, subscribers.

## Recommendation

Do not upgrade for this bug now. No release fixes it, the jump to 2.22.0 crosses eight minors with a Node major, new required secrets and a store-API field allow-list, and the engine is about to be rewritten upstream. Risk: high for 2.22.0, medium for 2.15.5 or 2.17.2 with little benefit for this race.

Keep 2.14.1 with the KI095 safety net, and revisit when #16567 or #17412 ships (watch the releases page monthly).

## Steps when a fix ships

1. Read that release's notes and every release in between (the list above to start).
2. Branch `infra/medusa-<version>`. Bump all `@medusajs/*` packages to the same version in apps/medusa and the root lockfile (`npm install`, then check there is one copy of each).
3. Change the Medusa image to the Node version the release needs.
4. Add any newly required env (MFA key, secrets) to infra/.env.example by name and to the box from the vault.
5. Run `npx medusa db:migrate` against a copy of the review database first (pg_dump, restore into a scratch database, migrate, check).
6. Medusa tests (`npx vitest run` in apps/medusa), web tests, `npm run build`.
7. Store-API sweep: product page, shop listing, cart, checkout, order-by-cart, search sync, with the walker; fix any field the allow-list refuses.
8. Load proof: 20 parallel sandbox completions (free voucher QA-SELFTEST-100 plus two PayFast sandbox) while the box builds an image; expect zero 409s and zero rows from the payment-reconcile query.
9. Deploy medusa in a quiet slot (about 4 minutes down), smoke voucher order, one PayFast and one PayPal sandbox order, then cancel them.
10. Keep the KI095 job either way: it costs one query every 10 minutes and protects against any future loss.

Optional in between: carry the #16567 changes as a local `patch-package` patch, only after the load proof in step 8 passes on a scratch box.
