---
globs: ["**/*.test.ts", "**/*.test.tsx", "**/*.spec.ts", "**/*.spec.tsx"]
---

## Testing Rules

- Test framework: Vitest + React Testing Library
- Test files live next to the source file: `Component.tsx` → `Component.test.tsx`
- Mock external APIs and fetch — never make real network calls in tests
- Mock Supabase client — never hit a real database in unit tests
- Test the happy path first, then edge cases, then error cases
- For React components: test render, user interaction, and conditional display
- For API routes: test valid input, invalid input (Zod rejection), auth failure, and error handling
- For utility functions: test boundary values, empty inputs, and type coercion
- Use `describe` blocks to group related tests
- Test names should read as sentences: `it("returns 401 when session is missing")`
- Never test implementation details — test behaviour and outputs
- Run tests with `npx vitest run {file}` — not `vitest watch`
