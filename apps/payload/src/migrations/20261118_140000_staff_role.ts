import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// The Staff role (KI125): the only role that may read quiz and intake answers
// on the website's /staff/submissions pages. Box copy, with the
// payload_migrations row: infra/scripts/migrations/payload-20261118-staff-role.sql

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "payload"."enum_users_role" ADD VALUE IF NOT EXISTS 'staff';`)
}

// Best effort: Postgres cannot drop one enum value, so the type is rebuilt.
// Staff users become editors first. Fails if another column uses the enum.
export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   UPDATE "payload"."users" SET "role" = 'editor' WHERE "role" = 'staff';
  ALTER TABLE "payload"."users" ALTER COLUMN "role" DROP DEFAULT;
  ALTER TABLE "payload"."users" ALTER COLUMN "role" SET DATA TYPE text;
  DROP TYPE "payload"."enum_users_role";
  CREATE TYPE "payload"."enum_users_role" AS ENUM('admin', 'editor');
  ALTER TABLE "payload"."users" ALTER COLUMN "role" SET DATA TYPE "payload"."enum_users_role" USING "role"::"payload"."enum_users_role";
  ALTER TABLE "payload"."users" ALTER COLUMN "role" SET DEFAULT 'editor';`)
}
