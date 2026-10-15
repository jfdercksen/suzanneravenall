# Section E acceptance, 2026-10-15

| id | verdict | severity | actual | submit UTC | evidence |
|---|---|---|---|---|---|
| E-01 | PASS | | "Message sent! Thank you. Suzanne's team will be in touch within 2 business days." POST /api/contact 200 | 09:06:04 | E-01-success.png |
| E-02 | PASS | | "Thank you, your request is in. We will email you as soon as The Breakthrough Trilogy is released." POST 200 | 09:07:00 | E-02-success.png |
| E-03 | PASS | | Went to /masterclass/watch, title "Watch the Free Masterclass \| Dr. Suzanne Ravenall \| Dr. Suzanne Ravenall". POST 200 | 09:07:50 | E-03-success.png |
| E-04 | FAIL | minor | "Thank you, you're registered. We have emailed you the link to watch the masterclass at the time you chose." Date/time not named. POST 200 | 09:08:43 | E-04-success.png |
| E-05 | PASS | | (a) "You're on the list. Watch your inbox for the next issue." (b) "You're on the list! We'll let you know as soon as assessments are available." Both POST 200 | a 09:09:30, b 09:10:25 | E-05a-success.png, E-05b-success.png |
| E-06 | PASS | | "You're on the list. We'll let you know as soon as the community launches." POST 200 | 09:11:13 | E-06-success.png |
| E-07 | PASS | | "CHECK YOUR INBOX ... link is on its way. We've sent it to johan+e07@aiautomations.co.za..." POST /api/quiz/subscribe 200 | 09:12:01 | E-07-success.png |
| E-08 | PASS | | Pass 2 (controller, Playwright): unsubscribe link from the E-02 welcome mail (Brevo click-tracking redirect 302 to /unsubscribe?token=...) opens "Unsubscribe from marketing emails" naming johan+e02@aiautomations.co.za; the Unsubscribe button shows "You have been unsubscribed"; POST /api/email/unsubscribe 200; no console errors | 09:14:32 | E-08-landing.png, E-08-confirmed.png |
| E-09 | PASS | | Palette 10 results + view all; Enter -> /search?q=pattern, "20 results found"; direct URL same 20 | | E-09-palette.png, E-09-search-enter.png, E-09-search-direct.png |

Findings: E-NEW-1 Cal.com embed (http port 3002) blocked, fallback shown (minor); E-NEW-2 quiz confirmation heading "Your Is Your Intuition Helping You or Holding You Back? link is on its way" (minor); E-NEW-3 homepage form is a pre-order notify, not a free chapter (info); E-NEW-4 verify Watch Later mail content; E-NEW-5 "list!" vs "list." wording.

Records: johan@, +e02, +e03, +e04, +e05a, +e05b, +e06, +e07 (all @aiautomations.co.za).


Mail evidence (controller, Outlook connector, all from hello@suzanneravenall.com, no attachments): E-01 "New contact message from Johan QA Test" To johan@aiautomations.co.za 09:06:14Z and "We received your message, Johan" 09:06:17Z (submit 09:06:04); E-02 "We will let you know when The Breakthrough Trilogy is released" To johan+e02 09:07:07Z; E-03 "You're on the list for the free masterclass" 09:07:56Z (watch whenever suits you); E-04 same subject 09:08:49Z, body "You chose to watch on Friday 16 October 2026 at 10:00"; E-05 "Welcome to the Monthly Insights Newsletter" 09:09:38Z and "You're on the list for the assessments" 09:10:34Z; E-06 "You're on the list for the community launch" 09:11:21Z; E-07 "Is Your Intuition Helping You or Holding You Back? - your diagnostic is ready" 09:12:11Z. Every mail within 15 s of its submit.
