-- Payload CMS: the Staff role (KI125), for the review/production box.
-- Same SQL as apps/payload/src/migrations/20261118_140000_staff_role.ts (UP),
-- plus the payload_migrations row so a later `payload migrate` treats it as
-- applied. The Payload container does not run migrations itself, so this is
-- applied by hand against the payload database:
--   docker compose exec -T postgres psql -U <user> -d <payload db> -v ON_ERROR_STOP=1 < this file
-- Apply BEFORE the payload deploy that offers the role: without the enum value
-- saving a user with role Staff fails.
-- Idempotence: ADD VALUE IF NOT EXISTS is safe to repeat; the migrations row
-- is only added once.

BEGIN;
ALTER TYPE "payload"."enum_users_role" ADD VALUE IF NOT EXISTS 'staff';

INSERT INTO "payload"."payload_migrations" ("name", "batch")
SELECT '20261118_140000_staff_role', (SELECT COALESCE(MAX("batch"), 0) + 1 FROM "payload"."payload_migrations")
WHERE NOT EXISTS (SELECT 1 FROM "payload"."payload_migrations" WHERE "name" = '20261118_140000_staff_role');

COMMIT;
