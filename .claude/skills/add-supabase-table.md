---
name: add-supabase-table
description: Create a new Supabase table with proper schema, migration file, TypeScript types and RLS policies. Use when adding any new table to the database. Never create tables without RLS.
allowed-tools: Bash, Read, Write, Edit, Glob, Grep
---

# Add Supabase Table

## Goal
Create a production-ready Supabase table with migration, TypeScript types and RLS policies that enforce the membership access control model.

## Inputs
- Table name (snake_case)
- Columns and their types
- Who can read/write (public, authenticated, specific tier, admin only)
- Whether it relates to users, memberships, content or commerce

## Key References
- Supabase RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase migrations: https://supabase.com/docs/guides/cli/managing-environments
- PostgreSQL data types: https://www.postgresql.org/docs/current/datatype.html

## Process

### Step 1 — Read existing schema
```bash
ls packages/database/migrations/
```
Read the most recent migration to understand existing tables and naming conventions before adding anything new.

### Step 2 — Create migration file
Filename: `packages/database/migrations/YYYYMMDDHHMMSS_create_{table_name}.sql`

Migration template:
```sql
-- Migration: create_{table_name}
-- Created: {timestamp}
-- Description: {what this table stores and why}

-- =============================================
-- UP
-- =============================================

CREATE TABLE {table_name} (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  -- add columns here
);

-- Updated at trigger
CREATE TRIGGER set_{table_name}_updated_at
  BEFORE UPDATE ON {table_name}
  FOR EACH ROW
  EXECUTE FUNCTION moddatetime(updated_at);

-- Enable RLS — always, no exceptions
ALTER TABLE {table_name} ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Policy: describe exactly who can do what and why
CREATE POLICY "{descriptive_policy_name}"
ON {table_name}
FOR SELECT
TO authenticated
USING (
  -- condition here
);

-- =============================================
-- DOWN (rollback)
-- =============================================
-- DROP TABLE IF EXISTS {table_name};

-- Indexes
CREATE INDEX idx_{table_name}_{column} ON {table_name}({column});
```

### Step 3 — Create TypeScript types
File: `packages/database/types/{table_name}.ts`
```typescript
export type {TableName} = {
  id: string
  created_at: string
  updated_at: string
  // all columns typed here
}

export type {TableName}Insert = Omit<{TableName}, "id" | "created_at" | "updated_at">
export type {TableName}Update = Partial<{TableName}Insert>
```

### Step 4 — Update database types index
Add export to `packages/database/types/index.ts`

### Step 5 — Apply migration locally
```bash
supabase db push
```
Or via Supabase MCP if connected.

### Step 6 — Verify RLS
Test with at least three scenarios:
- Unauthenticated user — should be denied
- Authenticated user without required tier — should be denied
- Authenticated user with correct tier — should be allowed
- Admin user — should have full access

### Step 7 — Spawn security-agent
Ask security-agent to review the RLS policies before finishing.

### Step 8 — Spawn code-reviewer
Ask code-reviewer to review the migration file and TypeScript types.

## RLS Policy Templates by Access Pattern

### User owns the row
```sql
CREATE POLICY "users_own_rows" ON {table}
FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
```

### Membership tier access
```sql
CREATE POLICY "tier_access" ON {table}
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM member_subscriptions
    WHERE user_id = auth.uid()
    AND status = 'active'
    AND tier_id = ANY({table}.allowed_tier_ids)
  )
);
```

### Admin only
```sql
CREATE POLICY "admin_only" ON {table}
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);
```

### Public read, authenticated write
```sql
CREATE POLICY "public_read" ON {table}
FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY "authenticated_write" ON {table}
FOR INSERT TO authenticated
WITH CHECK (true);
```

## Rules
- RLS must be enabled on every table — no exceptions
- Every table must have id, created_at, updated_at columns
- Every table must have a rollback (DOWN) section in the migration
- Never use SERIAL for primary keys — always UUID with gen_random_uuid()
- Always add indexes on foreign keys and frequently queried columns
- TypeScript types must exactly match the database schema
