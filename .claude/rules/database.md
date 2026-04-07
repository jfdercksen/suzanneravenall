---
globs: ["**/packages/database/**", "**/migrations/**"]
---

## Database Rules — Schema and Migrations

- Every table must have: `id UUID DEFAULT gen_random_uuid() PRIMARY KEY`, `created_at TIMESTAMPTZ DEFAULT now() NOT NULL`, `updated_at TIMESTAMPTZ DEFAULT now() NOT NULL`
- Every table with user data must have `ALTER TABLE {name} ENABLE ROW LEVEL SECURITY`
- Every migration must have both UP and DOWN (rollback) sections
- Migration filenames: `YYYYMMDDHHMMSS_description.sql`
- Never use SERIAL — always UUID primary keys
- Always add indexes on foreign keys and frequently queried columns
- Never modify schema directly in Supabase dashboard — always via migration files
- TypeScript types in `packages/database/types/` must exactly match the SQL schema
- Use `moddatetime` trigger for `updated_at` columns
- RLS policies must deny by default — explicitly grant access
- Test RLS with at least 3 roles: unauthenticated, basic member, admin
