---
name: feedback_aria_listbox
description: ARIA listbox pattern — role="option" on native <button> is invalid and breaks screen readers; prefer plain buttons or a full custom listbox with div elements
metadata:
  type: feedback
---

Never place `role="option"` on a native `<button>` element inside a `role="listbox"` container.

**Why:** The ARIA spec forbids interactive descendants inside a listbox. Screen readers (NVDA/JAWS) will ignore the listbox semantics or expose buttons as plain buttons, making `aria-activedescendant` point at nothing useful. Caught in ExploreTopicGrid.tsx review.

**How to apply:** When reviewing interactive list components with keyboard navigation, check whether the container uses `role="listbox"`. If it does and the children are `<button>` elements, flag it. The fix is either (a) replace buttons with `div[role="option"][tabIndex=-1]` and handle all keyboard events at the listbox level, or (b) drop the listbox/option roles entirely and keep the buttons — plain buttons with `aria-label` on the container are more robust and simpler.
