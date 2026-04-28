import { defineConfig } from "@medusajs/framework/config"

export default defineConfig({
  admin: {
    disable: true,
  },
  projectConfig: {
    // Fallback URL satisfies build-time validation.
    // The real DATABASE_URL is injected at container runtime.
    databaseUrl:
      process.env.DATABASE_URL ||
      "postgres://build:build@localhost:5432/medusa",
    http: {
      adminCors: process.env.ADMIN_CORS || "http://localhost:7001",
      storeCors: process.env.STORE_CORS || "http://localhost:3000",
      authCors:
        process.env.AUTH_CORS ||
        "http://localhost:7001,http://localhost:3000",
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    },
  },
})
