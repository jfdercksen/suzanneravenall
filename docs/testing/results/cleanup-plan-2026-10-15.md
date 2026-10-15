# Cleanup plan, /acceptance section G orders, 15 Oct 2026

Read-only inventory taken at the end of the walk from the review Medusa (admin API) and Thinkific (public API) for the QA buyer johan@aiautomations.co.za. Nothing has been changed. Johan ticks per item or per group; the harness runs only the ticked Medusa and Thinkific parts. Vtiger rows are listed, never touched by the script (PRECONDITIONS P10).

## Group 1: Medusa orders to cancel (144, all status pending, free through QA-SELFTEST-100)

Cancelling keeps the order record with status cancelled; nothing is deleted. The order mails already sent are unaffected.

| ok | Order | Item | Created (UTC) |
|---|---|---|---|
| [x] | #244 | Rapid Repatterning Session / 90 min online | 09:31:56 |
| [x] | #245 | Rapid Repatterning Session / 90 min in-person | 09:33:32 |
| [x] | #246 | Rapid Repatterning Session / Package of 04 (60 min online) | 09:34:56 |
| [x] | #247 | Rapid Repatterning Session / Package of 08 (60 min online) | 09:37:30 |
| [x] | #248 | Rapid Repatterning Session / Package of 12 (60 min online) | 09:39:06 |
| [x] | #249 | Rapid Repatterning Session / Package of 16 (60 min online) | 09:40:35 |
| [x] | #250 | Rapid Repatterning Session / Package of 04 (90 min online) | 09:51:42 |
| [x] | #251 | Rapid Repatterning Session / Package of 08 (90 min online) | 09:52:52 |
| [x] | #252 | Rapid Repatterning Session / Package of 12 (90 min online) | 09:54:01 |
| [x] | #253 | Rapid Repatterning Session / Package of 16 (90 min online) | 09:55:10 |
| [x] | #254 | Rapid Repatterning Session / 60 min in-person | 09:56:15 |
| [x] | #255 | Rapid Repatterning Session / 60 min online | 09:57:29 |
| [x] | #256 | Resonance Repatterning / Coaching Session / 60 min online | 09:59:25 |
| [x] | #257 | Resonance Repatterning / Coaching Session / 90 min online | 10:00:43 |
| [x] | #258 | Resonance Repatterning / Coaching Session / Package of 04 (60 min) | 10:01:57 |
| [x] | #259 | Resonance Repatterning / Coaching Session / Package of 08 (60 min) | 10:03:16 |
| [x] | #260 | Resonance Repatterning / Coaching Session / Package of 12 (60 min) | 10:04:33 |
| [x] | #261 | Resonance Repatterning / Coaching Session / Package of 16 (60 min) | 10:05:58 |
| [x] | #262 | Resonance Repatterning / Coaching Session / Package of 04 (90 min) | 10:09:47 |
| [x] | #263 | Resonance Repatterning / Coaching Session / Package of 08 (90 min) | 10:11:25 |
| [x] | #264 | Resonance Repatterning / Coaching Session / Package of 16 (90 min) | 10:12:39 |
| [x] | #265 | Resonance Repatterning / Coaching Session / Package of 12 (90 min) | 10:13:53 |
| [x] | #266 | Transformation Coaching Session / 60 min | 10:15:15 |
| [x] | #267 | Transformation Coaching Session / 90 min | 10:16:31 |
| [x] | #268 | Transformation Coaching Session / Package of 04 | 10:18:13 |
| [x] | #269 | Transformation Coaching Session / Package of 08 | 10:19:39 |
| [x] | #270 | Transformation Coaching Session / Package of 12 | 10:20:52 |
| [x] | #271 | Transformation Coaching Session / Package of 16 | 10:22:22 |
| [x] | #272 | Executive Coaching Session / 30 min | 10:23:45 |
| [x] | #273 | Executive Coaching Session / 60 min | 10:24:55 |
| [x] | #274 | Executive Coaching Session / Package of 04 | 10:26:40 |
| [x] | #275 | Executive Coaching Session / Package of 08 | 10:27:58 |
| [x] | #276 | Executive Coaching Session / Package of 12 | 10:29:06 |
| [x] | #277 | Executive Coaching Session / Package of 16 | 10:30:39 |
| [x] | #278 | Akashic Coaching / Clearing Session / 60 min | 10:32:00 |
| [x] | #279 | Akashic Coaching / Clearing Session / 90 min | 10:33:34 |
| [x] | #280 | Akashic Coaching / Clearing Session / Package of 04 | 10:35:24 |
| [x] | #281 | Akashic Coaching / Clearing Session / Package of 08 | 10:36:34 |
| [x] | #282 | Akashic Coaching / Clearing Session / Package of 12 | 10:37:49 |
| [x] | #283 | Group Family Coaching / Single session | 10:39:07 |
| [x] | #284 | Group Family Coaching / Package of 04 | 10:40:20 |
| [x] | #285 | Group Family Coaching / Package of 08 | 10:42:03 |
| [x] | #286 | Exploring the Alpha Mind / Package of 05 | 10:44:07 |
| [x] | #287 | Exploring the Alpha Mind / Package of 08 | 10:45:34 |
| [x] | #288 | Rapid Transformation Therapy Session / 1 hypnosis session + recording | 10:46:51 |
| [x] | #289 | Rapid Transformation Therapy Session / 1 hypnosis session + recording + 2 coaching sessions | 10:48:05 |
| [x] | #290 | Energetic Clearing / Single session | 10:49:28 |
| [x] | #291 | Energetic Clearing / Package of 04 | 10:50:49 |
| [x] | #292 | Energetic Clearing / Package of 08 | 10:54:04 |
| [x] | #293 | Energetic Clearing / Package of 12 | 10:55:31 |
| [x] | #294 | Resonance Repatterning Program 1: Fundamentals / Live via Zoom | 10:57:04 |
| [x] | #295 | Resonance Repatterning Program 1: Fundamentals / Self Study | 10:58:39 |
| [x] | #296 | Resonance Repatterning Program 1: Fundamentals / Live Retaker | 11:00:10 |
| [x] | #297 | Resonance Repatterning Program 2: Primary Patterns / Self Study | 11:02:38 |
| [x] | #298 | Resonance Repatterning Program 2: Primary Patterns / Live Retaker | 11:05:54 |
| [x] | #299 | Resonance Repatterning Program 2: Primary Patterns / Live via Zoom | 11:07:46 |
| [x] | #300 | Resonance Repatterning Program 3: Unconscious Patterns / Live via Zoom | 11:09:51 |
| [x] | #301 | Resonance Repatterning Program 3: Unconscious Patterns / Live Retaker | 11:11:10 |
| [x] | #302 | Resonance Repatterning Program 4: Chakra Patterns / Self Study | 11:12:52 |
| [x] | #303 | Resonance Repatterning Program 4: Chakra Patterns / Live via Zoom | 11:14:25 |
| [x] | #304 | Resonance Repatterning Program 4: Chakra Patterns / Live Retaker | 11:16:14 |
| [x] | #305 | Resonance Repatterning Program 5: Five Elements & Meridians / Live via Zoom | 11:18:04 |
| [x] | #306 | Resonance Repatterning Program 5: Five Elements & Meridians / Self Study | 11:19:37 |
| [x] | #307 | Resonance Repatterning Program 5: Five Elements & Meridians / Live Retaker | 11:21:13 |
| [x] | #308 | Resonance Repatterning Full Basic Series Programs 1–5 / Live via Zoom | 11:22:47 |
| [x] | #309 | Resonance Repatterning Accelerated Basic 5 Review / Self Study | 11:24:30 |
| [x] | #310 | Resonance Repatterning Accelerated Basic 5 Review / Live via Zoom | 11:27:13 |
| [x] | #311 | Akashic Navigator Level 1: Fundamentals / Self Study | 11:28:47 |
| [x] | #312 | Akashic Navigator Level 1: Fundamentals / Live Retaker | 11:29:56 |
| [x] | #313 | Akashic Navigator Level 1: Fundamentals / Live via Zoom | 11:31:06 |
| [x] | #314 | Akashic Navigator Level 2: Advanced / Self Study | 11:32:16 |
| [x] | #315 | Akashic Navigator Level 2: Advanced / Live Retaker | 11:35:12 |
| [x] | #316 | Akashic Navigator Level 2: Advanced / Live via Zoom | 11:37:12 |
| [x] | #317 | Akashic Navigator Level 1 & 2: Purchased Together / Self Study | 11:38:26 |
| [x] | #318 | Akashic Navigator Level 1 & 2: Purchased Together / Live Retaker | 11:40:54 |
| [x] | #319 | Akashic Navigator Level 1 & 2: Purchased Together / Live via Zoom | 11:42:42 |
| [x] | #320 | Deep Energy Clearing Level 1: Fundamentals / Live via Zoom | 11:45:22 |
| [x] | #321 | Deep Energy Clearing Level 1: Fundamentals / Self Study | 11:47:06 |
| [x] | #322 | Deep Energy Clearing Level 1: Fundamentals / Live Retaker | 11:50:01 |
| [x] | #323 | Deep Energy Clearing Level 2: Advanced / Self Study | 11:52:19 |
| [x] | #324 | Deep Energy Clearing Level 2: Advanced / Live Retaker | 11:53:55 |
| [x] | #325 | Deep Energy Clearing Level 2: Advanced / Live via Zoom | 11:56:18 |
| [x] | #326 | Be an Energy Ninja Level 1 / Live via Zoom | 11:57:57 |
| [x] | #327 | Be an Energy Ninja Level 1 / Self Study | 11:59:54 |
| [x] | #328 | Trauma to Transcendence / Live via Zoom | 12:01:52 |
| [x] | #329 | Trauma to Transcendence / Self Study | 12:03:30 |
| [x] | #330 | Finding My Life Purpose / Self Study | 12:05:20 |
| [x] | #331 | Finding My Life Purpose / Live via Zoom | 12:07:08 |
| [x] | #332 | Love & Relationships / Live via Zoom | 12:08:50 |
| [x] | #333 | Love & Relationships / Self Study | 12:10:11 |
| [x] | #334 | Intuition (Personal & Business Capacity) / Business Capacity: Live via Zoom | 12:12:10 |
| [x] | #335 | Intuition (Personal & Business Capacity) / Business Capacity: Self Study | 12:13:53 |
| [x] | #336 | Intuition (Personal & Business Capacity) / Personal Capacity: Live via Zoom | 12:15:25 |
| [x] | #337 | Intuition (Personal & Business Capacity) / Personal Capacity: Self Study | 12:16:46 |
| [x] | #338 | Meditation / Live via Zoom | 12:17:59 |
| [x] | #339 | Meditation / Self Study | 12:19:16 |
| [x] | #340 | Mindfulness / Self Study | 12:21:35 |
| [x] | #341 | Mindfulness / Live via Zoom | 12:23:47 |
| [x] | #342 | Group Session: Being a Great Boundary Setter / Live (booked as series) | 12:25:59 |
| [x] | #343 | Group Session: Being a Great Boundary Setter / Recorded series | 12:27:53 |
| [x] | #344 | Group Session: Career Progression / Live (booked as series) | 12:29:47 |
| [x] | #345 | Group Session: Career Progression / Recorded series | 12:31:48 |
| [x] | #346 | Group Session: Develop Super Confidence / Live | 12:34:52 |
| [x] | #347 | Group Session: Love & Relationships / Recorded series | 12:36:27 |
| [x] | #348 | Group Session: Love & Relationships / Live (booked as series) | 12:37:59 |
| [x] | #349 | Group Session: Money Mastery / Recorded series | 12:39:40 |
| [x] | #350 | Group Session: Money Mastery / Live (booked as series) | 12:41:23 |
| [x] | #351 | Group Session: Shedding Excess Weight / Live (booked as series) | 12:43:35 |
| [x] | #352 | Group Session: Shedding Excess Weight / Recorded series | 12:44:55 |
| [x] | #353 | Resonance Repatterning Program 7: Principles of Relationships / Self Study | 12:46:08 |
| [x] | #354 | Resonance Repatterning Program 7: Principles of Relationships / Live via Zoom | 12:47:19 |
| [x] | #355 | Resonance Repatterning Program 9: Energetics of Relationships / Live via Zoom | 12:48:33 |
| [x] | #356 | Resonance Repatterning Program 9: Energetics of Relationships / Self Study | 12:49:52 |
| [x] | #357 | Be an Energy Ninja Level 2 / Live via Zoom | 12:51:40 |
| [x] | #358 | Group Session: Nice or Not Nice in Communication / Live (booked as series) | 12:53:21 |
| [x] | #359 | Group Session: Nice or Not Nice in Communication / Recorded series | 12:54:40 |
| [x] | #360 | Coherence Muscle Testing / Self Study | 12:55:44 |
| [x] | #361 | Resonance Repatterning: All Demos & Talk Throughs / Self Study | 12:56:51 |
| [x] | #362 | Post Traumatic Growth / Self Study | 14:30:42 |
| [x] | #363 | Breakthrough Trilogy / Pre-order | 14:31:56 |
| [x] | #364 | Quantum Healing Codes / eBook & Audio Download | 14:33:18 |
| [x] | #365 | Bringing Your Energy Back / Default | 14:34:40 |
| [x] | #366 | Energetic Alignment & Inner Neutrality / Default | 14:36:00 |
| [x] | #367 | Relaxation & Energy Reclamation / Default | 14:37:13 |
| [x] | #368 | Getting Unstuck (Self Study) / Default | 14:39:01 |
| [x] | #369 | Resonance Repatterning Full Basic Training, Programs 1-5 + Demos + Resources (Self Study) / Standard | 14:40:15 |
| [x] | #370 | Resonance Repatterning Full Basic Training, Programs 1-5 + Demos + Resources (Live via Zoom) / Standard | 14:41:30 |
| [x] | #371 | Resonance Repatterning Program 6: Inner Cultivation / Self Study | 14:42:41 |
| [x] | #372 | Resonance Repatterning Program 6: Inner Cultivation / Live via Zoom | 14:43:50 |
| [x] | #373 | Deep Energy Clearing Level 1 & 2: Purchased Together / Live via Zoom | 14:45:19 |
| [x] | #374 | Deep Energy Clearing Level 1 & 2: Purchased Together / Live Retaker | 14:47:11 |
| [x] | #375 | Deep Energy Clearing Level 1 & 2: Purchased Together / Self Study | 14:48:40 |
| [x] | #376 | Practitioner Mentorship / Single Session (Live) | 14:49:55 |
| [x] | #377 | Practitioner Mentorship / Single Session (Self Study) | 14:51:07 |
| [x] | #378 | Practitioner Mentorship / Bundle of 5 Sessions (Live) | 14:52:20 |
| [x] | #379 | Practitioner Mentorship / Bundle of 5 Sessions (Self Study) | 14:53:27 |
| [x] | #380 | Email Support / Per month | 14:55:04 |
| [x] | #381 | Coaching Support Package / Per session | 14:56:20 |
| [x] | #382 | VIP Package / Per month | 14:57:32 |
| [x] | #383 | Bonus Lifetime Access / Per programme level | 14:58:50 |
| [x] | #384 | Ravenall Institute Certification Observation Fee / Once-off | 14:59:59 |
| [x] | #385 | Akashic Navigator Level 1 & 2: Purchased Together / Live Retaker | 15:57:23 |
| [x] | #386 | Deep Energy Clearing Level 2: Advanced / Live via Zoom | 15:58:11 |
| [x] | #387 | Energetic Clearing / Package of 08 | 15:58:56 |

