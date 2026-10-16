# Acceptance J - Bookings - 2026-10-16

| id | verdict | severity | actual (short) | evidence |
|---|---|---|---|---|
| J-01 | PASS | - | Inline Cal.com iframe on /contact plus button to :3002 discovery-call. Booked Mon 19 Oct 2026 10:00-10:30 SAST, uid 2q9CTgaKy5WcdoTpkSpCpA, submitted 02:53:22Z. No phone field. Mails confirmed. | browser/J-01-contact.png, J-01-booked.png |
| J-02 | N/A (controller) | - | Link opens generic "Discovery Call", 30m, not a session event. Not booked. | page-2026-10-16T02-54-40-827Z.yml |
| J-03 | PASS | - | Rescheduled to Tue 20 Oct 2026 11:00-11:30 SAST, reason field present, uid changed to 7ZRqv4YY1VvCL31Rgi78xR, submitted 02:54:56Z. Mails confirmed. | browser/J-03-rescheduled.png |
| J-04 | PASS | - | Cancel with reason "QA walk, please ignore" -> "This event is canceled", Reason, Cancelled By johan@aiautomations.co.za, Tuesday, October 20, 2026 11:00 - 11:30 (South Africa Standard Time). Submitted 02:56:05Z. | browser/J-04-cancelled.png |
| J-06 | PASS | - | Organiser Dr Suzanne Ravenall; Mon-Fri open, today offered; host email equals attendee. | browser/J-06-bookingpage.png |

Findings: J-NEW-1 host email equals attendee (minor); J-NEW-2 no phone field (minor); J-NEW-3 3 console warnings per page, contact screenshot did not show calendar rendered (minor); J-NEW-4 tab title still "Your booking has been confirmed" after cancelling (minor).

Records: 2q9CTgaKy5WcdoTpkSpCpA (rescheduled away), 7ZRqv4YY1VvCL31Rgi78xR (cancelled).
