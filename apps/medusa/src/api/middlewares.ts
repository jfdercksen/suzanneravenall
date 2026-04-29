import { defineMiddlewares } from "@medusajs/framework/http"
import type { MedusaNextFunction, MedusaRequest, MedusaResponse } from "@medusajs/framework/types"

export default defineMiddlewares({
  routes: [
    {
      matcher: "/**",
      middlewares: [
        (req: MedusaRequest, _res: MedusaResponse, next: MedusaNextFunction) => {
          // Trust the nginx reverse proxy's X-Forwarded-Proto header so that
          // express-session sets cookies even when the client connects over HTTP.
          // Safe because nginx is the only entry point — direct container access
          // is not exposed. Remove once real HTTPS is live and NODE_ENV=production
          // handles this correctly via Certbot + nginx SSL termination.
          req.app.set("trust proxy", 1)
          next()
        },
      ],
    },
  ],
})
