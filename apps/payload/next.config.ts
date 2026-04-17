import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Payload CMS requires output: 'standalone' for Docker deployment
  output: 'standalone',
}

export default withPayload(nextConfig)
