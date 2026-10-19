# REFIX2 acceptance 2026-10-19 (final)

| id | verdict | severity | actual | evidence |
|---|---|---|---|---|
| G-043 | PASS | - | Order #391. Page: "Your confirmation email has the link to book your session..." Mail (controller): "Book Your Session Now"; What Happens Next "Your booking link is above. Schedule your session at your convenience." | browser/REFIX2-G-043-1.png; mail 14:49:47Z read by controller |
| KI083 | PASS | - | main=1, nested=0 on 404, /portal/login, /shop | browser/REFIX2-KI083-1.png |
| I-01 | PASS | - | Phone field present; confirm link -> dashboard; account phone +27 82 555 0199 | browser/REFIX2-I-01-1..3.png |
| CK-01 | PASS | - | Prefilled Johan / QA Test / plus address / +27 82 555 0199; no order; cart emptied | browser/REFIX2-CK-01-1.png |
| I-03 / KI084 | PASS | - | Reset link landed on /portal/reset-password with plain auth layout: no portal sidebar, no Sign Out, no Dashboard nav (only the global site header and Pattern Coach tab). Password updated ("Your new password is saved. Use it the next time you log in."). "Go to Your Dashboard" -> dashboard with sidebar (Dashboard, My Programmes, Resources, Videos, Account) and Sign Out. Login with new password worked; signed out. | browser/REFIX2-I-03-1..5.png |

Findings: none. Records created: order #391 (guest, R0), portal account johan+refix2-1019@aiautomations.co.za.
