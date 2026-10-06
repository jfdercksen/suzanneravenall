/**
 * AutomationsModuleService: registers the queue tables with Medusa (so
 * `medusa db:migrate` creates them) and offers typed CRUD for inspection,
 * for example listAutomationJobs({ status: "dead" }).
 *
 * The queue itself (enqueue, claim with row locks, retry with backoff) lives
 * in ./queue.ts on top of ./pg-store.ts, because it needs
 * SELECT ... FOR UPDATE SKIP LOCKED and INSERT ... ON CONFLICT DO NOTHING.
 */

import { MedusaService } from "@medusajs/framework/utils"
import AutomationJob from "./models/automation-job"
import AutomationModeState from "./models/automation-mode-state"

class AutomationsModuleService extends MedusaService({
  AutomationJob,
  AutomationModeState,
}) {}

export default AutomationsModuleService
