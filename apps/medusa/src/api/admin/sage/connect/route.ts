import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SageConfigError } from "../../../../modules/sage/errors"
import { sageOAuth } from "../../../../modules/sage/factory"
import { startConnect } from "../../../../modules/sage/oauth-flow"

// POST /admin/sage/connect (Medusa admin login required): starts the one-time
// OAuth connect. Stores a fresh state (valid 10 minutes) and returns the Sage
// authorize URL to open in the browser. Sage then redirects to
// https://suzanneravenall.com/api/sage/oauth/callback, which hands code and
// state to POST /hooks/sage/oauth.
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { auth, store } = sageOAuth(req.scope)
    const { url, expiresAt } = await startConnect({ auth, store })
    res.json({ url, expires_at: expiresAt.toISOString() })
  } catch (err) {
    if (err instanceof SageConfigError) {
      res.status(409).json({ message: err.message })
      return
    }
    console.error(`[sage-oauth] could not start connect: ${err instanceof Error ? err.name : "error"}`)
    res.status(500).json({ message: "Could not start the Sage connect" })
  }
}
