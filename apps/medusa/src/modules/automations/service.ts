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
import CartRecovery from "./models/cart-recovery"
import SageCustomerMap from "./models/sage-customer-map"
import SageItemCache from "./models/sage-item-cache"
import SageOauthState from "./models/sage-oauth-state"
import SageOauthToken from "./models/sage-oauth-token"

class AutomationsModuleService extends MedusaService({
  AutomationJob,
  AutomationModeState,
  CartRecovery,
  SageCustomerMap,
  SageItemCache,
  SageOauthState,
  SageOauthToken,
}) {}

export default AutomationsModuleService
