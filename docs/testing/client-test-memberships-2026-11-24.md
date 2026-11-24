# Memberships: client test pack (24 Nov 2026)

Prepared for Suzanne's and Shayna's testing on http://169.239.180.49, the site that goes live at the DNS switch. Nothing here is created, published or sent; each item marked **Johan** needs his yes.

## 1. What they will see, and what could trip them up

### Fix or decide before they start (would confuse or embarrass)

| # | What they would hit | Why | Proposal |
|---|---|---|---|
| A | They buy Lifestyle (or Student, Novice) and the Resources and Videos pages unlock nothing new | KI130: the portal still gates content on the old Free/Silver/Gold/Practitioner groups; no level is mapped to them | Suzanne says which level opens which resources, then we map it. Until then, tell testers the level is recorded but content access is not wired yet |
| B | A sign-in or sign-up confirmation link opened on another device or in the phone's mail app says "The sign-in link has expired or is invalid" | The link only completes in the browser that asked for it (the one-time code check needs that browser's cookie). On a sign-up the email IS confirmed anyway, so the message is wrong | Tell testers: open the link in the same browser, or use Password login. Small code change proposed: reword the message ("If you just confirmed your email, log in with your password; otherwise request a new link and open it in the same browser") |
| C | Dashboard: "Upgrade to Silver or Gold membership for access to the full resource library..." | Old copy; there is no Silver or Gold product | Reword to the real levels (Johan/Suzanne) |
| D | Upgrade page: "Premier tiers include CPD tracking, community access, and extended resources" | From the first build of the 29 levels, not from Suzanne; none of it is built; Basic and Premier give the same access today | Suzanne says what Premier adds; until then remove the sentence |
| E | Product pages for S0212 and S0214 show a generic line and an empty "Details" section | No description in the store | Approve the drafts in section 3 |
| F | Welcome email: "We will remind you before it ends" | No reminder is built (first expiry Nov 2027) | Keep (we build it in 2027) or soften the line now |
| G | Novice: the pathway text says "Pay your Novice Navigator licence and annual membership fee"; the store charges the membership only | KI131: no licence or observation fee product | Suzanne decides the fee and whether it is part of the price |
| H | Team mail "Novice application from <email>" names the member by email only | The application has no name field filled | Minor; add the account name later |
| I | Dashboard lists membership purchases under "My Programmes" and shows "Continue Learning: COMING SOON" | Existing portal copy | Minor; note for Suzanne |

### Plain steps for the client mail (Johan to send)

**Become a member and buy a membership**
1. Go to http://169.239.180.49/portal/signup and create an account with your own email and a password.
2. Open the confirmation email on the same computer and browser, and click the link. If it says the link is expired or invalid, your email is still confirmed: go to http://169.239.180.49/portal/login and log in with your password.
3. Go to http://169.239.180.49/portal/upgrade. Choose a membership and click Upgrade Now.
4. Add it to the cart and go to checkout. Enter the test code we send you; the total becomes R0. Place the order.
5. You receive an order confirmation. For Lifestyle and Student you also receive "Your ... Membership is active", and the portal shows your level.

**Novice (Akashic or Energy Alignment & Optimisation)**
1. Buy the Novice membership the same way. You receive "What to upload for your Novice ... status".
2. Go to http://169.239.180.49/portal/novice, click Add files, choose your documents, then Send to your team.
3. The team receives "Novice application from ..." with a Review button.

**Review and approve (team, staff login)**
1. Log in at http://169.239.180.49/cms/admin with your staff login.
2. Open http://169.239.180.49/staff/novice and click the application.
3. Open the files, then click "Approve: start Novice access" (or write a note and click "Ask for more").
4. The member receives "Your ... Membership is active"; access runs for a year from the approval.

## 2. Accounts and paying nothing

| Person | Member account (portal) | Staff login (CMS) |
|---|---|---|
| Suzanne | She creates it herself at /portal/signup (her own choice of email) | sravenall@effectivenesscompany.com, created by Johan with create-staff-user.ts |
| Shayna | She creates it herself | support@ravenallinstitute.com, created by Johan |

