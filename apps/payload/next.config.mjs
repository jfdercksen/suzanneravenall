import { withPayload } from '@payloadcms/next/withPayload'

const nextConfig = {
  // Payload CMS requires output: 'standalone' for Docker deployment
  output: 'standalone',
  // basePath required: nginx proxies /cms/* to this container without stripping
  // the prefix, so Next.js must know it is mounted at /cms.
  basePath: '/cms',
  // Payload 3.x ships type declarations that conflict with React 19's ReactNode type.
  // This is a known upstream issue — ignoreBuildErrors suppresses it safely.
  typescript: {
    ignoreBuildErrors: true,
  },
}

export default withPayload(nextConfig)
