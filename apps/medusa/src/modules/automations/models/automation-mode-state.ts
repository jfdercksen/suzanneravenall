/**
 * AutomationModeState: the last cutover mode seen for each automation, and
 * since when. The order recovery sweep only picks up orders placed after the
 * automation entered "code" mode, so orders that n8n handled before a flip are
 * never run a second time by our code.
 */

import { model } from "@medusajs/framework/utils"

const AutomationModeState = model.define("automation_mode_state", {
  automation: model.text().primaryKey(),
  mode: model.text(),
  since: model.dateTime(),
})

export default AutomationModeState
