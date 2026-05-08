/**
 * MembershipsModule — Medusa v2 custom module registration.
 *
 * Registers MembershipsModuleService under the key "membershipsModule".
 * Import MEMBERSHIPS_MODULE in subscribers, workflows, and API routes
 * to resolve the service from the container.
 */

import { Module } from "@medusajs/framework/utils"
import MembershipsModuleService from "./service"

export const MEMBERSHIPS_MODULE = "membershipsModule"

export default Module(MEMBERSHIPS_MODULE, {
  service: MembershipsModuleService,
})
