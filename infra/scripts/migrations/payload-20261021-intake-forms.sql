-- Payload CMS: the intake-forms collection (H-12), for the review/production box.
-- Same SQL as apps/payload/src/migrations/20261021_025305_intake_forms.ts (UP),
-- in one transaction, plus the payload_migrations row so a later
-- `payload migrate` treats it as applied. The Payload container does not run
-- migrations itself, so this is applied by hand against the payload database:
--   docker compose exec -T postgres psql -U <user> -d <payload db> -v ON_ERROR_STOP=1 < this file
-- Then restart payload: onInit seeds the five forms into the empty collection.
-- Idempotence: stops at the first statement if the table already exists.

BEGIN;
CREATE TYPE "payload"."enum_intake_forms_fields_type" AS ENUM('heading', 'text', 'textarea', 'email', 'date', 'select', 'checkbox-group', 'scale');
  CREATE TABLE "payload"."intake_forms_services" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"product_handle" varchar NOT NULL,
  	"label" varchar NOT NULL,
  	"introduction" varchar
  );
  
  CREATE TABLE "payload"."intake_forms_fields" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"type" "payload"."enum_intake_forms_fields_type" DEFAULT 'text' NOT NULL,
  	"required" boolean DEFAULT false,
  	"with_detail" boolean DEFAULT false,
  	"label" varchar NOT NULL,
  	"help_text" varchar,
  	"options" varchar
  );
  
  CREATE TABLE "payload"."intake_forms" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"form_key" varchar NOT NULL,
  	"active" boolean DEFAULT true,
  	"is_default" boolean DEFAULT false,
  	"intro" varchar,
  	"acknowledgement" varchar,
  	"recipient_email" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD COLUMN "intake_forms_id" integer;
  ALTER TABLE "payload"."intake_forms_services" ADD CONSTRAINT "intake_forms_services_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."intake_forms"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."intake_forms_fields" ADD CONSTRAINT "intake_forms_fields_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."intake_forms"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "intake_forms_services_order_idx" ON "payload"."intake_forms_services" USING btree ("_order");
  CREATE INDEX "intake_forms_services_parent_id_idx" ON "payload"."intake_forms_services" USING btree ("_parent_id");
  CREATE INDEX "intake_forms_fields_order_idx" ON "payload"."intake_forms_fields" USING btree ("_order");
  CREATE INDEX "intake_forms_fields_parent_id_idx" ON "payload"."intake_forms_fields" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "intake_forms_form_key_idx" ON "payload"."intake_forms" USING btree ("form_key");
  CREATE INDEX "intake_forms_updated_at_idx" ON "payload"."intake_forms" USING btree ("updated_at");
  CREATE INDEX "intake_forms_created_at_idx" ON "payload"."intake_forms" USING btree ("created_at");
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_intake_forms_fk" FOREIGN KEY ("intake_forms_id") REFERENCES "payload"."intake_forms"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_intake_forms_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("intake_forms_id");

INSERT INTO "payload"."payload_migrations" ("name", "batch")
SELECT '20261021_025305_intake_forms', COALESCE(MAX("batch"), 0) + 1 FROM "payload"."payload_migrations";

COMMIT;
