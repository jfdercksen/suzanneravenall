# KI097 Self Study course and D023 intake for first-time clients (2026-10-23)

Commit 3cbbf71 on feature/design-standard, deploy run 39937216708 (web and medusa, 10:10-10:24Z, success).
Persona: Johan QA Test, johan+...@aiautomations.co.za plus-addresses. Voucher QA-SELFTEST-100.

## Item 1: Self Study enrolment (KI097)

| step | verdict | evidence |
|---|---|---|
| Checkout smoke after the medusa restart | PASS | #438 placed through the browser checkout, R0,00; browser/KI097-selfstudy-confirmation.png. The first cart load after the restart took about 30 s, then normal |
| Enrolment within a minute | PASS | order 10:28:48Z, thinkific_enrolment done on attempt 1 at 10:28:51Z, new Thinkific user, course 3555807 enrolled |
| Draft check | PASS | job state `visibility: "draft"`; medusa log `[staff-alert] Course not published in Thinkific - order #438`, naming course 3555807 |
| Order mail | PASS | Outlook 10:28:55Z "Your transformation begins - Order #438" (invoice attached); 10:28:56Z "Your course access is ready - Resonance Repatterning Accelerated Basic 5 Review (Self Study)"; Thinkific welcome mail 10:28:57Z |
| Course visible on the dashboard | WAITS | course 3555807 is still a draft in Thinkific; visible once published (Thinkific admin, Johan or Shayna) |
| Shayna's order #433 | NO ACTION NEEDED | enrolment 894348051 in 3555807 exists since 08:10:55Z; shows once the course is published |

## Item 2: intake mail for first-time clients only (D023)

| case | verdict | evidence |
|---|---|---|
| 1. First session order, johan+intake1a@ (#439, Rapid Repatterning 60 min online) | PASS | intake row 439 pending, mailed, next reminder 24 Oct 10:30Z; Outlook 10:30:16Z "Please complete your intake form for Rapid Repatterning Session" |
| 2. Second session order, same address typed as Johan+Intake1A@ (#440, Resonance Package of 04, another service) | PASS | no intake row, no intake mail (Outlook: only "Order #440"); web log `[intake] order #440: no intake mail, returning client (earlier session order #439)`, no address in the log |
| Medusa earlier-order search does not flag a stranger | PASS | #441 for johan+intake1c@ (first time) got its intake row and mail, so the `$ilike` order search on the box answers by address |
| 3. Another address with a completed intake and no live order | PASS | #441's form marked completed in the database with Johan's ok (submitting it through the page would have sent the team copy to support@ravenallinstitute.com, a client mailbox); #441 then cancelled, so no live order. New order #442 for johan+intake1c@: no intake row, Outlook shows only "Order #442"; web log `[intake] order #442: no intake mail, returning client (completed intake form for order #441)` |
| Reminder skip (Shayna's open forms) | PASS | read 11:03Z after the 11:00Z hourly run: #431 and #434 pending with next_reminder_at cleared and reminders_sent 0 (the #431 reminder due 10:05Z never went); she had completed #430 and #435. Web log: `order #431: no intake mail or reminder, returning client (completed intake form for order #430)`; the sweep logged #432-#435 as returning |

Cleanup: #438-#442 read back (display id, email, R0) and cancelled by exact id. Left for Johan if wanted: Thinkific user for johan+selfstudy1023@ (enrolled in 3555807), Vtiger contact 12x687.
