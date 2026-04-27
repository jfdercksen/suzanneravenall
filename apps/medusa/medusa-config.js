// medusa-config.js
// defineConfig is a TypeScript type-inference helper that is a passthrough
// at runtime. We skip it here and export the raw config object directly,
// which ConfigManager.loadConfig handles identically.
module.exports = {
  admin: {
    disable: false,
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
}
