# A13 - Clean-up before and at the DNS switch: exact commands

From `docs/testing/client-test-memberships-2026-11-24.md` section 5 and `docs/testing/go-live-readiness-2026-11-25.md` section 4. Written 25 Nov 2026; nothing in this file has been run. The Supabase rows quoted below were read (SELECT only) on 25 Nov 13:30 UTC.

**Every item needs Johan's yes, per item.** Each item has: a read-back first (show the row), the change, a read-back after. Every SQL change runs in one transaction with `ON_ERROR_STOP`, and an assertion that aborts (rolls back) when the row count is not the expected one. Run the "dry run" form first where given (it ends in `ROLLBACK`).

Order: C1 vouchers are a gate before the switch (A9 G9). The rest can run Thursday on the review box or after the switch; the database is the same.

Where things run:
- **Medusa and CMS** are on the VPS (Johan pastes there, from `/var/www/suzanneravenall/suzanneravenall/infra`).
- **Supabase** (members, applications, quiz leads, Storage) is on aimate-db1: `ssh -i ~/.ssh/aimate-db aimate@102.68.99.31`, then `docker exec -i supabase-postgres psql -U supabase_admin -d suzanne` (we run it, after Johan's yes).

Admin addresses: before the switch `http://169.239.180.49/medusa/app` and `http://169.239.180.49/cms/admin`; after it the same paths on `https://suzanneravenall.com`.

---

## Helpers (paste once per shell)

**VPS, Medusa admin API** (runs inside the web container, which already holds the admin key or the admin login in its env; nothing is printed but the API answer):

```bash
cd /var/www/suzanneravenall/suzanneravenall/infra
madmin() {
  docker compose exec -T web sh -c '
    if [ -n "$MEDUSA_API_KEY" ]; then
      AUTH="Authorization: Basic $(printf "%s:" "$MEDUSA_API_KEY" | base64 | tr -d "\n")"
    else
      TOKEN=$(node -e "fetch(\"http://medusa:9000/auth/user/emailpass\",{method:\"POST\",headers:{\"content-type\":\"application/json\"},body:JSON.stringify({email:process.env.MEDUSA_ADMIN_EMAIL,password:process.env.MEDUSA_ADMIN_PASSWORD})}).then(r=>r.json()).then(j=>process.stdout.write(j.token||\"\"))")
      AUTH="Authorization: Bearer $TOKEN"
    fi
    curl -s -H "$AUTH" -H "Content-Type: application/json" "$@"; echo' sh "$@"
}
mdb() { docker compose exec -T postgres sh -c 'psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$1"' sh "$1"; }   # usage: mdb medusa <<'SQL' ... SQL
```

**aimate-db1, Supabase SQL:**

```bash
sdb() { docker exec -i supabase-postgres psql -v ON_ERROR_STOP=1 -U supabase_admin -d suzanne; }   # usage: sdb <<'SQL' ... SQL
```

---

## C1. Vouchers QA-SELFTEST-100 and RI-TEAM-TEST-100 (and campaign RI-TEAM-TEST-2026) - GATE, needs Johan's yes

Medusa v2's admin list can ignore an unknown filter and return its default list (no-bad-patterns, 21 Oct), so find the exact ids first, check each code by eye, then act on the id only.

Read-back:

```bash
mdb medusa <<'SQL'
select id, code, status, campaign_id, deleted_at from promotion where code in ('QA-SELFTEST-100','RI-TEAM-TEST-100');
select id, campaign_identifier, name, deleted_at from promotion_campaign where campaign_identifier = 'RI-TEAM-TEST-2026';
SQL
madmin "http://medusa:9000/admin/promotions?q=TEST-100&fields=id,code,status"
```

Expected: two promotion rows (one each code), one campaign row, none deleted. Write down the `promo_...` and `procamp_...` ids.

Change (one id at a time; replace the placeholders with the ids read above):

```bash
madmin "http://medusa:9000/admin/promotions/<promo id of QA-SELFTEST-100>?fields=id,code"     # must show QA-SELFTEST-100
madmin -X DELETE "http://medusa:9000/admin/promotions/<promo id of QA-SELFTEST-100>"
madmin "http://medusa:9000/admin/promotions/<promo id of RI-TEAM-TEST-100>?fields=id,code"    # must show RI-TEAM-TEST-100
madmin -X DELETE "http://medusa:9000/admin/promotions/<promo id of RI-TEAM-TEST-100>"
madmin "http://medusa:9000/admin/campaigns/<procamp id>?fields=id,campaign_identifier"         # must show RI-TEAM-TEST-2026
madmin -X DELETE "http://medusa:9000/admin/campaigns/<procamp id>"
```

Or in the Medusa admin UI: Promotions, open the code, the three-dot menu, Delete, confirm; Campaigns, open RI-TEAM-TEST-2026, Delete.

Softer alternative (keeps the rows, codes stop working): `madmin -X POST "http://medusa:9000/admin/promotions/<id>" -d '{"status":"inactive"}'`.

Read-back after: the SQL above shows `deleted_at` set (Medusa soft-deletes), and

```bash
madmin "http://medusa:9000/admin/promotions?fields=id,code,status&limit=100" | grep -oE '"code":"[^"]*"'   # neither code listed
```

Also: a client code, if one was created for the team's test (client-test doc section 5), is removed the same way. Note: once QA-SELFTEST-100 is gone, the self-test harness cannot place free orders; that is intended.

## C2. Medusa orders #452 and #453 - cancel, not delete; needs Johan's yes per order

By exact order id only. Read back `display_id` and `email` before each cancel.

Read-back:

```bash
mdb medusa <<'SQL'
select id, display_id, email, status, canceled_at from "order"
where id in ('order_01M83NNHNW6ZVXNCXMNT5S4JAH','order_01M8406G6D5R5KAXR4MVZAYDMF');
SQL
madmin "http://medusa:9000/admin/orders/order_01M83NNHNW6ZVXNCXMNT5S4JAH?fields=id,display_id,email,status,total"
madmin "http://medusa:9000/admin/orders/order_01M8406G6D5R5KAXR4MVZAYDMF?fields=id,display_id,email,status,total"
```

Expected: `order_01M83NNHNW6ZVXNCXMNT5S4JAH` is display_id **452** (Lifestyle), `order_01M8406G6D5R5KAXR4MVZAYDMF` is **453** (Novice), both email `johan+limit1023@aiautomations.co.za`, total 0 (QA-SELFTEST-100), not canceled. If any of these differ: stop.

Change:

```bash
madmin -X POST "http://medusa:9000/admin/orders/order_01M83NNHNW6ZVXNCXMNT5S4JAH/cancel"
madmin -X POST "http://medusa:9000/admin/orders/order_01M8406G6D5R5KAXR4MVZAYDMF/cancel"
```

Or in the admin UI: Orders, open #452 (check the email on the page), the three-dot menu, Cancel order; same for #453.

Read-back after: the SQL above shows `status = canceled` and `canceled_at` set for both. If Medusa refuses the cancel (for example because of a fulfilment), copy the message and stop: do not delete the order.

Cancelling an order does not remove the membership rows in Supabase; that is C4. Mail: the two confirmation mails went to Johan's own plus-address, nothing to recall.

## C3. Novice application 2df06ea3-f3ec-466d-aaf0-4a4f3a8c56f5, its events and its file - needs Johan's yes

Read 25 Nov: application for `johan+limit1023@aiautomations.co.za`, SKU S0214, order `order_01M8406G6D5R5KAXR4MVZAYDMF`, status approved; **12** rows in `novice_application_events` (the 24 Nov note says 13: the count read on the day is what counts); one Storage object `2df06ea3-f3ec-466d-aaf0-4a4f3a8c56f5/1795508026834-qa-test-certificate.pdf` in the private bucket `novice-applications`.

Decision first (Johan): `novice_application_events` is append-only on purpose (POPIA record of who looked at whose documents): a trigger refuses UPDATE, DELETE and TRUNCATE, and the foreign key from events to applications is `ON DELETE RESTRICT`.
- **Option A (recommended for a test record):** delete the file, the events and the application. The events can only go by switching the append-only trigger off **inside one transaction**, with the table locked, and on again before COMMIT; the assertion checks it is on again.
- **Option B:** delete only the file and keep the application and its events as the audit trail (they hold Johan's test address, nothing of a client).

### C3a. The file (both options)

Read-back:

```bash
sdb <<'SQL'
select id, bucket_id, name, created_at from storage.objects
where bucket_id = 'novice-applications' and name like '2df06ea3-f3ec-466d-aaf0-4a4f3a8c56f5/%';
SQL
sudo ls -R ~/apps/suzanne/storage-data/local/suzanne/novice-applications/2df06ea3-f3ec-466d-aaf0-4a4f3a8c56f5
```

Expected: one row, one file. Change, through the Storage API so the row and the file on disk go together (the service key is read from the box's own `.env` into a variable and never printed):

```bash
SRK=$(grep -E '^SERVICE_ROLE_KEY=' ~/apps/suzanne/.env | cut -d= -f2- | tr -d '"')
curl -s -X DELETE "https://suzanne.db.aimate.co.za/storage/v1/object/novice-applications" \
  -H "apikey: $SRK" -H "Authorization: Bearer $SRK" -H "Content-Type: application/json" \
  -d '{"prefixes":["2df06ea3-f3ec-466d-aaf0-4a4f3a8c56f5/1795508026834-qa-test-certificate.pdf"]}'; echo
unset SRK
```

Read-back after: the SELECT returns 0 rows; the `ls` finds no file.

### C3b. Events and application (Option A only)

Dry run (ends in ROLLBACK, changes nothing):

```bash
sdb <<'SQL'
BEGIN;
SELECT id, email, sku, medusa_order_id, status FROM public.novice_applications
 WHERE id = '2df06ea3-f3ec-466d-aaf0-4a4f3a8c56f5';
SELECT action, actor_type, created_at FROM public.novice_application_events
 WHERE application_id = '2df06ea3-f3ec-466d-aaf0-4a4f3a8c56f5' ORDER BY created_at;
LOCK TABLE public.novice_application_events IN ACCESS EXCLUSIVE MODE;
ALTER TABLE public.novice_application_events DISABLE TRIGGER novice_application_events_append_only;
WITH d AS (DELETE FROM public.novice_application_events
            WHERE application_id = '2df06ea3-f3ec-466d-aaf0-4a4f3a8c56f5' RETURNING 1)
SELECT count(*) AS events_deleted FROM d;
ALTER TABLE public.novice_application_events ENABLE TRIGGER novice_application_events_append_only;
WITH d AS (DELETE FROM public.novice_applications
            WHERE id = '2df06ea3-f3ec-466d-aaf0-4a4f3a8c56f5'
              AND lower(email) = 'johan+limit1023@aiautomations.co.za' RETURNING 1)
SELECT count(*) AS applications_deleted FROM d;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM public.novice_application_events WHERE application_id = '2df06ea3-f3ec-466d-aaf0-4a4f3a8c56f5')
     OR EXISTS (SELECT 1 FROM public.novice_applications WHERE id = '2df06ea3-f3ec-466d-aaf0-4a4f3a8c56f5')
  THEN RAISE EXCEPTION 'rows left'; END IF;
  IF (SELECT count(*) FROM pg_trigger WHERE tgrelid = 'public.novice_application_events'::regclass
        AND NOT tgisinternal AND tgenabled = 'O') <> 2
  THEN RAISE EXCEPTION 'append-only triggers not both enabled'; END IF;
END $$;
ROLLBACK;
SQL
```

Expected in the dry run: 1 application row, 12 event rows listed, `events_deleted 12`, `applications_deleted 1`, no exception, then ROLLBACK. For the real run, paste the same block with the last line `COMMIT;` instead of `ROLLBACK;`.

Read-back after COMMIT:

```bash
sdb <<'SQL'
select count(*) from public.novice_applications where id = '2df06ea3-f3ec-466d-aaf0-4a4f3a8c56f5';            -- 0
select count(*) from public.novice_application_events where application_id = '2df06ea3-f3ec-466d-aaf0-4a4f3a8c56f5';  -- 0
select tgname, tgenabled from pg_trigger where tgrelid = 'public.novice_application_events'::regclass and not tgisinternal;  -- both O
SQL
```

## C4. Test member johan+limit1023@aiautomations.co.za (Supabase user 9247ad80-47ec-4f78-b59b-76ec97bd0529) - needs Johan's yes

Read 25 Nov: the user exists (created 23 Oct); four `member_subscriptions` rows, all active:

| id | tier slug | created (UTC) |
|---|---|---|
| 5840e230-7f3b-4ff5-becb-7fa3e0f75ff9 | free | 23 Oct 09:39 |
| e6b0fdb9-ddf7-4170-b556-52ffb1cc0024 | s0212 (Lifestyle) | 23 Nov 07:42 |
| 822be877-23b3-49da-a866-f2511a589503 | free (the KI137 extra row) | 24 Nov 08:13 |
| 80783f43-9cfd-4bff-857f-41d8b4652956 | s0214 (Akashic Novice Basic) | 24 Nov 09:19 |

No `profiles`, `leads` or `email_unsubscribes` rows for this address. Foreign keys to `auth.users`: identities, sessions, mfa_factors, one_time_tokens, member_subscriptions and profiles cascade; `novice_applications.user_id` is set to null.

### C4a. Membership rows only (if Johan wants to keep the login for later tests)

```bash
sdb <<'SQL'
BEGIN;
SELECT s.id, t.slug, s.status, s.created_at FROM public.member_subscriptions s
  LEFT JOIN public.membership_tiers t ON t.id = s.tier_id
 WHERE s.user_id = '9247ad80-47ec-4f78-b59b-76ec97bd0529' ORDER BY s.created_at;
WITH d AS (DELETE FROM public.member_subscriptions
            WHERE user_id = '9247ad80-47ec-4f78-b59b-76ec97bd0529' RETURNING 1)
SELECT count(*) AS deleted FROM d;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM public.member_subscriptions WHERE user_id = '9247ad80-47ec-4f78-b59b-76ec97bd0529')
  THEN RAISE EXCEPTION 'rows left'; END IF;
END $$;
ROLLBACK;   -- dry run; COMMIT for the real run
SQL
```

Expected: the four rows above, `deleted 4`.

### C4b. The whole account (recommended; includes C4a through the cascade)

Run after C3 (so the application no longer points at it; with Option B the application keeps its row and its `user_id` becomes null).

```bash
sdb <<'SQL'
BEGIN;
SELECT id, email, created_at, last_sign_in_at FROM auth.users
 WHERE id = '9247ad80-47ec-4f78-b59b-76ec97bd0529';
SELECT count(*) AS subscriptions FROM public.member_subscriptions WHERE user_id = '9247ad80-47ec-4f78-b59b-76ec97bd0529';
WITH d AS (DELETE FROM auth.users
            WHERE id = '9247ad80-47ec-4f78-b59b-76ec97bd0529'
              AND email = 'johan+limit1023@aiautomations.co.za' RETURNING 1)
SELECT count(*) AS users_deleted FROM d;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE id = '9247ad80-47ec-4f78-b59b-76ec97bd0529')
     OR EXISTS (SELECT 1 FROM public.member_subscriptions WHERE user_id = '9247ad80-47ec-4f78-b59b-76ec97bd0529')
     OR EXISTS (SELECT 1 FROM auth.identities WHERE user_id = '9247ad80-47ec-4f78-b59b-76ec97bd0529')
  THEN RAISE EXCEPTION 'rows left'; END IF;
END $$;
ROLLBACK;   -- dry run; COMMIT for the real run
SQL
```

Expected: one user row, `subscriptions 4` (or 0 after C4a), `users_deleted 1`. Read-back after COMMIT: `select count(*) from auth.users where email ilike 'johan+limit1023%';` is 0.

Outside Supabase (read-only check, then Johan's yes per record): the two orders may have created a Vtiger contact and sales orders for this address (order automation). Search Vtiger for `johan+limit1023@aiautomations.co.za` with the CRM script before deciding; CRM writes are per item.

## C5. Quiz lead johan+quiz1124@aiautomations.co.za - needs Johan's yes

Read 25 Nov: one `quiz_subscribers` row `0bd86087-321f-495d-9111-84f519489f0b`, quiz `emotional-nervous-system-mastery`, completed 24 Nov. No `leads` row for the address. Staff views of it, if any, are in the append-only `staff_submission_views` (ids only): they stay.

```bash
sdb <<'SQL'
BEGIN;
SELECT id, quiz_slug, status, created_at FROM public.quiz_subscribers
 WHERE lower(email) = 'johan+quiz1124@aiautomations.co.za';
SELECT count(*) AS staff_views_kept FROM public.staff_submission_views
 WHERE submission_id = '0bd86087-321f-495d-9111-84f519489f0b';
WITH d AS (DELETE FROM public.quiz_subscribers
            WHERE id = '0bd86087-321f-495d-9111-84f519489f0b'
              AND lower(email) = 'johan+quiz1124@aiautomations.co.za' RETURNING 1)
SELECT count(*) AS deleted FROM d;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM public.quiz_subscribers WHERE lower(email) = 'johan+quiz1124@aiautomations.co.za')
  THEN RAISE EXCEPTION 'rows left'; END IF;
END $$;
ROLLBACK;   -- dry run; COMMIT for the real run
SQL
```

Expected: one row, `deleted 1`. If the quiz sign-up also created a Vtiger lead or a Brevo contact, check and remove those per item (read first).

## C6. KI137 extra Guest (free) rows on real members - list first, then per item

Read 25 Nov: exactly **one** member has more than one free row, and it is the test member (C4). Excluding the test member: **0**. Run the listing again on the day; delete only if it lists real members, and only after Johan has seen the list.

Listing:

```bash
sdb <<'SQL'
SELECT s.user_id, u.email, count(*) AS free_rows, min(s.created_at) AS first_row, max(s.created_at) AS last_row
  FROM public.member_subscriptions s
  JOIN public.membership_tiers t ON t.id = s.tier_id AND t.slug = 'free'
  LEFT JOIN auth.users u ON u.id = s.user_id
 GROUP BY s.user_id, u.email
HAVING count(*) > 1
 ORDER BY last_row DESC;
SQL
```

Change, for ONE member at a time (keeps the oldest free row, deletes the later ones; replace `<user id>` and `<n>` with the listed id and its `free_rows - 1`):

```bash
sdb <<'SQL'
BEGIN;
WITH ranked AS (
  SELECT s.id, row_number() OVER (ORDER BY s.created_at, s.id) AS rn
    FROM public.member_subscriptions s
    JOIN public.membership_tiers t ON t.id = s.tier_id AND t.slug = 'free'
   WHERE s.user_id = '<user id>'),
d AS (DELETE FROM public.member_subscriptions WHERE id IN (SELECT id FROM ranked WHERE rn > 1) RETURNING id)
SELECT count(*) AS deleted FROM d;
DO $$ BEGIN
  IF (SELECT count(*) FROM public.member_subscriptions s JOIN public.membership_tiers t ON t.id = s.tier_id AND t.slug = 'free'
       WHERE s.user_id = '<user id>') <> 1 THEN RAISE EXCEPTION 'expected exactly one free row left'; END IF;
END $$;
ROLLBACK;   -- dry run (deleted must be <n>); COMMIT for the real run
SQL
```

Read-back after: the listing no longer shows that member.

## C7. CMS users - needs Johan's yes per user

The CMS (Payload) users live in the VPS database `payload`, not in Supabase (the `public.users` table in Supabase is an empty leftover from April). Only an Admin can change users.

Read-back (Johan, VPS):

```bash
mdb payload <<'SQL'
select id, email, role, created_at from users order by email;
SQL
docker compose --profile tools run --rm -e EXPECT_STAFF="sravenall@suzanneravenall.com,support@ravenallinstitute.com" payload-tools npx payload run src/scripts/list-staff-users.ts
```

(If the tools image is older than `list-staff-users.ts`, first `docker compose --profile tools build payload-tools`, per DEPLOYMENT.md.) Today the script is expected to say MISMATCH: missing sravenall@suzanneravenall.com, extra sravenall@effectivenesscompany.com and johan@z-group.co.za.

Changes, in the CMS admin UI (`/cms/admin`, logged in as Johan, an Admin):

| # | User | Click path | Result |
|---|---|---|---|
| C7a | johan@z-group.co.za ("Jo Black", test Staff) | Collections, Users, click the row, the three-dot menu (top right), Delete, confirm | gone |
| C7b | sravenall@effectivenesscompany.com (Staff on the wrong address) | Users, click the row, Delete, confirm. Or, to keep it: Role = Editor, Save | gone or Editor |
| C7c | sravenall@suzanneravenall.com (Suzanne's login, Admin today) | Users, click the row, Role = "Staff (reads quiz and intake answers)", Save | Staff. She can then no longer manage users or delete intake forms (readiness report section 3, option A) |

Do C7c only with Johan's yes to option A, and tell Suzanne the same day that her existing password is unchanged and she now sees the staff pages.

Read-back after: the SQL lists the three changes; `list-staff-users` prints MATCH for exactly `sravenall@suzanneravenall.com` and `support@ravenallinstitute.com`. Then Suzanne opens `/staff/submissions/quiz` once and sees the list (A14 S-03).

## C8. Empty cart cart_01M8404TVMBCWFP1A1HJFDRRQQ (S0216 refusal test) - needs Johan's yes

Medusa v2 has no admin API to delete a cart. An empty, uncompleted cart is harmless (nothing to remind about, no order). **Recommended: leave it.** If Johan wants it gone, soft-delete it:

```bash
mdb medusa <<'SQL'
BEGIN;
SELECT c.id, c.email, c.completed_at, c.deleted_at,
       (SELECT count(*) FROM cart_line_item li WHERE li.cart_id = c.id AND li.deleted_at IS NULL) AS items
  FROM cart c WHERE c.id = 'cart_01M8404TVMBCWFP1A1HJFDRRQQ';
WITH u AS (UPDATE cart SET deleted_at = now()
            WHERE id = 'cart_01M8404TVMBCWFP1A1HJFDRRQQ' AND completed_at IS NULL AND deleted_at IS NULL
              AND NOT EXISTS (SELECT 1 FROM cart_line_item li WHERE li.cart_id = cart.id AND li.deleted_at IS NULL)
           RETURNING 1)
SELECT count(*) AS soft_deleted FROM u;
ROLLBACK;   -- dry run (soft_deleted 1); COMMIT for the real run
SQL
```

## C9. Harness result files docs/testing/results/purchase-run-2026-11-23-*

Not in this worktree's git (`git ls-files` finds only the September runs). If they exist in another checkout, they are untracked local files: delete them there, or keep them as test evidence. No server action. Johan's call.

## C10. Settings that are clean-up, not data (in A9)

`CONTACT_NOTIFY_EMAIL`, `QUIZ_NOTIFY_EMAIL`, `INTAKE_NOTIFY_EMAIL` to the team inbox; `MEMBERSHIP_TRAINING_LEVELS` stays off. These are set in `.env.golive` (A9 step T3), not here.

---

## Record of what was done

| Item | Johan's yes (date) | Done (date, by) | Read-back after |
|---|---|---|---|
| C1 vouchers | | | |
| C2 order #452 | | | |
| C2 order #453 | | | |
| C3a file | | | |
| C3b application + events (A or B) | | | |
| C4 test member (a or b) | | | |
| C5 quiz lead | | | |
| C6 KI137 rows | | | |
| C7a johan@z-group.co.za | | | |
| C7b sravenall@effectivenesscompany.com | | | |
| C7c sravenall@suzanneravenall.com to Staff | | | |
| C8 cart | | | |
| C9 harness files | | | |
