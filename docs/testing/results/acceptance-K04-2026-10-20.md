# K-04 cart recovery - 2026-10-20

| id | verdict | severity | actual | evidence |
|---|---|---|---|---|
| K-04a | PASS | none | Cart A open with email set, unpaid, untouched. T_A 2026-10-20T13:58:33Z, cart_01M5CSN7Y70XJYB7ZD35E5A1JN | browser/K-04-a-checkout-filled.png |
| K-04b | PASS | none | Voucher total R0, placed at T_B+153 s. T_B 14:00:03.5Z, T_B_done 14:02:36.8Z, cart_01M5CSR33TZ2HKQH7TGEQS3T7W, order #398 | browser/K-04-b-ready-to-place.png, browser/K-04-b-confirmation.png |

Findings: K04-NEW-1 (major) transient 502 on /api/store/products, /shop showed "Unable to load programmes" until reload; K04-NEW-2 (minor) no address fields in checkout; K04-NEW-3 (minor) slow "Loading your cart..." state.
