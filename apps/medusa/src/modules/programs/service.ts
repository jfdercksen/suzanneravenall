/**
 * ProgramsModuleService — Medusa v2 module service.
 *
 * Auto-generates CRUD operations for the ProgramMetadata entity via MedusaService.
 * Exposes: createProgramMetadatas, updateProgramMetadatas, deleteProgramMetadatas,
 * retrieveProgramMetadata, listProgramMetadatas, listAndCountProgramMetadatas.
 */

import { MedusaService } from "@medusajs/framework/utils"
import ProgramMetadata from "./models/program-metadata"

class ProgramsModuleService extends MedusaService({
  ProgramMetadata,
}) {}

export default ProgramsModuleService
