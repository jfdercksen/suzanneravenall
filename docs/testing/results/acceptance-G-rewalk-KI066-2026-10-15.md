# Section G re-walk after KI066 / KI064 (commit 0ef601b), 15 Oct 2026

| id | verdict | order # | price seen | placed UTC | first click accepted (clicks) | URL had ?variant | add-to-cart text | variant kept on reload | /cart first snapshot | note |
|---|---|---|---|---|---|---|---|---|---|---|
| G-077 | PASS | 385 | R1 660,00 | 15:57:24Z | yes, 1 | yes | "Added to cart ✓" + "Live Retaker is in your cart. View cart →" | yes | "Your Cart" + status "Loading your cart...", then item | First snapshot after load showed all three variant buttons disabled and Add to Cart "Loading..." (price R7 905,00 of default Self Study). Click was issued ~5 s after navigate (tool latency) and accepted first time. |
| G-084 | PASS | 386 | R7 860,00 | 15:58:13Z | yes, 1 | yes | "Added to cart ✓" + "Live via Zoom is in your cart. View cart →" | yes | "Your Cart" + "Loading your cart...", then item | Buttons already enabled when checked ~4 s after load. |
| G-050 | PASS | 387 | R5 980,00 | 15:58:57Z | yes, 1 | yes | "Added to cart ✓" + "Package of 08 is in your cart. View cart →" | yes | "Your Cart" + "Loading your cart...", then item | Buttons enabled at click time. |

Caveats: the browser tooling cannot click within 1 s of load (about 2-5 s between navigate and click). On G-077 the disabled state was seen and the click was applied once enabled; Playwright waits for enabled, so a true refused click was not exercised. Cart line item shows the product title only ("Akashic Navigator Level 1 & 2: Purchased Together", "Energetic Clearing"), not the variant title (minor, not in the pass criteria). /checkout also shows "Loading your cart..." briefly; fill attempts too early fail until it renders.

Console errors: none. Requests 400+: none (only a 307 on a /portal prefetch, expected). Screenshots: docs/testing/results/browser/G-077b-*, G-084b-*, G-050b-* (added and confirmation).
