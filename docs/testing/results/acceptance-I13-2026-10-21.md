# Acceptance I-13 "My appointments" - 2026-10-21

Site: http://169.239.180.49. Persona: Johan QA Test, johan+appt1021@aiautomations.co.za. Screenshots in docs/testing/results/browser/.

| Step | Verdict | Severity | Actual | Evidence |
|---|---|---|---|---|
| P1 Signup | PASS | - | "Check your email" shown, submitted 07:44:06Z, 0 console errors | I-13-01-signup.png |
| P2.1 Confirm link | PASS | - | Landed signed in on /portal/dashboard | I-13-02-confirmed.png |
| P2.2 Dashboard empty Next Appointment | PASS | - | "No session booked yet..." with My appointments link to /portal/appointments | I-13-03-dashboard-empty.png |
| P2.3 /portal/appointments empty | PASS | - | H1 and 3 sections with the expected empty texts, 0 console errors | I-13-04-appointments-empty.png |
| P2.4 Buy (Package of 04, 60 min, voucher QA-SELFTEST-100, R0) | PASS | - | Order #414 at 07:53:09Z, total R0,00 | I-13-05-confirmation.png |
| P2.5 To book 4 of 4 | PASS | - | "Rapid Repatterning Session / 60 min sessions / 4 of 4 left to book / Book Now" | I-13-06-to-book-4of4.png |
| P3.1 Book on Cal.com | PASS | - | Fri 23 Oct 09:00-10:00 SAST, uid mKAzhMcHzSgrf3EGtMdBxR, confirmed 07:56:05Z | I-13-07-booked.png |
| P3.2 Upcoming 1 and 3 of 4 | FAIL | blocker | After ~150 s still 0 upcoming and 4 of 4. Root cause: DB API had not loaded the new table, so the webhook write was refused; fixed 08:03:28Z (schema reload). That booking was lost (Cal.com does not resend). | I-13-08-upcoming-3of4.png (shows the failing state) |
| P3.3 Dashboard Next Appointment | FAIL | blocker | Still "No session booked yet" (same root cause) | I-13-09-dashboard-next.png |
| P4A Reschedule to Mon 26 Oct 10:00 | PASS | - | New uid fejMWmTkkZXfKjwCbNzRg3. Done via http://169.239.180.49:3002/reschedule/mKAzhMcHzSgrf3EGtMdBxR because the Brevo tracking host was blocked in the test browser (ERR_BLOCKED_BY_CLIENT); the mail link itself was not tested. | I-13-10-rescheduled.png |
| P4A portal after reschedule | PASS | - | 1 Upcoming: Mon 26 October 2026, badge Rescheduled, 10:00-11:00 SAST (60 min), Rapid Repatterning Session, Join (zoom.us/j/3603768111), Reschedule, Cancel; "3 of 4 left to book". Reschedule href http://169.239.180.49:3002/reschedule/fejMWmTkkZXfKjwCbNzRg3?rescheduledBy=johan%2Bappt1021%40aiautomations.co.za ; Cancel href http://169.239.180.49:3002/booking/fejMWmTkkZXfKjwCbNzRg3?cancel=true&allRemainingBookings=false&cancelledBy=johan%2Bappt1021%40aiautomations.co.za | I-13-11-after-reschedule.png |
| P4A Dashboard | PASS (minor) | minor | "Mon, 26 October 2026 / 10:00 - 11:00 SAST / Session (60 min)". Service name here is the Cal.com title, not "Rapid Repatterning Session" as on the appointments page. | I-13-12-dashboard-next.png |
| P4B Cancel from portal | PASS | - | Cancel opens Cal.com in a NEW tab; reason "QA test"; "This event is canceled" | I-13-13-cancelled-calcom.png |
| P4B After cancel | PASS (minor) | minor | 0 Upcoming, "4 of 4 left to book", Past shows Mon 26 October, Cancelled, 10:00-11:00 SAST (60 min), no links. Its title reads "Session (60 min)" rather than "Rapid Repatterning Session". | I-13-14-after-cancel.png |
| P4C Book again from portal | PASS | - | Book Now opens Cal.com in a new tab; booked Fri 23 Oct 09:00 SAST, uid gUKkXFdkDtyvq4Ya5PrYsz at 08:08:06Z. Portal: 1 Upcoming (Booked), "3 of 4 left to book", cancelled booking still under Past. Reschedule http://169.239.180.49:3002/reschedule/gUKkXFdkDtyvq4Ya5PrYsz?rescheduledBy=johan%2Bappt1021%40aiautomations.co.za ; Cancel http://169.239.180.49:3002/booking/gUKkXFdkDtyvq4Ya5PrYsz?cancel=true&allRemainingBookings=false&cancelledBy=johan%2Bappt1021%40aiautomations.co.za | I-13-15-booked-from-portal.png |
| P4D Phone 375x812 | FAIL (minor) | minor | No horizontal overflow (scrollWidth 375 = clientWidth 375). Tab bar has 7 items incl. Sessions, each 52 px wide, but "Programmes" overflows its cell and touches "Dashboard" ("DashboardProgrammes"). | I-13-16-phone.png, I-13-16b-phone-tabbar.png |

