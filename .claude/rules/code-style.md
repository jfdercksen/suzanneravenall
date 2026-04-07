## Code Style

- TypeScript strict mode — no `any`, no `@ts-ignore`, no `@ts-nocheck`
- Named exports for shared components, default exports for page components
- PascalCase for component files, camelCase for utility files, snake_case for database columns
- Prefer `const` over `let` — never use `var`
- Prefer early returns over deeply nested conditionals
- Destructure props in function signature — not inside function body
- One component per file — no multi-component files
- Import order: React/Next.js, third-party libraries, local imports, types
- No barrel exports from component directories — import directly from the file
- Tailwind class order: layout (flex, grid) → sizing (w, h) → spacing (p, m) → typography → colors → effects