## Group 2: Thinkific enrolments created on 15 Oct to delete (37)

Only the enrolment rows are deleted; the Thinkific user 260204563 (johan@aiautomations.co.za) is kept, so the 15 enrolments from 13-14 Oct listed in group 3 survive. Thinkific does not create a second enrolment for a course the user already has, which is why 69 course-access mails today map to 37 new enrolments.

| ok | Enrolment id | Course | Created (UTC) |
|---|---|---|---|
| [x] | 891324696 | Resonance Repatterning Accelerated Basic 5 Training Series: Review of Programs 1-5 (Live via zoom) | 11:27:15 |
| [x] | 891325005 | Akashic Navigator & Intuitive Coaching Fundamentals: Clearing Self, Level 1 (Live via Zoom) | 11:29:58 |
| [x] | 891325630 | New Akashic Navigator & Intuitive Coaching Advanced: Clearing Others, Level 2 (Self Study) | 11:32:19 |
| [x] | 891325952 | Akashic Navigator & Intuitive Coaching Advanced: Clearing Others, Level 2 (Live via Zoom) | 11:35:14 |
| [x] | 891327729 | Deep Energy Clearing Fundamentals: Clearing Self, Level 1 (Live via Zoom) | 11:45:27 |
| [x] | 891329126 | Deep Energy Clearing Advanced: Clearing Others, Level 2 (Live via Zoom) | 11:53:58 |
| [x] | 891329475 | Be an Energy Ninja: Mastering energy for an abundant life - Repattern your life Level 1 (Live Zoom) | 11:58:00 |
| [x] | 891329647 | Be an Energy Ninja: Mastering energy for an abundant life - Repattern your life Level 1 (Self Study) | 11:59:57 |
| [x] | 891330428 | Trauma to Transcendence: Breaking the hold of the Childhood brain on your adult self (Live via Zoom) | 12:01:56 |
| [x] | 891330593 | New: Trauma to Transcendence: Breaking the hold of the Childhood brain on your adult self (Self Study) | 12:03:34 |
| [x] | 891330855 | Finding My Life Purpose (Self Study) | 12:05:22 |
| [x] | 891331088 | Finding My Life Purpose (Live via Zoom) | 12:07:10 |
| [x] | 891331324 | Love & Relationships (Live via Zoom) | 12:08:53 |
| [x] | 891331901 | Love & Relationships (Self Study) | 12:10:15 |
| [x] | 891332546 | Intuition in My Business Capacity (Live via Zoom) | 12:12:12 |
| [x] | 891332731 | Intuition in My Business Capacity (Self Study) | 12:13:56 |
| [x] | 891332983 | Intuition in My Personal Capacity (Live via Zoom) | 12:15:28 |
| [x] | 891333245 | Intuition in My Personal Capacity (Self Study) | 12:16:48 |
| [x] | 891333320 | Meditation (Live via Zoom) | 12:18:01 |
| [x] | 891333708 | Meditation (Self Study) | 12:19:18 |
| [x] | 891333967 | Mindfulness (Self Study) | 12:21:37 |
| [x] | 891334421 | Mindfulness (Live via Zoom) | 12:23:51 |
| [x] | 891335228 | Group Session Being a Great Boundary Setter (available as a recorded series) | 12:27:55 |
| [x] | 891336606 | Resonance Repatterning Group session series : Love & Relationships | 12:36:29 |
| [x] | 891337621 | Resonance Repatterning Recorded Group Session Series : Money Mastery | 12:39:42 |
| [x] | 891339308 | Resonance Repatterning Recorded Group Session Series : Shedding Excess Weight | 12:44:57 |
| [x] | 891339456 | Resonance Repatterning Program 7 Principles of Relationships Practical + Demos (Self Study) | 12:46:10 |
| [x] | 891339599 | Resonance Repatterning Program 7 Principles of Relationships Practical + Demos (Live via Zoom) | 12:47:20 |
| [x] | 891339964 | Resonance Repatterning Program 9 Energetics of Relationships Practical + Demos (Live via Zoom) | 12:48:34 |
| [x] | 891340172 | Resonance Repatterning Program 9 Energetics of Relationships Practical + Demos (Self Study) | 12:49:56 |
| [x] | 891340320 | Be an Energy Ninja: Mastering energy for an abundant life - Repattern your life Level 2 (Live Zoom) | 12:51:41 |
| [x] | 891340813 | Resonance Repatterning Recorded Group Session Series : Nice or Not Nice Communication | 12:54:42 |
| [x] | 891341145 | Coherence Muscle Testing (Self Study Online) | 12:55:46 |
| [x] | 891366321 | Post Traumatic Growth Presentation | 14:30:44 |
| [x] | 891368494 | Getting Unstuck (Self Study) | 14:39:07 |
| [x] | 891369432 | Resonance Repatterning Program 6 Inner Cultivation Practical + Demos (Self Study) | 14:42:43 |
| [x] | 891370185 | Resonance Repatterning Program 6 Inner Cultivation Practical + Demos (Live via Zoom) | 14:43:52 |

