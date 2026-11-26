/** Buyer email (lower case, unique) to Sage customer id. Created by Migration20261126100000. */
import { model } from "@medusajs/framework/utils"

const SageCustomerMap = model.define("sage_customer_map", {
  id: model.id({ prefix: "sage" }).primaryKey(),
  email: model.text().unique("IDX_sage_customer_map_email_unique"),
  sage_customer_id: model.text(),
})

export default SageCustomerMap