- The staff login opens /staff/novice (approve) and /staff/submissions (the quiz and intake backup copy). It is separate from the portal account, so the same email can be used for both.
- To test the whole Novice loop one of them applies as a member and the other approves (or one person does both, in two windows).
- Passwords: the CMS cannot send mail, so Johan sets each password at the hidden prompt and gives it to each of them on its own channel (a Vaultwarden Send or by phone), never in a mail thread.
- The test Staff user johan@z-group.co.za (Jo Black) still holds the Staff role; with it, list-staff-users.ts with EXPECT_STAFF will report it as extra. Change its Role or delete it when testing is over (see section 5).

**Voucher.** Do not give out QA-SELFTEST-100: it is our internal code, 100% off everything, no end date and no use limit, and it already backs our own test records. Propose a separate code, as done for the team on 29 Sep (RI-TEAM-TEST-100, ended 16 Oct):
- Code `RI-MEMBERS-TEST-100`, 100% off the order, limited to the membership products if the promotion rules allow it (else order-level as before), 30 redemptions, ends Fri 18 Dec 2026 23:59 SAST.
- Created by Johan's yes through the Medusa admin API, recorded in SELF-TEST-PLAN.md and the cutover list, removed before the DNS switch.
- Each R0 test order still runs the normal order steps (confirmation email, invoice and the automations that are switched on), as our own trial orders #452 and #453 did.

## 3. The five draft launch memberships, and descriptions

| SKU | Title | Price | Path | Store |
|---|---|---|---|---|
| S0212 | Lifestyle Membership | R350 | paid, active at once | published |
| S0213 | Akashic Student Membership | R525 | paid, active at once | draft |
| S0214 | Akashic Novice Practitioner - Basic | R875 | paid, then upload, approve | published |
| S0215 | Akashic Novice Practitioner - Premier | R1 225 | paid, then upload, approve | draft |
| S0226 | Energy Alignment & Optimisation Student | R525 | paid, active at once | draft |
| S0227 | EAO Novice Practitioner - Basic | R875 | paid, then upload, approve | draft |
| S0228 | EAO Novice Practitioner - Premier | R1 225 | paid, then upload, approve | draft |

**Publishing:**
- **How:** Johan runs the publish script on the box, the same way as for S0212 and S0214 on 23 Nov. He runs it first as a dry run, then with `ONLY=membership-s0213,membership-s0215,membership-s0226,membership-s0227,membership-s0228`. The script adds metadata.tier and the sales channel, and refuses while any training level is published with the switch off.
- **Blockers in code:** none. The Energy Alignment Novice upload list exists (lib/novice/checklist.ts), and the database tiers are all present.
- **Content gaps:** item D (what Premier adds) and the descriptions below.
- **Student was never trial-purchased.** It takes the same path as Lifestyle (paid, active at once, welcome email), with access level 3 on the Akashic or EAO track. Propose one R0 trial of S0213 after publishing, then the upgrade page and dashboard check.

**Draft descriptions for Suzanne to approve.** They are built from her Career & Certification Pathway pages on the site (12 Nov documents) and the rules in the code. The parts in [brackets] are hers to fill.

- **S0212 Lifestyle Membership:** For anyone who uses Dr Suzanne Ravenall's work in their own life. No training or prerequisites needed. One payment a year; it does not renew by itself. [What Lifestyle members receive.]
- **S0213 Akashic Student Membership:** For people taking the Akashic Navigation™ programmes, AN1 Foundations and AN2 Reading for Others. As a Student you practise self-readings and readings for others on your way to Novice Navigator. No prerequisites. A Student does not yet offer readings to clients or charge for them, and remains a Student for no longer than 12 months.
- **S0214 Akashic Novice Practitioner - Basic Membership:** For Akashic Navigation™ Students who have completed AN1 + AN2, 21 self-readings and 8 readings for others. After payment you upload your documents and recordings; the Certification & Quality Assurance team checks them, usually within 15 working days, and your membership starts for a year from their approval. As a Novice Navigator you may offer readings and charge clients at Novice level.
- **S0215 Akashic Novice Practitioner - Premier Membership:** Everything in the Basic membership, plus [what Premier adds].
- **S0226 Energy Alignment & Optimisation Student Membership:** For people taking the Energy Alignment & Optimisation™ programmes, EA1 and EA2. As a Student you practise on yourself and with others on your way to Novice Practitioner. No prerequisites. A Student does not yet practise with clients or charge for it, and remains a Student for no longer than 12 months.
- **S0227 Energy Alignment & Optimisation Novice Practitioner - Basic Membership:** For Energy Alignment & Optimisation™ Students who have completed EA1 + EA2, 8 practice sessions on yourself and 8 with others. After payment you upload your documents and recordings; the Certification & Quality Assurance team checks them, usually within 15 working days, and your membership starts for a year from their approval. As a Novice Practitioner you may practise and charge clients at Novice level.
- **S0228 Energy Alignment & Optimisation Novice Practitioner - Premier Membership:** Everything in the Basic membership, plus [what Premier adds].

