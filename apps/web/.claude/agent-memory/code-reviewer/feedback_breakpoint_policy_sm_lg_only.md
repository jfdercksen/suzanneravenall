---
name: feedback-breakpoint-policy-sm-lg-only
description: Project breakpoint system is sm/lg only (per packages/config/tailwind.config.ts comment and design-rules.md) — flag md: AND xl: as deviations, not just md:
metadata:
  type: feedback
---

`packages/config/tailwind.config.ts` documents the intended responsive system explicitly: "Breakpoints: sm (640px) and lg (1024px) only — no md". `.claude/rules/no-bad-patterns.md` already bans `md:` for this reason. Tailwind's default `xl:` (1280px) is not overridden/removed by the preset, so it still works technically, but using it is an undocumented third breakpoint outside the project's stated two-breakpoint system.

**Why:** Found in `components/layout/Header.tsx` — the "Discover Your Pattern" CTA is gated `hidden xl:inline-flex` (only the "Book a Discovery Call" CTA uses the standard `hidden lg:inline-flex`). The author's own comment justifies this as a deliberate workaround for header crowding at 1024–1279px, but it doesn't actually fix the underlying crowding (the 8-item nav + search + cart + one CTA still may not fit at exactly 1024px) — it just hides the second CTA one breakpoint later.

**How to apply:** Treat `xl:` (and any other non-sm/lg prefix) the same as `md:` — flag it as a design-system deviation. If a component pattern requires an intermediate breakpoint to solve real overflow, that's a signal to raise the underlying overflow risk (measure/reflow the flex row) rather than accept a new breakpoint as the fix. Also check `.claude/agent-memory/code-reviewer/feedback_low_contrast_white_opacity.md` and `[[feedback-section-bg-alternation]]` for other project-specific conventions worth re-checking on every header/nav change.
