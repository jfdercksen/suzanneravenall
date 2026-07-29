---
name: feedback_no_git_diff_tool
description: code-reviewer agent has no Bash/Grep tool in this environment — cannot run git diff/git show to isolate exact changed lines, only Read/Write/Edit
metadata:
  type: feedback
---

This agent's toolset in this project is Read, Write, Edit only — no Bash, no Grep/Glob, no git access.

**Why:** When asked to verify a working-tree diff (e.g., "confirm exactly N occurrences of class X were changed to Y across these files"), there is no way to run `git diff`/`git show HEAD:path` to see the before-state. Reading the current file only shows the after-state, so distinguishing a newly-changed occurrence from a pre-existing one with the same value is not reliably possible from file contents alone. First hit: reviewing a `text-white/50` → `text-white/70` sweep across 10 components (2026-07-03) — several files had more `text-white/70` occurrences than the stated "expected changed count" for that file, and it was impossible to tell whether the extras were pre-existing usages or over-application of the sweep.

**How to apply:** When given a "verify exactly N lines changed" review task: (1) explicitly state the tooling limitation up front rather than silently guessing, (2) do a full-text audit instead — confirm the *old* value (e.g. `text-white/50`) is fully gone from the files, confirm untouched sibling values (e.g. `text-white/60`) are still present and unaltered, confirm no unrelated classes/breakpoints changed, (3) flag any file where the found-occurrence count exceeds the stated expected-count as "unable to confirm — needs git diff" rather than a hard fail, unless something is concretely wrong (malformed class, wrong opacity value, inconsistent pattern vs. sibling files).