## Group 3: earlier enrolments on the same Thinkific user (15, NOT in this cleanup, shown so they are not lost)

| Enrolment id | Course | Created |
|---|---|---|
| 890294805 | Resonance Repatterning Recorded Group Session Series - Career progression | 2026-10-13 12:23 |
| 890386136 | New Akashic Navigator & Intuitive Coaching Fundamentals: Clearing Self, Level 1 (Self Study) | 2026-10-13 15:45 |
| 890416021 | New Deep Energy Clearing Fundamentals: Clearing Self, Level 1 (Self Study) | 2026-10-13 16:09 |
| 890416039 | New Deep Energy Clearing Advanced: Clearing Others, Level 2 (Self Study) | 2026-10-13 16:09 |
| 890435698 | Resonance Repatterning Program 1 Fundamentals (Self Study) | 2026-10-13 16:13 |
| 890435700 | Resonance Repatterning Program 2 Primary Patterns (Self Study) | 2026-10-13 16:13 |
| 890435701 | Resonance Repatterning Program 3 Unconscious Patterns (Self Study) | 2026-10-13 16:13 |
| 890435704 | Resonance Repatterning Program 4 Chakra Patterns (Self Study) | 2026-10-13 16:13 |
| 890435707 | Resonance Repatterning Program 5 Five Elements & Meridians (Self Study) | 2026-10-13 16:13 |
| 890694462 | Resonance Repatterning Program 1 Fundamentals (Live via Zoom) | 2026-10-14 09:40 |
| 890728005 | Resonance Repatterning All Repatternings as Demo's / Talk Throughs + Resources (Self Study) | 2026-10-14 12:32 |
| 890728072 | Resonance Repatterning Program 2 Primary Patterns (Live via Zoom) | 2026-10-14 12:32 |
| 890728074 | Resonance Repatterning Program 3 Unconscious Patterns (Live via Zoom) | 2026-10-14 12:32 |
| 890728075 | Resonance Repatterning Program 4 Chakra Patterns (Live via Zoom) | 2026-10-14 12:32 |
| 890728076 | Resonance Repatterning Program 5 Five Elements & Meridians (Live via Zoom) | 2026-10-14 12:32 |