## New findings
- NEW-1 minor: WebCrypto warning on http, PKCE falls back to plain (review box only).
- NEW-2 minor: cookie banner is covered by the main wrapper and hard to click until the animation settles.
- NEW-3 blocker (possibly review-box specific): a hard load of /shop/rapid-repatterning-session or /checkout hangs on "Loading..." with no console error and no Medusa call. In-app navigation works.
- NEW-5 minor: Book links use plain http on port 3002.
- NEW-6 minor: Cal.com does not prefill the phone number and defaults to +1; the user must type +27.
- NEW-7 minor: service name differs between the dashboard card / Past list ("Session (60 min)") and the Upcoming list ("Rapid Repatterning Session").
- NEW-8 minor: phone tab bar label "Programmes" collides with "Dashboard".
- NEW-9 minor: on the phone the floating Brilliant Coach pill overlaps page content above the tab bar.
- Cal.com cancel page tab title still reads "Your booking has been confirmed".

## Records to clean up
Account johan+appt1021@aiautomations.co.za; order #414; Cal.com bookings: mKAzhMcHzSgrf3EGtMdBxR (rescheduled, now fejMWmTkkZXfKjwCbNzRg3, cancelled); gUKkXFdkDtyvq4Ya5PrYsz (Fri 23 Oct 09:00 SAST, left in place).

## After the walk (orchestrating session)
- P3 root cause: PostgREST schema cache did not include session_bookings (reloaded 07:16:55Z, table created after). PostgREST 12 sends reads straight to SQL but answers 404 {} to writes on a table it has not cached. NOTIFY pgrst, 'reload schema' at 08:03:28Z, migration amended (879a6fc).
- NEW-7 and NEW-8 fixed in the follow-up commit: a booking that used no credit is named by the service bought for its length (Past, dashboard); the phone label for My Programmes is "Courses" so seven 52 px tabs fit. Re-check after the next web deploy.
- NEW-3 filed as KI092 (shop/checkout hard-load hang), not in the appointments code.
- DB read-back 08:12Z: fejMWmTkkZXfKjwCbNzRg3 (rescheduled_from mKAzhMcHzSgrf3EGtMdBxR) cancelled, gUKkXFdkDtyvq4Ya5PrYsz cancelled; both session-60, start times correct in SAST.
- Cleanup: order #414 cancelled through the admin API (200, now canceled, payment not_paid, total 0), booking gUKkXFdkDtyvq4Ya5PrYsz cancelled from the portal Cancel link (Cal.com "This event is canceled", Cancelled By the persona). Left for Johan: delete the account johan+appt1021@aiautomations.co.za.
