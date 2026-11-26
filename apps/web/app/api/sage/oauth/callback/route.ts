import { z } from 'zod'
import { logError } from '@/lib/log'
import { medusaBase } from '@/lib/paypal'

/**
 * GET /api/sage/oauth/callback: where Sage sends the browser after the Sage
 * administrator approves the connection (the address given to Sage). It only
 * relays code and state, server to server, to Medusa (POST /hooks/sage/oauth),
 * which checks the one-time state, exchanges the code and stores the tokens
 * encrypted. The route lives under /api/sage so nginx sends it to Next, not
 * Medusa (only /api/auth, /api/store and /api/admin go to Medusa).
 *
 * The code and the state are never logged and never echoed back.
 */

const querySchema = z.object({
  code: z.string().min(1).max(2048),
  state: z.string().min(16).max(256),
})

function page(status: number, title: string, text: string): Response {
  const html =
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex">` +
    `<title>${title}</title></head><body style="font-family:sans-serif;max-width:32rem;margin:4rem auto;padding:0 1rem">` +
    `<h1>${title}</h1><p>${text}</p></body></html>`
  return new Response(html, {
    status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      // The URL carries the one-time code: never send it on as a referrer.
      'Referrer-Policy': 'no-referrer',
    },
  })
}

export async function GET(request: Request): Promise<Response> {
  const params = new URL(request.url).searchParams
  const parsed = querySchema.safeParse({ code: params.get('code'), state: params.get('state') })
  if (!parsed.success) {
    return page(400, 'Sage connection not completed', 'This link is missing its code or state. Start the connection again from the Medusa admin.')
  }

  const secret = process.env.INTERNAL_WEBHOOK_SECRET || process.env.N8N_WEBHOOK_SECRET || ''
  if (!secret) {
    logError('[Sage OAuth] INTERNAL_WEBHOOK_SECRET is not set, cannot hand the callback to Medusa')
    return page(500, 'Server configuration error', 'The server is not set up to finish the Sage connection.')
  }

  try {
    const res = await fetch(`${medusaBase()}/hooks/sage/oauth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-webhook-secret': secret },
      body: JSON.stringify(parsed.data),
      cache: 'no-store',
    })
    if (res.ok) return page(200, 'Sage is connected', 'You can close this window.')
    logError('[Sage OAuth] Medusa refused the callback', undefined, { status: res.status })
    if (res.status === 400) {
      return page(400, 'Sage connection not completed', 'The connection link is invalid, already used or expired. Start the connection again from the Medusa admin.')
    }
    return page(502, 'Sage connection not completed', 'The connection could not be finished. Check the server log and try again.')
  } catch (err) {
    logError('[Sage OAuth] Medusa unreachable for the callback', err)
    return page(502, 'Sage connection not completed', 'The connection could not be finished. Try again shortly.')
  }
}
