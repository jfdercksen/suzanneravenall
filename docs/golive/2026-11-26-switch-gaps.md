# Switch gaps found on 26 Nov 2026 (N1 to N9, Sage)

Source: the EA's read-only audit of origin/feature/design-standard at e5e6758 plus live DNS, checked here against the code and the live boxes. No server setting was read and no .env was opened; the box checks are plain HTTP requests from outside.

Branch: `claude/golive-gaps` (from e5e6758). Nothing is merged or deployed. Each item that changes the site or the server needs Johan's own yes.

## Summary

| # | Item | Verified | Fix on branch | Needs Johan's yes for | Ready before Friday |
|---|---|---|---|---|---|
| N1 | Outlook calendar sync (KI080) | Yes | Partly: compose passes MS_GRAPH_CLIENT_ID/SECRET to calcom; steps below | Microsoft app registration in her tenant, keys into the vault and infra/.env, calcom recreate | No: needs cal https and Suzanne's own Microsoft sign-in |
| N2 | X-Frame-Options blocks the Cal.com embed | Yes | Yes: frame-ancestors for the site, X-Frame-Options dropped, CI check | Merge; enable cal.conf at F7 | Yes, if F7 (cal https) runs |
| N3 | Next.js sends HSTS with includeSubDomains | Yes (live header) | Yes: removed from next.config.mjs, nginx is the only source; test | Merge before the F0 web build | Yes, if merged before F0 |
| N4 | CMS on :3001 and Cal.com on :3002 public | Yes (3001 answered 200 from outside) | Yes: payload loopback by default; calcom via CALCOM_BIND; CI check | Merge, payload recreate; CALCOM_BIND after F7 | Payload yes; Cal.com after F7 |
| N5 | /wp-content/* redirects to / | Yes | No: options below | Which option | Option b yes; c depends on getting the files |
| N6 | Old shop recurring payments | Partly (public checks only) | No: nothing to code | Check PayFast and PayPal dashboards | Check, yes |
| N7 | JSON-LD logo file missing | Yes | Yes: points at /logos/logo-black.svg; test | Merge before F0 | Yes, if merged before F0 |
| N8 | Hosted *.supabase.co image host | Yes (nothing uses it) | Yes: removed; test | Merge before F0 | Yes, if merged before F0 |
| F5 | Product images saved with the IP | Yes: 51 of 54 URLs | Yes: docs/golive/F5-image-urls.sql | Running the SQL at F5 | Yes |
| T3 | Read-back loop omits Cal.com names | Yes | Yes: NEXT_PUBLIC_WEBAPP_URL, NEXTAUTH_URL, PAYLOAD_PUBLIC_SERVER_URL added | None (doc) | Yes |
| DNS | No cal record | Yes (known, proposal 1) | n/a | Add the record in konsoleH | Yes, if added today |
| N9 | Old-site integrations (new) | Partly | No | Decide per item | Check, yes |
| Sage | No order reaches Sage | Yes | No | Credentials, mapping, build | No: must follow |

## N1. Outlook calendar sync

**Verified:**
- The calcom service had no Microsoft keys.
- The branch now passes `MS_GRAPH_CLIENT_ID` and `MS_GRAPH_CLIENT_SECRET`. Both are empty by default, so nothing changes until they are set.

**Prepared, short of Suzanne's sign-in:**

1. **Microsoft app registration.** Johan, or whoever administers Suzanne's Microsoft 365, in the Entra admin centre:
   - Go to App registrations, New.
   - Name: Cal.com Suzanne Ravenall.
   - Account types: accounts in any organisational directory and personal Microsoft accounts.
   - Redirect, platform Web: `https://cal.suzanneravenall.com/api/integrations/office365calendar/callback`. Microsoft refuses an http redirect for a non-localhost host, so this needs cal https (proposal 1, F7) first.
   - API permissions, Microsoft Graph, delegated: `User.Read`, `Calendars.Read`, `Calendars.ReadWrite`, `offline_access`.
   - Certificates and secrets, new client secret: the value goes straight into Vaultwarden, never into chat or a file in the repo.
2. **Keys into Cal.com.** Johan, VPS:
   - Add `MS_GRAPH_CLIENT_ID` and `MS_GRAPH_CLIENT_SECRET` to `infra/.env` from the vault.
   - Run `docker compose up -d --no-build calcom`.
   - If the Cal.com admin shows Settings, Admin, Apps, Calendar, Microsoft 365: enable it there. Recent images keep app keys in their own database and take them from the env on seed. Read back that the app is listed as installed.
3. **Suzanne's step, about 5 minutes.**
   - Logged in to Cal.com as the booking user: Settings, Calendars, Add, Microsoft 365. She then signs in to her Microsoft account and accepts.
   - She can do this from Ethiopia in any browser with her Microsoft login and her second-factor phone. She does not need to be at her desk.
   - Then choose her calendar for "Check for conflicts" and "Add to calendar".
4. **Check:**
   - A test booking lands in her Outlook.
   - A busy slot in her Outlook disappears from the booking page.

**Friday without it:**
- Bookings still work, are recorded on the site through the webhook, and the client gets the Cal.com confirmation.
- Her Outlook busy times are not blocked, so a client can book a slot she has taken elsewhere. Availability is every weekday from 09:00, per the audit.
- The organiser mail goes to Johan's address, not hers.

**Mitigation until she signs in, Johan picks:**
- (a) Narrow the Cal.com availability to times she has confirmed free.
- (b) Change the Cal.com user's email to the team inbox, so booking mails reach her team. This is a Cal.com account setting.
- (c) Have Johan forward each booking.

## N2. Cal.com embed blocked by X-Frame-Options

**Verified:**
- `cal.conf.disabled` sent `X-Frame-Options: SAMEORIGIN`. The embeds (CalInlineBooking.tsx, CalBookingSection.tsx) run on suzanneravenall.com, a different origin from cal.suzanneravenall.com, so the browser would block them.
- Cal.com itself sends no X-Frame-Options (checked on :3002 today).

**Fix:**
- `Content-Security-Policy: frame-ancestors 'self' https://suzanneravenall.com https://www.suzanneravenall.com`.
- `proxy_hide_header X-Frame-Options`, in case a later image adds one.

**Test:** infra/nginx/test-config.sh now checks the Cal.com host:
- no X-Frame-Options;
- the frame-ancestors value;
- HSTS without includeSubDomains;
- http to https.

## N3. HSTS with includeSubDomains from Next.js

**Verified live:**
- The review box answers `Strict-Transport-Security: max-age=63072000; includeSubDomains`. It comes from next.config.mjs headers(), not from nginx.
- On the https site it would arrive next to nginx's header (two HSTS headers).
- Its includeSubDomains would force https on mail., ftp. and staging. on the old host for two years.

**Fix:**
- The header is removed from next.config.mjs. nginx (suzanneravenall.conf) sends `max-age=31536000` without includeSubDomains.
- Test: `apps/web/next.config.golive.test.mjs`.
- It needs a web build. The F0 build on Friday is one, if this branch is merged before F0.

## N4. Ports 3001 and 3002 on the host

**Verified:** `http://169.239.180.49:3001/cms/admin/login` answered 200 from this PC, so the CMS admin is open over plain http, beside nginx.

**Fix:**
- payload publishes on `${PAYLOAD_BIND:-127.0.0.1}`.
- nginx reaches it over the Docker network. Nothing on the box calls host port 3001; deploy.yml's localhost:3001 is the CI runner's build.
- calcom publishes on `${CALCOM_BIND:-0.0.0.0}`. It stays public by default, because the booking pages are served from :3002 until cal https exists.
- After F7, set `CALCOM_BIND=127.0.0.1` in infra/.env and recreate calcom. Old mails with `http://IP:3002` booking links then stop working. Every order so far was a test order, so no client holds one.

**Test:** `infra/scripts/check-compose-ports.sh`, in the nginx config check workflow. It renders the compose file and checks each published port's host interface and the two Microsoft key names. It fails on the old compose file.

**Takes effect:** at the next payload recreate (`docker compose up -d --no-build payload`), with Johan's yes.

## N5. Old /wp-content links

**Verified:**
- next.config.mjs sends `/wp-content/:path*` to `/` (301).
- The old homepage alone references 95 distinct /wp-content/uploads files.
- Hot-linked images and PDFs (email signatures, Thinkific pages, past newsletters) would show the homepage or a broken image.

**Options, Johan decides:**

| Option | What | Effort | Lasts |
|---|---|---|---|
| a | Leave as is | none | Hot links break silently |
| b | nginx proxies `/wp-content/uploads/` to the old Xneelo host by IP, with `Host: suzanneravenall.com` | 30 min plus a config test | Only while Xneelo hosting stays (planned 30 days), and only while its vhost answers by IP over http |
| c | Copy `wp-content/uploads` from Xneelo to a volume on the new box; nginx serves it with `alias` | 1-2 h once the files are here. Needs FTP/SFTP or a Duplicator/All-in-One backup, which the old site has. Size unknown: check disk room first | Permanent |
| d | Answer 404 instead of the homepage | 10 min | Honest, still broken |

**Recommendation:**
- c, with b as the bridge on Friday if the files are not here yet.
- Either way, the Next redirect for `/wp-content/uploads/` must go, or nginx must take the path first. An nginx `location /wp-content/uploads/` does take precedence.

## N6. Old shop recurring payments

**Checked from outside, no admin login:**
- The WooCommerce Subscriptions plugin is not at its standard path (readme 404).
- The PayFast gateway and WooCommerce PayPal Payments plugins are installed.
- So WooCommerce-managed subscriptions are unlikely, but PayFast or PayPal recurring billing set up outside WooCommerce cannot be ruled out from here.

**To check (Johan or Suzanne's admin, 10 min):**
- PayFast dashboard, Subscriptions.
- PayPal, Recurring payments / Subscriptions.
- WordPress, WooCommerce, Status, Scheduled Actions (pending renewal actions).

**What happens if any exist (inferred):** PayFast posts its notification to the old `?wc-api=` URL. On the new site that is the homepage, which answers 200, so PayFast treats it as delivered and nothing records it.

## N7, N8

- **N7:** the Organization JSON-LD now uses `lib/seo/site-logo.ts`, pointing at `/logos/logo-black.svg`, which exists. Test: `lib/seo/site-logo.test.ts`.
- **Canonical tags:** not changed, cosmetic.
- **N8:** the hosted `mjhwonoekokxyisfljtj.supabase.co` image host is removed. No code or data references a storage URL there. The legacy cookie prefix in middleware.ts stays; it clears old sessions.

## N9. Old-site integrations (new, from the old site's public REST index)

The old WordPress site exposes these integrations. Each stops at the switch, because the domain then reaches the new site. None is in the runbook:

- `wc-zapier`: Zapier zaps fired by WooCommerce orders. Someone's automation stops. Check Zapier for zaps on this site.
- `affwp`: AffiliateWP. Affiliate `?ref=` links and affiliate tracking stop. Check for active affiliates.
- `pattern-coach/v1`, `suzanne/v1`: the coaching app's API on the old site (KI113, known).
- `jet-form-builder`, `cleantalk`, `wordfence`: forms and protection on the old site only. No action.

## Sage

**What fails today (verified in code and docs):** no order has ever reached Sage.
- The Medusa Sage module (`apps/medusa/src/modules/sage/service.ts`) is registered, but nothing calls it.
- The only path is a fire-and-forget POST from the order-placed subscriber to the n8n webhook `medusa-order-placed` (`apps/medusa/src/subscribers/order-placed.ts:884`).
- n8n is retired on this project, and its Sage workflow never had credentials (KI010).
- A failed call leaves only a console line: no retry, no alert.

**Tested in a sandbox:** nothing recorded.
- The worklog's "Sage execution succeeded" on order #14 was the workflow's error branch, which always ends as success.
- No Sage company has ever been called.

**Also wrong in the code (to fix when it is built):**
- The tax type is 15%, but the company is not VAT registered (KI007, KI033).
- USD orders would book as ZAR (KI093).
- Amounts: the module divides unit_price by 100. That is correct, because this shop stores prices in cents (checked 26 Nov). An earlier version of this line called it a bug.
- The SAGE_CLIENT_ID/SECRET names are OAuth leftovers. Sage SA v2 uses a Sage login plus an API key and a company id.

**What is needed:**
1. **From Suzanne or her bookkeeper:**
   - a Sage login for the integration;
   - the company id;
   - the income account;
   - a no-VAT tax type;
   - how USD sales are booked.
2. **The API key.** The vault holds one Sage key, received 4 Aug: sandbox only. Corrected later on 26 Nov:
   - Sage asked for 8 OAuth 2.0 client details for live access. The reply was drafted 4 Aug and never sent.
   - So live access needs an OAuth sign-in, which is not built, and Sage's own review.
   - Full facts in docs/golive/2026-11-26-sage-report.md.
3. **Code:**
   - Move Sage into the outbox: an `AUTOMATION_SAGE` flag, retries, a dead-job alert, the metadata written in-process.
   - Fix tax, currency and amounts.
   - Retire the n8n call.
   - About 1-2 days.
4. **Test:** against a Sage trial company, half a day.

**Friday:** not possible. Sage must follow the switch.

**Orders from Friday until then:**
- They are complete in Medusa. Each order is marked by the absence of `metadata.sage_document_number`.
- A backfill script that sends every order without that mark is about half a day to a day. Because it is driven by the mark, it never sends an order twice.
- **Choose one:** either raise invoices by hand in Sage meanwhile (go-live readiness report) and backfill nothing, or raise none by hand and backfill once Sage works. Doing both duplicates invoices.
- The customer's own PDF invoice from the site is unaffected. It has no Sage number until then.
