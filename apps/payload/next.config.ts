import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Payload CMS requires output: 'standalone' for Docker deployment
  output: 'standalone',
  // basePath required: nginx proxies /cms/* to this container without stripping
  // the prefix, so Next.js must know it is mounted at /cms.
  basePath: '/cms',
}

export default withPayload(nextConfig)
