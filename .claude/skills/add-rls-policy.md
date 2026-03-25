---
name: add-rls-policy
description: Add or update a Supabase Row Level Security policy on an existing table. Use when access control rules need to change — new membership tier, new content type, new user role. Always spawn security-agent to review.
allowed-tools: Bash, Read, Write, Edit, Glob, Grep
---

# Add RLS Policy

## Goal
Add, update or audit Row Level Security policies on a Supabase table to correctly enforce the membership access control model.

## Inputs
- Table name to add policy to
- Who should have access (public, authenticated, specific tier, admin)
- What operation (SELECT, INSERT, UPDATE, DELETE, ALL)
- Any conditions (own rows only, active subscription, specific tier)

## Key References
- Supabase RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
- PostgreSQL RLS: https://www.postgresql.org/docs/current/ddl-rowsecurity.html
- Supabase Auth helpers: https://supabase.com/docs/guides/auth/server-side

## Process

### Step 1 — Read existing policies on the table
```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = '{table_name}';
```
Run via Supabase MCP or SQL editor. Understand what policies already exist before adding new ones.

### Step 2 — Check RLS is enabled
```sql
SELECT relname, relrowsecurity
FROM pg_class
WHERE relname = '{table_name}';
```
If relrowsecurity is false: `ALTER TABLE {table_name} ENABLE ROW LEVEL SECURITY;`

### Step 3 — Write the policy
Follow the project access control model exactly:
```sql
-- Always use descriptive policy names that explain who and what
-- Format: {role}_{action}_{table}_{condition}

CREATE POLICY "authenticated_users_select_own_{table}"
ON {table_name}
FOR SELECT
TO authenticated
USING (user_id = auth.uid());
```

### Step 4 — Create migration file
File: `packages/database/migrations/YYYYMMDDHHMMSS_add_rls_{table_name}_{policy_description}.sql`
```sql
-- Migration: add_rls_{table}_{description}
-- Created: {timestamp}
-- Description: {why this policy is needed}

-- UP
CREATE POLICY "{policy_name}"
ON {table_name}
FOR {operation}
TO {role}
USING ({condition})
WITH CHECK ({condition}); -- only needed for INSERT/UPDATE

-- DOWN
-- DROP POLICY IF EXISTS "{policy_name}" ON {table_name};
```

### Step 5 — Test the policy with multiple roles
Test these scenarios every time:
```sql
-- Test as unauthenticated (should be denied)
SET LOCAL role anon;
SELECT * FROM {table_name} LIMIT 1;

-- Test as authenticated user without required tier
SET LOCAL role authenticated;
SET LOCAL request.jwt.claims '{"sub": "{test-user-without-tier-id}"}';
SELECT * FROM {table_name} LIMIT 1;

-- Test as authenticated user with correct tier
SET LOCAL request.jwt.claims '{"sub": "{test-user-with-tier-id}"}';
SELECT * FROM {table_name} LIMIT 1;

-- Test as admin
SET LOCAL request.jwt.claims '{"sub": "{admin-user-id}"}';
SELECT * FROM {table_name} LIMIT 1;
```

### Step 6 — Spawn security-agent
Always ask security-agent to review new RLS policies before applying to production:
"Review this RLS policy on {table_name}. Try to find any way a user could bypass it or access data they should not see."

### Step 7 — Apply migration
```bash
supabase db push
```
Or via Supabase MCP if connected.

## Policy Templates

### User owns the row
```sql
CREATE POLICY "users_manage_own_{table}"
ON {table} FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
```

### Active membership tier required
```sql
CREATE POLICY "active_members_select_{table}"
ON {table} FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM member_subscriptions
    WHERE user_id = auth.uid()
    AND status = 'active'
    AND tier_id = ANY({table}.allowed_tier_ids)
  )
);
```

### Admin full access
```sql
CREATE POLICY "admins_full_access_{table}"
ON {table} FOR ALL TO authenticated
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);
```

### Public read only
```sql
CREATE POLICY "public_read_{table}"
ON {table} FOR SELECT TO anon, authenticated
USING (is_published = true);
```

## Rules
- Deny by default — only explicitly grant access, never open everything
- Always test with at least 3 roles before applying to production
- Always create a migration file — never apply policies directly without version control
- Always include DROP POLICY in the DOWN section for rollback
- Never use SECURITY DEFINER functions to bypass RLS — this defeats the purpose
- Spawn security-agent on every new policy — no exceptions
- Policy names must be descriptive — they are your documentation

## Output Format
Always report:
- Table name and operation covered
- Policy name and condition logic
- Roles it applies to
- Test results for each role scenario
- Migration file location
- Security agent review findings
