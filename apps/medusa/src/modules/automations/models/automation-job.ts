/**
 * AutomationJob: one durable unit of automation work (n8n migration, plan
 * section 4.2), for example "enrol order X in Thinkific".
 *
 * - idempotency_key is unique: enqueueing the same order step twice is a no-op,
 *   so a replayed order.placed event or the recovery sweep never runs a step
 *   twice.
 * - state holds a handler's progress (Thinkific user id, which courses are
 *   enrolled, whether the Vtiger contact step is done) so a retry resumes
 *   where the last attempt stopped.
 * - status: pending -> running -> done, or back to pending with a later
 *   next_attempt_at (backoff), or dead after the last attempt.
 * - last_error never holds an email address (masked before it is written).
 *
 * The table is created by migrations/Migration20261006130000.ts. Queue reads
 * and writes go through raw SQL (pg-store.ts) for the row locking; this model
 * registers the table with Medusa and gives typed CRUD for admin tooling.
 */

import { model } from "@medusajs/framework/utils"

const AutomationJob = model.define("automation_job", {
  id: model.id({ prefix: "autjob" }).primaryKey(),
  automation: model.text(),
  idempotency_key: model.text().unique("IDX_automation_job_idempotency_key_unique"),
  order_id: model.text().nullable(),
  payload: model.json(),
  state: model.json().nullable(),
  result: model.json().nullable(),
  status: model.text().default("pending"),
  attempts: model.number().default(0),
  next_attempt_at: model.dateTime(),
  locked_until: model.dateTime().nullable(),
  last_error: model.text().nullable(),
})

export default AutomationJob
