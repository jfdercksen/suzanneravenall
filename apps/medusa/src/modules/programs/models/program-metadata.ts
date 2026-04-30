/**
 * ProgramMetadata — custom Medusa v2 module entity.
 *
 * Stores coaching-programme specific metadata that Medusa's core product module
 * does not model: delivery method, duration, participant cap, and certification.
 *
 * Linked 1:1 to a Medusa product via medusa_product_id (unique).
 */

import { model } from "@medusajs/framework/utils"

const ProgramMetadata = model.define("program_metadata", {
  id: model.id().primaryKey(),
  medusa_product_id: model.text().unique(),
  program_type: model.enum(["course", "session", "group", "licensing", "bundle"]),
  delivery_method: model.enum(["online", "in_person", "hybrid"]),
  duration_weeks: model.number(),
  max_participants: model.number().nullable(),
  includes_certification: model.boolean().default(false),
})

export default ProgramMetadata
