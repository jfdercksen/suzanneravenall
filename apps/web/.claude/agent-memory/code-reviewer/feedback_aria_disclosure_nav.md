---
name: feedback_aria_disclosure_nav
description: Navigation dropdown pattern — aria-haspopup="true" on a disclosure nav button misleads screen readers; use aria-expanded alone for anchor-based dropdowns
metadata:
  type: feedback
---

Never use `aria-haspopup="true"` (or `aria-haspopup="menu"`) on a button that opens a dropdown containing plain `<a>` or `<Link>` elements unless you also implement the full ARIA menu role pattern (`role="menu"` on the container, `role="menuitem"` on items, arrow-key navigation).

**Why:** `aria-haspopup="true"` tells assistive technology the button controls a `role="menu"` widget. NVDA+Firefox and JAWS announce it as a "menu button" and users attempt arrow-key navigation — which does nothing in a disclosure dropdown, leaving keyboard-only screen-reader users unable to access the items. Caught in DesktopNav.tsx review.

**How to apply:** For navigation dropdowns whose children are anchor links (the standard case on this site), use the **disclosure pattern**: keep `aria-expanded` on the button, drop `aria-haspopup` entirely. Tab order naturally moves focus into the mounted dropdown links. If a full ARIA menu is needed (e.g., action menus), implement `role="menu"`, `role="menuitem"`, and full arrow-key handling — that is a separate, heavier pattern. See [[feedback_aria_listbox]] for a related ARIA-role misuse case.
