## Build Workflow

For every non-trivial code change (new component, new route, new API route):

1. **Write** — Implement the code
2. **Review** — Spawn `code-reviewer` on the changed file(s). Reports issues — does NOT fix them.
3. **QA (unit)** — Spawn `qa-unit` to generate and run Vitest tests. Reports results — does NOT fix them.
4. **QA (visual)** — Spawn `qa-visual` to screenshot the route and compare against reference. Reports differences — does NOT fix them.
5. **Fix** — Apply all fixes from all three reports
6. **Build check** — Run `npm run build` and fix any type errors
7. **Ship** — Only after review passes, tests pass, build succeeds, and visual QA passes

**Parallel execution:** Spawn `code-reviewer`, `qa-unit`, and `qa-visual` in parallel when they cover independent concerns.

## Research Workflow

Before implementing an unfamiliar library, API, or pattern:
1. Spawn `research` agent with the specific question
2. Read the findings
3. Implement based on the sourced recommendation

## General Rules

- Run `npm run build` before any deploy — never deploy a broken build
- Never commit `.env.local` — it's in `.gitignore`
- Keep `CLAUDE.md` up to date when adding routes or components
