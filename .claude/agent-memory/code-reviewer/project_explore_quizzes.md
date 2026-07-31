---
name: project_explore_quizzes
description: Conventions for the 8-quiz Explore diagnostic series in apps/web/app/explore/quizzes — what to check on review
metadata:
  type: project
---

The Explore section has 8 topic quizzes (nervous-system, life-transitions, intuition, relationships, health-energy, identity-purpose, leadership, vitality-longevity), all conforming to `Quiz`/`QuizResult` in `apps/web/app/explore/quizzes/types.ts`, registered in `apps/web/app/explore/quizzes/index.ts`. `nervous-system.ts` is the reference template.

Established, deliberate conventions (not bugs) seen consistently across sibling files (nervous-system, life-transitions, intuition, relationships):
- The "healthy/secure/balanced" catch-all category (e.g. `mixed`, `conscious-rebuilder`, `clear-inner-compass`, `secure-connector`) is placed LAST in the `categories[]` tie-break array and deliberately has **zero questions** mapped to it in `questions[]` — it only wins via the all-zero tie-break, not by accumulating score. This is intentional, confirmed by comments in each file, not a missing-question bug.
- Question-to-category distribution is commonly uneven (e.g. 4/4/2/0 split across 10 questions) — this matches precedent across files and is not itself a defect worth flagging.
- No em dashes anywhere (site had ~490 stripped sitewide as an AI-writing-tell cleanup, per [[feedback_no_em_dashes]]) — some files also avoid contractions entirely in mirror/mechanism copy (e.g. relationships.ts uses "it is" not "it's"), others use contractions freely (nervous-system, intuition) — both are acceptable, just check for the hard em-dash rule and apostrophe escaping, not contraction style.
- A sibling quiz file previously shipped with an unescaped apostrophe bug inside a single-quoted string literal and needed a follow-up fix — always grep single-quoted (`'...'`) string literals in these files for a raw `'` (should be `\'` or the string should switch to double quotes).

`leadership.ts` reviewed 2026-07-30: clean — sequential ids, category/results consistency, zero em dashes, zero unescaped apostrophes (it avoids contractions almost entirely, e.g. "does not"/"cannot", matching the acceptable-formal-register precedent above rather than the sourced mirror copy's occasional contraction — not a defect). Only nit found: one comma splice in the overloaded-driver mechanism field ("...the load only ever grows, it never redistributes.") — low-severity, not worth blocking on.

**How to apply:** When reviewing any of the remaining/future quiz data files in this directory (health-energy, identity-purpose, vitality-longevity), do not flag a catch-all category having no dedicated questions, an uneven question split, or a formal/no-contractions register, as bugs — check instead for: sequential question ids 1-N with no gaps/dupes, every question `category` present in `categories[]`, every `categories[]` entry having a matching `results{}` key, zero em dashes, and correct apostrophe escaping in single-quoted literals.
