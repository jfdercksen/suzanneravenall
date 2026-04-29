/**
 * ProgramsModule — Medusa v2 custom module registration.
 *
 * Registers the ProgramsModuleService under the key "programsModule".
 * Import PROGRAMS_MODULE in workflows and API routes to resolve the service.
 */

import { Module } from "@medusajs/framework/utils"
import ProgramsModuleService from "./service"

export const PROGRAMS_MODULE = "programsModule"

export default Module(PROGRAMS_MODULE, {
  service: ProgramsModuleService,
})
