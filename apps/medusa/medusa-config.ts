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
      jwtSecret: (() => {
        const s = process.env.JWT_SECRET
        if (!s) throw new Error("JWT_SECRET env var is not set")
        return s
      })(),
      cookieSecret: (() => {
        const s = process.env.COOKIE_SECRET
        if (!s) throw new Error("COOKIE_SECRET env var is not set")
        return s
      })(),
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
