/** The one Sage OAuth token row, tokens AES-256-GCM encrypted. Created by Migration20261126100000. */
import { model } from "@medusajs/framework/utils"

const SageOauthToken = model.define("sage_oauth_token", {
  id: model.id({ prefix: "sage" }).primaryKey(),
  access_token: model.text(),
  refresh_token: model.text(),
  expires_at: model.dateTime(),
  scope: model.text().nullable(),
})

export default SageOauthToken
