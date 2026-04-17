import type { CollectionConfig, Access } from 'payload'

const isAdmin: Access = ({ req: { user } }) =>
  (user as unknown as { role?: string } | null)?.role === 'admin'

export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'isPublished'],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Page Title',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      label: 'Slug',
      required: true,
      unique: true,
      admin: {
        description: 'URL path segment, e.g. "about" for /about.',
      },
      hooks: {
        beforeValidate: [
          ({ data, value }) => {
            if (!value && data?.title) {
              return (data.title as string)
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, '')
            }
            return value
          },
        ],
      },
    },
    {
      name: 'content',
      type: 'richText',
      label: 'Page Content',
    },
    // ── SEO ─────────────────────────────────────────────────────────────────
    {
      name: 'seoTitle',
      type: 'text',
      label: 'SEO Title',
      admin: {
        description: 'Overrides the page title in search results. 50–60 characters recommended.',
      },
    },
    {
      name: 'seoDescription',
      type: 'textarea',
      label: 'SEO Description',
      admin: {
        description: 'Meta description shown in search results. 150–160 characters recommended.',
      },
    },
    {
      name: 'isPublished',
      type: 'checkbox',
      label: 'Published',
      defaultValue: false,
    },
  ],
  access: {
    read: ({ req: { user } }) => {
      if (user) return true
      return {
        isPublished: {
          equals: true,
        },
      }
    },
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
}
