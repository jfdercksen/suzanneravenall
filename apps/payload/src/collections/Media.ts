import type { CollectionConfig, Access } from 'payload'

// TODO (Phase 3): Replace local disk storage with Supabase Storage via
// @payloadcms/storage-s3 configured with the Supabase S3-compatible endpoint.
// Supabase S3 endpoint: https://<project>.supabase.co/storage/v1/s3
// Required env vars: SUPABASE_S3_BUCKET, SUPABASE_S3_ACCESS_KEY_ID, SUPABASE_S3_SECRET_ACCESS_KEY

const isAuthenticated: Access = ({ req: { user } }) => Boolean(user)

const isAdmin: Access = ({ req: { user } }) =>
  (user as unknown as { role?: string } | null)?.role === 'admin'

export const Media: CollectionConfig = {
  slug: 'media',
  upload: {
    staticDir: './public/uploads',
    mimeTypes: [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/avif',
      'image/svg+xml',
      'application/pdf',
    ],
    imageSizes: [
      {
        name: 'thumbnail',
        width: 400,
        height: 300,
        position: 'centre',
      },
      {
        name: 'card',
        width: 768,
        height: 576,
        position: 'centre',
      },
      {
        name: 'feature',
        width: 1280,
        height: 720,
        position: 'centre',
      },
    ],
  },
  admin: {
    useAsTitle: 'filename',
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      label: 'Alt Text',
    },
    {
      name: 'caption',
      type: 'text',
      label: 'Caption',
    },
  ],
  access: {
    read: () => true,
    create: isAuthenticated,
    update: isAuthenticated,
    delete: isAdmin,
  },
}
