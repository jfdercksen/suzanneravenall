# Section I acceptance 2026-10-16

| id | verdict | severity | actual | evidence |
|---|---|---|---|---|
| I-01 | PASS | - | Signup text "Check your email..."; link landed signed in on /portal/dashboard | I-01-*.png |
| I-02 | PASS | - | "Invalid login credentials" then dashboard | I-02-dashboard.png |
| I-03 | PASS | minor | Reset OK, goes to dashboard with no success text; old password fails with "Invalid login credentials", new works | I-03-*.png |
| I-04 | PASS | - | Free Member, 0 programmes, no console errors | I-04-dashboard.png |
| I-05 | FAIL | major | Before order "No programmes yet" (PASS). Re-check after order #389, ~60 s plus reload: still "No programmes yet", dashboard Programmes 0; Getting Unstuck absent | I-05-programmes.png, I-12-programmes.png |
| I-06 | PASS | minor | 3 free items open (links are #), rest locked Silver/Gold/Practitioner; awards/media redirect to upgrade; assessments coming-soon page; signed-out redirects to /portal/login?redirect= | I-06-*.png |
| I-07 | BLOCKED | - | "Videos coming soon", no watch control for free tier | I-07-videos.png |
| I-08 | PASS | minor | Phone saved ("Profile updated successfully."), mismatch "New passwords do not match.", same password "New password should be different from the old password." | I-08-*.png |
| I-09 | FAIL | blocker | Upgrade NOW -> /shop/membership-s0212 returns 404 | I-09-*.png |
| I-10 | PASS | - | All four redirect to /portal/login?redirect=... | snapshots |
| I-11 | PASS | minor | No overflow except /portal/upgrade 4px; bottom tab bar menu, no Videos entry | I-11-*.png |
| I-12 | FAIL | major | Order #389 placed free with QA-SELFTEST-100 (total R0,00, Place order); confirmation "Order Confirmed / Thank You! / Order #389 is confirmed..."; contact step not prefilled; but Getting Unstuck never appears in /portal/programmes or dashboard | I-12-confirmation.png, I-12-programmes.png |

Findings I-NEW-1 to I-NEW-10: see JSON.
