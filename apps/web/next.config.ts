import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  // existing config goes here
};

export default withSentryConfig(nextConfig, {
  org: "your-sentry-org", // placeholder — replace with your Sentry org slug
  project: "suzanneravenall-web",

  // Suppress Sentry CLI output during builds
  silent: !process.env.CI,

  // Upload larger source map artifacts for better stack traces
  widenClientFileUpload: true,

  // Hide source maps from the browser bundle
  hideSourceMaps: true,

  // Remove Sentry logger statements from the production bundle
  disableLogger: true,
});
