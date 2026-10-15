# Section E re-walk, 2026-10-15 (after ca578f8)

| id | verdict | severity | actual | submit UTC | evidence |
|---|---|---|---|---|---|
| E-04 | PASS | none | "Thank you, you’re registered." then "You chose to watch on Friday 16 October 2026 at 10:00. We have emailed you the link, and it works whenever you are ready." POST /api/lead-magnet 200 | 09:37:52Z | docs/testing/results/browser/E-04b-success.png |
| E-07 | PASS | none | Eyebrow "Check Your Inbox"; heading "Your quiz link is on its way"; body "Your link to Is Your Intuition Helping You or Holding You Back? is on its way to johan+e07b@aiautomations.co.za. Check your inbox (and spam folder) to begin." POST /api/quiz/subscribe 200 | 09:38:37Z | docs/testing/results/browser/E-07b-success.png |

Console errors: none. Failed requests: none. Records: johan+e04b@aiautomations.co.za, johan+e07b@aiautomations.co.za. Mail read-back by controller.
