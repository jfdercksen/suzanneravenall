import { defineMiddlewares } from "@medusajs/medusa"

export default defineMiddlewares({
  routes: [
    {
      matcher: "/**",
      middlewares: [
        // Trust nginx's X-Forwarded-Proto header so express-session creates cookies
        // even when the client connects over HTTP. nginx sets X-Forwarded-Proto: https
        // and also strips the Secure flag on the response cookie via proxy_cookie_flags.
        // Remove once real SSL is live on the domain.
        (req: any, _res: any, next: any) => {
          req.app.set("trust proxy", 1)
          next()
        },
      ],
    },
  ],
})