## 4. Form answers in the team mails (branch claude/form-answers-email)

**Before the deploy, Johan:**
1. Read back the quiz address, from infra/: `docker compose exec -T web printenv QUIZ_NOTIFY_EMAIL` (should be johan@aiautomations.co.za while testing).
2. Check that no intake form carries a recipient override, on the payload database: `select title, recipient_email from payload.intake_forms where recipient_email is not null;` (expect 0 rows).

**Then, with his yes:**
1. Merge cb4711e and 633ece5 into feature/design-standard. Only the worklog conflicts, and it is a two-sided append.
2. Run the Deploy workflow with services=web. No migration and no new env.

**After the deploy, on the box, from infra/:**
1. `docker compose --profile tools build payload-tools`. The tools image is separate and a web or payload deploy does not rebuild it, so new scripts are missing until then (the ERR_MODULE_NOT_FOUND seen today).
2. Create the two Staff logins with create-staff-user.ts.
3. Run list-staff-users.ts with `EXPECT_STAFF="sravenall@effectivenesscompany.com,support@ravenallinstitute.com"`.

**Test send:**
- One quiz and one intake form, completed as a test member. The mails go to our inbox while the notify addresses point there.
- Check that the answers are in the mail and that the staff page link works.

## 5. Before the DNS switch (list only, nothing deleted)

The full cutover list is in infra/DEPLOYMENT.md (DNS Cutover Checklist). From today's and yesterday's testing:

**Test orders and records:**
- Orders #452 (Lifestyle) and #453 (Novice), buyer johan+limit1023@aiautomations.co.za, R0 with QA-SELFTEST-100, and their confirmation emails.
- The test member account johan+limit1023@aiautomations.co.za (Supabase user 9247ad80-...). Its member_subscriptions rows are free x2, s0212 and s0214.
- That member's Novice application 2df06ea3-..., its 13 events, and the file qa-test-certificate.pdf in the novice-applications bucket.
- Empty cart cart_01M8404TVMBCWFP1A1HJFDRRQQ (S0216 refusal test).
- Harness result files docs/testing/results/purchase-run-2026-11-23-*.

**Accounts and vouchers:**
- Test Staff user johan@z-group.co.za ("Jo Black").
- Vouchers: QA-SELFTEST-100, RI-TEAM-TEST-100 (ended 16 Oct, still to remove), and the client code if created.

**Settings to change:**
- CONTACT_NOTIFY_EMAIL (now johan@aiautomations.co.za) and QUIZ_NOTIFY_EMAIL (to read back) must point at the team inbox Suzanne names. INTAKE_NOTIFY_EMAIL is unset, which means support@ravenallinstitute.com unless set.
- MEMBERSHIP_TRAINING_LEVELS stays off until the training levels open (KI133).
- The site address settings move from the IP to https://suzanneravenall.com: NEXT_PUBLIC_SITE_URL, PAYLOAD_URL / PAYLOAD_PUBLIC_SERVER_URL, and the nginx ip-testing.conf swapped for the production conf. All are already in the cutover checklist.

**Also to check:**
- Extra free rows that KI137 left on any real member who signed in more than once before 24 Nov: list them, then clean up per item.
