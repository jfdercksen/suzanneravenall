# Memory Index

- [feedback_aria_listbox.md](feedback_aria_listbox.md) — ARIA listbox/option pattern: never use role="option" on native <button> elements
- [feedback_aria_disclosure_nav.md](feedback_aria_disclosure_nav.md) — Disclosure nav dropdowns: use aria-expanded only; aria-haspopup="true" misleads screen readers expecting a role="menu" widget
- [feedback_no_git_diff_tool.md](feedback_no_git_diff_tool.md) — No Bash/git access in this agent — audit via full-text presence checks, not exact before/after diffing
- [feedback_section_bg_alternation.md](feedback_section_bg_alternation.md) — When reviewing a new section, check sibling sections' bg-* in the composing page/shared component — not just the file in isolation
- [feedback_low_contrast_white_opacity.md](feedback_low_contrast_white_opacity.md) — text-white/40 and /50 on dark sections are below project contrast floor (c7bdd55 fixed /50→/70); flag recurrences and drift between duplicated content blocks
- [feedback_breakpoint_policy_sm_lg_only.md](feedback_breakpoint_policy_sm_lg_only.md) — Project breakpoints are sm/lg only; flag xl: (and md:) as deviations — don't accept a new breakpoint as a fix for real overflow
- [feedback_absolute_h_full_collapse.md](feedback_absolute_h_full_collapse.md) — absolute+h-full inside a relative parent with no explicit height/aspect-ratio silently collapses to ~0px — check decorative offset panels/overlays
