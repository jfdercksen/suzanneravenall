const { defineConfig } = require("@medusajs/utils")

module.exports = defineConfig({
  admin: {
    disable: false,
    path: "/medusa",
  },
  projectConfig: {
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
  modules: [
    {
      // key avoids defineConfig calling require() on TypeScript source during build
      key: "programsModule",
      resolve: "./src/modules/programs",
    },
    {
      resolve: "@medusajs/payment",
      options: {
        providers: [
          {
            resolve: "./src/modules/payment-payfast",
            id: "payfast",
            options: {
              merchantId: process.env.PAYFAST_MERCHANT_ID || "",
              merchantKey: process.env.PAYFAST_MERCHANT_KEY || "",
              passphrase: process.env.PAYFAST_PASSPHRASE || "",
              sandboxMode: process.env.NODE_ENV !== "production",
              siteUrl:
                process.env.NEXT_PUBLIC_SITE_URL ||
                "https://suzanneravenall.com",
            },
          },
        ],
      },
    },
  ],
})
