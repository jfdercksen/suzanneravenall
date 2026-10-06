/**
 * AutomationsModule: the durable job queue for the automations that move out
 * of n8n (docs/n8n-migration-plan.md section 4.2). Registered in
 * medusa-config.js under the key "automationsModule".
 */

import { Module } from "@medusajs/framework/utils"
import AutomationsModuleService from "./service"

export const AUTOMATIONS_MODULE = "automationsModule"

export default Module(AUTOMATIONS_MODULE, {
  service: AutomationsModuleService,
})
