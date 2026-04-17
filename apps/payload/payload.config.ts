import path from 'path'
import { fileURLToPath } from 'url'
import { buildConfig } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { postgresAdapter } from '@payloadcms/db-postgres'

import { Users } from './src/collections/Users'
import { BlogPosts } from './src/collections/BlogPosts'
import { Programs } from './src/collections/Programs'
import { Testimonials } from './src/collections/Testimonials'
import { Pages } from './src/collections/Pages'
import { Media } from './src/collections/Media'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: 'users',
    meta: {
      titleSuffix: '— Suzanne Ravenall CMS',
    },
  },

  collections: [Users, BlogPosts, Programs, Testimonials, Pages, Media],

  editor: lexicalEditor({}),

  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL,
    },
  }),

  secret: process.env.PAYLOAD_SECRET ?? '',

  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },

  // Serve uploads from the /uploads path
  upload: {
    limits: {
      fileSize: 10_000_000, // 10 MB
    },
  },
})
