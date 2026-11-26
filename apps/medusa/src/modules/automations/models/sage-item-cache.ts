/** Sage item code to Sage item id. Created by Migration20261126100000. */
import { model } from "@medusajs/framework/utils"

const SageItemCache = model.define("sage_item_cache", {
  id: model.id({ prefix: "sage" }).primaryKey(),
  item_code: model.text().unique("IDX_sage_item_cache_code_unique"),
  sage_item_id: model.text(),
})

export default SageItemCache
