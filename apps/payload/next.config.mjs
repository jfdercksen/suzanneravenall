import { withPayload } from '@payloadcms/next/withPayload'

const nextConfig = {
  output: 'standalone',
  basePath: '/cms',
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
}

// withPayload imports payload.config.ts at call time; if DATABASE_URL is unset
// (CI build runner, Docker builder stage) pg throws "Invalid URL" on undefined.
// The try/catch is a safety net — the primary fix is the dummy DATABASE_URL
// supplied via env in deploy.yml and the Dockerfile builder stage.
let config = nextConfig
try {
  config = withPayload(nextConfig)
} catch (e) {
  console.warn('withPayload() failed — building with base config:', e.message)
}

export default config
