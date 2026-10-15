# Preconditions - Suzanne Ravenall - 15 Oct 2026

Ticked lines carry the evidence. Server changes are applied by Johan; the walker only reads them back. READ sections (A, B, C, D, L, M, N) may run at any time. MAIL sections (E, F) need P1-P3. WRITE sections (G, H, I, J, K) need P1-P10.

| # | Precondition | Applies to | Evidence | Done |
|---|---|---|---|---|
| P1 | Every notify / alert address on the box = our inbox: `CONTACT_NOTIFY_EMAIL`, `QUIZ_NOTIFY_EMAIL` (web), n8n alert recipients | E F K | Johan set both web vars to johan@aiautomations.co.za on 14 Oct (contact + 8 quiz notifications received). NOT read back today; n8n alert recipients unknown | PART |
| P2 | Mail sender works from the box | E F G H I J | order and quiz mails received 13-14 Oct | yes |
| P3 | Test inbox readable from the session | all MAIL/WRITE | johan@aiautomations.co.za via the EA's Outlook connector; plus-addresses land in the same inbox | yes |
| P4 | Payment gateways in sandbox | G | `PAYFAST_SANDBOX`, `PAYPAL_SANDBOX` unset on the box = LIVE. Paid flows stay BLOCKED until Johan sets the flags + sandbox credentials | NO (Johan) |
| P5 | Free path: voucher QA-SELFTEST-100 (100%), `/api/checkout/free` | G H | ~25 orders 13-14 Oct | yes |
| P6 | Test persona: Johan QA Test, johan@aiautomations.co.za, phone and address as used on the contact form 14 Oct | all WRITE | | yes |
| P7 | Test login per role: portal account | I | none exists; signup is itself I-01, so I-01 runs first with johan+portal@ | pending (walk creates it) |
| P8 | Thinkific, Vtiger, Cal.com read-back | H J K | Thinkific API read works (enrolments read 14 Oct); Vtiger via scripts/vtiger.py; Cal.com account is Johan's | yes |
| P9 | Error tracker and logs reachable | all | Sentry code present; `docker compose logs web` on the box (Johan); GlitchTip not provisioned | PART |
| P10 | Cleanup plan | all WRITE | orders: `purchase-harness.mjs --cleanup` cancels + removes enrolments; Vtiger rows listed only; portal account deleted by Johan in Supabase; Cal bookings cancelled from the mail | yes |
| P11 | Box load: single worker | G | one order per 30 s; a 502 at 23 s intervals on 14 Oct | yes (pace) |
| P12 | Playwright MCP in `.mcp.json` (added 15 Oct), approved in the project session | all | loaded without a prompt in the 15 Oct project session; section D and orders #242, #243 walked with it | yes |
