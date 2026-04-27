import { defineConfig, loadEnv } from "@medusajs/utils"

loadEnv(process.env.NODE_ENV || "development", process.cwd())

export default defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      adminCors: process.env.ADMIN_CORS || "http://localhost:7001",
      storeCors: process.env.STORE_CORS || "http://localhost:3000",
      authCors:
        process.env.AUTH_CORS ||
        "http://localhost:7001,http://localhost:3000",
      // Medusa validates these at startup — no need to throw here (build-time has no env vars)
      jwtSecret: process.env.JWT_SECRET || "",
      cookieSecret: process.env.COOKIE_SECRET || "",
    },
  },
  modules: [
    {
      resolve: "@medusajs/file-local",
      options: {
        upload_dir: "uploads",
      },
    },
  ],
})
