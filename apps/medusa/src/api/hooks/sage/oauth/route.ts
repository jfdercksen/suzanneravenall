import { createHash, timingSafeEqual } from "crypto"
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import { SageConfigError } from "../../../../modules/sage/errors"
import { sageOAuth } from "../../../../modules/sage/factory"
import { completeConnect, OAuthStateError } from "../../../../modules/sage/oauth-flow"

// Called by the web app's /api/sage/oauth/callback after Sage redirected the
// browser there with ?code=&state=. Internal: the web container calls
// http://medusa:9000 with the shared secret. Checks the one-time state, trades
// the code for tokens and stores them encrypted. Never logs or returns a
// token, a code or the state.
const bodySchema = z.object({
  code: z.string().min(1).max(2048),
  state: z.string().min(16).max(256),
})

// Hashing first keeps the comparison constant-time whatever the lengths.
function secretMatches(given: string, expected: string): boolean {
  const digest = (v: string) => createHash("sha256").update(v).digest()
  return timingSafeEqual(digest(given), digest(expected))
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const expected = process.env.INTERNAL_WEBHOOK_SECRET || process.env.N8N_WEBHOOK_SECRET || ""
  if (!expected) {
    res.status(500).json({ message: "Server configuration error" })
    return
  }
  const given = req.headers["x-webhook-secret"]
  if (typeof given !== "string" || !secretMatches(given, expected)) {
    res.status(401).json({ message: "Unauthorized" })
    return
  }
  const parsed = bodySchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: "code and state are required" })
    return
  }
  try {
    const { auth, store } = sageOAuth(req.scope)
    await completeConnect({ auth, store }, parsed.data)
    res.json({ status: "connected" })
  } catch (err) {
    if (err instanceof OAuthStateError) {
      res.status(400).json({ message: err.message })
      return
    }
    if (err instanceof SageConfigError) {
      res.status(409).json({ message: err.message })
      return
    }
    console.error(`[sage-oauth] connect failed: ${err instanceof Error ? err.name : "error"}`)
    res.status(502).json({ message: "Sage connect failed" })
  }
}
