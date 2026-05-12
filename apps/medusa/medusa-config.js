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
      key: "membershipsModule",
      resolve: "./src/modules/memberships",
    },
    {
      key: "vtigerModule",
      resolve: "./src/modules/vtiger",
    },
    {
      key: "sageModule",
      resolve: "./src/modules/sage",
      options: {
        apiKey: process.env.SAGE_API_KEY || "",
        email: process.env.SAGE_EMAIL || "",
        password: process.env.SAGE_PASSWORD || "",
        companyId: process.env.SAGE_COMPANY_ID || "",
        baseUrl: process.env.SAGE_API_URL || "https://accounting.sageone.co.za/api/2.0.0",
        // Recommended: set this to your Sage income ledger account ID to avoid heuristic lookup
        incomeAccountId: process.env.SAGE_INCOME_ACCOUNT_ID || "",
      },
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
          {
            resolve: "./src/modules/payment-paypal",
            id: "paypal",
            options: {
              clientId: process.env.PAYPAL_CLIENT_ID || "",
              clientSecret: process.env.PAYPAL_CLIENT_SECRET || "",
              sandboxMode: process.env.NODE_ENV !== "production",
              siteUrl:
                process.env.NEXT_PUBLIC_SITE_URL ||
                "https://suzanneravenall.com",
              webhookId: process.env.PAYPAL_WEBHOOK_ID || "",
            },
          },
        ],
      },
    },
  ],
})
