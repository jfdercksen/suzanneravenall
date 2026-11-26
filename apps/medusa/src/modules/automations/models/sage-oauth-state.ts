/** One-time OAuth state values (sha256 hash only). Created by Migration20261126100000. */
import { model } from "@medusajs/framework/utils"

const SageOauthState = model.define("sage_oauth_state", {
  id: model.id({ prefix: "sage" }).primaryKey(),
  state_hash: model.text().unique("IDX_sage_oauth_state_hash_unique"),
  expires_at: model.dateTime(),
  consumed_at: model.dateTime().nullable(),
})

export default SageOauthState
