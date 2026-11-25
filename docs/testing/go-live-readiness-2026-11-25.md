# Go-live readiness: where we are and what is left (25 Nov 2026)

Answer to Suzanne's mails of 24 Nov ("I want to go live this week before friday"; "Please tell me where we are now What is left"). Read and report only: nothing changed, deployed, published, deleted or sent.

- **New site:** http://169.239.180.49, which becomes suzanneravenall.com at the DNS switch.
- **Current site:** https://suzanneravenall.com, WordPress 7.1.5 + Elementor + WooCommerce, read on 25 Nov.
- **Effort:** our hours of work, not elapsed time.
- **Gate:** must be in before the DNS switch. **After:** can follow in the week after.

## 1. Her 17 instructions against the site now

| # | Instruction | State | Evidence | Work | Effort | Gate? |
|---|---|---|---|---|---|---|
| 1 | Newsletter pop-up like the current site | NOT DONE | See [Newsletter pop-up](#newsletter-pop-up) | Build a pop-up with the same fields and timing that saves to `leads` and the newsletter list, with the POPIA opt-in. Show it once per visitor per N days, not every visit as today | 3-4 h | After (nice to have) |
| 2 | Use the privacy documents on the current site | PARTLY | See [Legal documents](#legal-documents-current-site-vs-new-site) | Bring across her Privacy Policy wording, the T&C media and recording licence and live-programme rules, and the refund policy | 3-4 h, plus her yes on the result | Gate (her instruction) |
| 3 | Her login is sravenall@suzanneravenall.com | NOT DONE | That address is a CMS **admin**; the Staff login was made on sravenall@effectivenesscompany.com | See [section 3](#3-suzannes-staff-login) | 5 min (Johan) | Gate |
| 4 | PO Box on the Privacy Notice | PARTLY | /legal/privacy shows both "Physical address: Oxmoor Street, Kyalami Estates, Johannesburg, 1684" and "Postal address: PO Box 910, Kyalami, 1684" (LegalPrivacyContent.tsx:278-291) | Drop the street address. Use her signature's form: PO Box 910, Kyalami, Midrand, Johannesburg, 1685 (her signature says 1685, the site says 1684) | 15 min | Gate |
| 5 | Avatar: they made one | n/a | | Ask for it only if the site needs it | 0 | After |
| 6-7 | Every live programme enrols into its LIVE Thinkific course | DONE (data) | See [Live programmes and Thinkific](#live-programmes-and-thinkific) | Confirm the live course ids are still the right courses in Thinkific | 30 min with Thinkific open | Gate (check only) |
| 8 | 12 months access; lifetime is a paid add-on | PARTLY | Add-on is offered and worded right on EAO, Akashic and shop pages. **Four places say the opposite**, see [Access wording](#access-wording-12-months-lifetime-is-paid) | Reword those four. Optionally enforce 12 months (a Thinkific expiry date on enrolment); today nothing expires | 1 h wording; 2 h expiry | Wording: gate. Expiry: after |
| 9 | Therapy sessions get add-ons | NOT DONE | Our five sessions get none (lib/shop/addons.ts:71-75). On the current site they get none either, only WooCommerce "Related products" (other sessions and packages) | Propose: Email Support and the Coaching Support Package, the same as coaching. Then the code change in addons.ts | 1 h after her yes | After |
| 10 | Safeguarding policy: find one, she approves | NOT DONE | | Draft from a reputable South African template (children and vulnerable adults) for her approval | 2-3 h drafting | After |
| 11 | Sixth testimonial video: check for no name and no "Austria", then publish; remove the old one | NOT DONE | The site shows 5 videos (VideoTestimonials.tsx:12-19). The sixth (E4x3YETXHSA "International Client") was removed 5 Oct because it was private (KI042). KI099: YouTube titles may still carry names | Her team checks the video on YouTube and makes it public (we cannot edit her channel), then we embed it (15 min). "The old video": which one is still to identify | 15 min ours | After |
| 12 | Use support@ instead of membersupport@ and certification@ | NOT DONE | membersupport@ appears about 100 times in the pathway pages and is the reply-to on the Novice mails (lib/email/novice.ts:14); certification@ appears 23 times (certificationPathways/index.ts:14-15, pathway data) | Replace with support@ravenallinstitute.com; update the tests | 1 h | Gate (dead addresses on a live page) |
| 13 | Recording & Consent / booking terms from the current site | NOT DONE | Her current T&C carries the media and recording licence and the live-programme conduct rules. The new site has none of it, only a pathway reference to a "Recording & Consent Form" | Bring the sections into /legal/terms (the checkout tick already links there) | Part of item 2 | Gate |
| 14 | Shayna confirms she checked the whole site | Theirs | | | | Gate (their sign-off) |
| 15-17 | Confirm memberships with Carla from Wild Apricot; Carla checks after go-live; then close Wild Apricot | NOT DONE | See [section 2](#2-memberships-vs-wild-apricot) | One-page table to Carla | 30 min ours | Memberships can open after DNS |

### Newsletter pop-up

On the current site it is Elementor pop-up 7688, homepage only.
- **When it appears:** 30 seconds after the page loads, on every visit, with no frequency limit. Johan's browser has seen it 6 times.
- **What it says:** "Sign up for our newsletter to stay in touch with our latest updates".
- **Fields:** First Name, Last Name, Email (required), Contact Number (required). Then Subscribe.
- **Where sign-ups go:** set in the Elementor form actions on the WordPress server, which the public page does not show. Johan or her web admin can see it in WordPress, Templates, Popups, 7688.

The new site has a newsletter form near the bottom of /resources and in the footer, but no pop-up.

### Legal documents: current site vs new site

| Current site (footer) | Content | New site |
|---|---|---|
| Privacy Policy (/privacy-policy/) | Short, about 5,600 characters. "The Protection of Personal Information Act in relation to payment information held by us"; the company and its brands; what is collected; use; disclosure; security; access and correction rights; definition of personal information; a section on live training programmes (recording); how to contact. Heading typo "Privay Policy" | /legal/privacy "Privacy Notice": the fuller POPIA notice built with Shayna (Information Officer, processors, rights). Different and longer. 7 legal-review markers (not shown on the page) |
| Terms and Conditions & Waiver (/terms-and-conditions/) | Brands; delivery; returns and refunds (full refund within 30 days if unavailable, 3% admin fee on client cancellation); damaged goods; payment (cards via PayGate); PAIA reference; mentorship; IP; general terms. **Event media licence:** "you may have been captured ... photo or video ... you grant The Ravenall Institute a non-exclusive, perpetual ... license", opt-out by mail to support@. **Live programmes:** video on, sound muted and other conduct rules. Company: The Ravenall Institute Pty Ltd, 2012/180720/07, physical address Oxmoor Street, support@ravenallinstitute.com | /legal/terms "Terms of Service" with section 4A Sessions (48 working hours notice, no-shows, live). **Lacks:** the media and recording licence, the live-programme rules, the 3% admin fee refund wording, mentorship, the PayGate card wording |
| Disclaimer (/disclaimer/) | Educational purposes; no medical advice; no guarantees; earnings; testimonials; risk; liability; **"We will give you back your money, should you not be satisfied with the provided Service within 7 days"** | /legal/disclaimer: check against hers. Her 7-day money-back line is a promise our Terms must match |
| Checkout tick | WooCommerce standard: links to her T&C page (not opened here: an empty cart cannot reach checkout) | Checkout tick "I have read and accept the Terms and Conditions" linking /legal/terms, required |
| Cookie notice | "Privacy Overview" (a cookie plugin) | /legal/cookies Cookie Policy and the consent bar |

None of the three pages is titled "terms and conditions of booking" or "Recording & Consent Form". What she describes is the T&C & Waiver page.

**Proposal:** keep our Privacy Notice; add her payment-information and live-training paragraphs. Add her media licence, live-programme rules and refund terms to /legal/terms. Make the Disclaimer's 7-day line and the Terms agree. Then send her the before and after.

### Live programmes and Thinkific

Every live variant enrols its "(Live via Zoom)" course; none points at a self-study course. Enrolment reads `metadata.thinkific_course_id` on the variant (thinkific-enrolment.ts:62-67); the course ids were set by the 6 and 8 Oct migrations and audited on 15 Oct.

| Programmes | Live course |
|---|---|
| Rapid Repatterning Programs 1-7 and 9, Full Basic 1-5 Live, Accelerated Basic 5 | Their Live via Zoom courses |
| Akashic L1, L2, L1&2 | 2434137, 2434102 |
| Energy Alignment & Optimisation L1, L2, L1&2 | 1892663, 1892662 |
| Trauma to Transcendence | 2331256 |
| Finding My Life Purpose | 2434115 |

Retakers use the same live course.

**No course on purpose:** live group sessions (booked as a series) and Practitioner Mentorship.

**Not verified:** names and status in Thinkific itself (the ids come from the August course snapshot).

### Access wording: 12 months, lifetime is paid

Places that contradict "12 months, lifetime is a paid add-on":
- ProgramsPageClient.tsx:585: "you have access for as long as you need".
- components/services/Programs.tsx:57: "access to them for as long as you need and want them".
- data/programs.ts:350 and :360 (Trauma to Transcendence): "access for as long as you need" and "Lifetime access to all recordings and materials".

Other points:
- Bonus Lifetime Access is offered in the cart with any programme that has a self-study variant, live buyers included. It is fulfilled by hand: no course is enrolled automatically.
- It is not offered on the Full Basic + Demos bundles or the recorded group series, although the Recorded Group Healing page says it is.

## 2. Memberships vs Wild Apricot

**What we hold from Wild Apricot:** nothing.
- No export, no member list and no member count in the repo.
- The 29 levels came from the 1 Jun build "implement 29 real membership tiers (Wild Apricot structure)". It cites no source for names or prices.
- D003 planned a member migration; KI012 has it on hold, waiting for credentials.
- Shayna wrote on 23 Nov that the Wild Apricot directory holds "just us admins ... The only one on the directory is Suzanne". So there may be no paying members to move.

**One-page table for Carla (proposal: "this is what the website sells; correct anything that differs from Wild Apricot").**

**On sale at launch:**

| SKU | Membership | Price | How it starts |
|---|---|---|---|
| S0212 | Lifestyle | R350 / USD 20 a year | On payment |
| S0213 | Akashic Student | R525 / USD 30 | On payment |
| S0226 | Energy Alignment & Optimisation Student | R525 / USD 30 | On payment |
| S0214 | Akashic Novice Practitioner Basic | R875 / USD 50 | On approval of the documents |
| S0215 | Akashic Novice Practitioner Premier | R1,225 / USD 70 | On approval of the documents |
| S0227 | EAO Novice Practitioner Basic | R875 / USD 50 | On approval of the documents |
| S0228 | EAO Novice Practitioner Premier | R1,225 / USD 70 | On approval of the documents |

**Held back** (not on sale), per track Akashic / EAO:
- Practitioner Basic / Premier: R1,400 / R1,750.
- Certified Practitioner Basic / Premier: R1,750 / R2,100.
- Certified Advanced Practitioner Basic / Premier: R1,750 / R2,100.
- Mentor Premier: R1,750.
- Master Practitioner Premier: R2,625. EAO also has a Certified Master Practitioner, which Akashic does not.
- Instructor Premier: R2,625.
- Certified Master Instructor Premier: R2,625.

**Rules on the site:**
- One payment a year; it does not renew by itself; it runs 365 days.
- Lifestyle and Student have no prerequisites.
- Novice needs AN1+AN2 or EA1+EA2 and the documents.
- Guest is the free level.

**Questions for Carla, flagged in the table:**
- Is a Mentor cheaper than a Certified Premier (R1,750 against R2,100) correct?
- Does Akashic have a Certified Master Practitioner level?
- Is there a Rapid Repatterning membership track? The pathways cover Rapid Repatterning; the levels do not.
- What does Premier give over Basic?
- What does Lifestyle give? (This is KI130: no level opens any content yet.)
- Are there current paying members, with renewal dates, to carry over?

## 3. Suzanne's Staff login

What exists:
- sravenall@suzanneravenall.com is a CMS **admin**.
- Admins cannot open /staff pages; only the Staff role can (payload-session.ts:86, Johan's decision of 18 Nov).
- create-staff-user refuses an existing email.
- sravenall@effectivenesscompany.com was created as Staff on the address she says is wrong.

| Option | What it takes | What it breaks |
|---|---|---|
| **A. Change sravenall@suzanneravenall.com to Staff** (CMS, Users, Role) | 5 min, Johan; no code | She can no longer manage users or delete intake forms (admin only). She can still edit content. Johan stays admin |
| B. Let admins open the staff pages too | Small code change, a web deploy | Every admin, Johan included, can read client answers. Goes against "Staff only" (18 Nov) and the two-logins rule |
| C. Staff login on a third address | Johan runs create-staff-user | She has two CMS logins, and the address is not the one she asked for |

**Recommendation: A.** Also change sravenall@effectivenesscompany.com to Editor, or delete it, so the Staff list is exactly Suzanne and Shayna. The test Staff user johan@z-group.co.za goes too once testing is over. Check the result with list-staff-users (EXPECT_STAFF).

## 4. The DNS switch: gates and clean-up

| Gate | State | Who acts | Effort |
|---|---|---|---|
| **Live payments:** PayFast and PayPal sandbox off (both `true` on the box), live merchant and PayPal credentials in place, one real low-value payment each | OPEN. No record of live credentials (KI018, PRECONDITIONS P4) | Suzanne/Johan supply credentials; we switch and test | 1-2 h after credentials |
| SSL: certbot for suzanneravenall.com + www | OPEN. ssl-init.sh still has EMAIL="YOUR_EMAIL" and asks for staging, n8n, cal and community subdomains that have no DNS; no renewal timer in the repo | Us, right after DNS points at the box | 1 h |
| Production nginx conf | OPEN. Has drifted from ip-testing.conf: lacks /uploads/ and /api/auth | Us | 1-2 h with a test |
| Env to https | OPEN. NEXT_PUBLIC_SITE_URL, PAYLOAD_URL, PAYLOAD_PUBLIC_SERVER_URL, NEXT_PUBLIC_MEDUSA_URL, CORS, Cal.com URL and webhook; the web build bakes NEXT_PUBLIC values in, so web and payload are rebuilt. The checklist misses NEXT_PUBLIC_SITE_URL and PAYLOAD_PUBLIC_SERVER_URL | Us (Johan on the box) | 1 h + rebuild |
| Login server (aimate-db1): SITE_URL to https, autoconfirm off, https in the mail templates | OPEN. The redirect allow-list already has https | Us | 30 min |
| Notify addresses: CONTACT_NOTIFY_EMAIL and QUIZ_NOTIFY_EMAIL now Johan's inbox; INTAKE_NOTIFY_EMAIL unset (falls back to support@) | OPEN | Suzanne names the inbox; Johan sets it | 10 min |
| Test vouchers QA-SELFTEST-100 and RI-TEAM-TEST-100 | OPEN | Johan | 10 min |
| /admin (Medusa) and /cms protection | OPEN. KI014 assumed Cloudflare, but DNS is at Xneelo with no Cloudflare (KI034); KI126 no MFA on the CMS | Johan picks: Cloudflare in front, or nginx allow-list / basic auth. We build | 1-3 h |
| **Sage accounting** | OPEN and BLOCKED. Credentials missing (KI010); the Sage step still runs through the retired n8n, so **no order reaches Sage today**; USD orders would book as ZAR (KI093) | Suzanne/bookkeeper, then us | 1-2 days after credentials |
| Lawyer review of /legal | OPEN: 24 review markers (comments, not shown), minors (KI102), processor countries (KI123) | Client and lawyer | Third party |
| Search index | CLOSED (seeded 19 Aug, reindexed 22 Oct, nightly job); one reindex after the switch | Us | 15 min |
| Sentry | Keys are set locally; the production environment tag on the box is not verified; KI001 out of date | Us | 30 min |
| VAT number on the invoice | CLOSED by design (not VAT registered, KI033) | n/a | |
| Mail domain (Brevo) | CLOSED (verified 23 Sep) | n/a | |
| Backups | The VPS script covers medusa, payload, n8n and calcom; **Supabase on aimate-db1 is not in it**; cron state not verified | Us | 30 min check, 1 h fix |
| **Coaching app (KI113)** | OPEN. It validates users against the old WordPress site, which goes away at the switch | Johan decides | ? |
| Newsletter links after cutover (KI108) | OPEN | Us | 30 min |
| Clean-up from testing | OPEN. Orders #452 and #453; test member johan+limit1023 and its rows, application, events and file; test quiz lead johan+quiz1124; test Staff user johan@z-group.co.za; harness result files; KI137 extra Guest rows on real members | Johan, per item | 1 h |

## 5. Honest read

**Smallest set to switch DNS before Friday 27 Nov without losing orders, mail or members, or embarrassing her:**
1. **Payments live** (credentials plus one real test each). Without them every order fails. This is the one item we cannot do alone; it needs her merchant and PayPal details today or tomorrow.
2. **The switch mechanics:** SSL, production nginx, env to https and rebuild, login server URL, notify addresses to her team inbox, test vouchers and test records removed. About half a day of our time plus Johan on the box, best done Thursday morning with Friday as the buffer.
3. **Her wording items:**
   - support@ everywhere (#12);
   - PO Box (#4);
   - her recording licence, live rules and refund terms in our Terms (#2, #13), with the Disclaimer's 7 days matched;
   - the four "as long as you need" lines (#8).

   About one working day.
4. **Her login** (Option A, 5 min) and Shayna's sign-off (#14).
5. **Two decisions from Johan:** what happens to the coaching app that validates against WordPress (KI113), and /admin protection (at least an nginx allow-list on day one).

**Can safely follow in the week after:**
- the newsletter pop-up;
- session add-ons (after her yes);
- the safeguarding policy;
- the sixth video;
- the 12-month expiry;
- memberships opening (after Carla's check; KI130 content mapping; the 5 drafts);
- Sage. Orders are kept in the shop, and invoices can be raised by hand until it is wired, if her bookkeeper agrees;
- lawyer review;
- MFA.

**Is Friday realistic?** Yes, for the website itself, if two things are true by Thursday morning:
- the live PayFast and PayPal credentials are in hand, and she accepts that Sage (accounting) and memberships follow next week;
- Johan has decided the coaching app and admin protection.

**Not realistic by Friday:**
- **Memberships "confirmed with Carla" and Wild Apricot shut.** That needs Carla's reply and the content mapping (KI130), which nobody has given us.
- **Sage**, without credentials.

Say so to her now rather than on Thursday.

## Who answers what

**Only Suzanne, Shayna or Carla:**
- live PayFast and PayPal credentials;
- the team inbox for form and quiz mails;
- Sage credentials and the USD rule;
- Wild Apricot levels and members (Carla);
- what Lifestyle and Premier give;
- which add-ons the five sessions get;
- the safeguarding policy approval;
- the sixth video made public on YouTube;
- Shayna's whole-site sign-off;
- yes to the merged legal wording;
- whether "the old video" means the YouTube one.

**Johan:**
- Option A for her login;
- the coaching app (KI113);
- /admin and /cms protection;
- go or no-go on Friday;
- the switch steps on the box;
- the clean-up deletes, per item.