## Group 4: Vtiger (listed only)

The order-to-vtiger automation ran per order, so the contact johan@aiautomations.co.za on ai.aimate.co.za carries up to 144 activities dated 15 Oct (one per order) plus the 9 lead activities from section E. The script never touches Vtiger; Johan removes or keeps them in the CRM.

## Not in scope

- The voucher QA-SELFTEST-100 stays until the acceptance walk is finished (sections H, I, J still use it).
- Orders #221-#243 from 13-15 Oct (earlier harness and pilot runs) are not in this list; say so if they should be.
- The 9 lead rows and the unsubscribe row from section E stay (marked QA by name).

## How it runs once ticked

`node infra/scripts/qa/purchase-harness.mjs --cleanup --yes --from=docs/testing/results/cleanup-run-2026-10-15.json`. The run file holds only the ticked order ids and enrolment ids and no `thinkific_user_id`, so the harness cancels the orders and deletes the enrolments and skips the user delete. The file is generated from this plan after Johan ticks it.


## Outcome, 15 Oct 2026 (Johan approved both groups; Vtiger he handles himself)

- Medusa: 144 of 144 orders #244-#387 cancelled through the admin API by `purchase-harness.mjs --cleanup --yes --from=cleanup-run-2026-10-15.json` (report `cleanup-report-2026-10-15.txt`); read back afterwards: all 144 status cancelled.
- Thinkific: the harness DELETE /enrollments/{id} returned 404 for all 37 (the public API v1 has no enrolment delete, so the harness unenrol step never worked). The 37 enrolments were instead expired with PUT /enrollments/{id} {expiry_date: now} and each read back as expired (`cleanup-thinkific-expiry-2026-10-15.json`): access removed, the rows remain visible in Thinkific as expired. The Thinkific user 260204563 and the 15 earlier enrolments were not touched.
- Vtiger: untouched. Voucher: untouched.
