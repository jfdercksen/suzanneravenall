import type { CollectionConfig, Access } from 'payload'

const isAdmin: Access = ({ req: { user } }) =>
  (user as unknown as { role?: string } | null)?.role === 'admin'

export const BlogPosts: CollectionConfig = {
  slug: 'blog-posts',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'author', 'isPublished', 'publishedAt'],
  },
  fields: [
    // ── Core content ────────────────────────────────────────────────────────
    {
      name: 'title',
      type: 'text',
      label: 'Title',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      label: 'Slug',
      required: true,
      unique: true,
      admin: {
        description: 'URL-safe identifier — auto-generated from title, editable.',
      },
      hooks: {
        beforeValidate: [
          ({ data, value }) => {
            // Auto-generate slug from title if not manually set
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
      label: 'Content',
    },
    {
      name: 'featuredImage',
      type: 'upload',
      relationTo: 'media',
      label: 'Featured Image',
    },
    {
      name: 'author',
      type: 'text',
      label: 'Author',
    },
    {
      name: 'publishedAt',
      type: 'date',
      label: 'Published At',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'isPublished',
      type: 'checkbox',
      label: 'Published',
      defaultValue: false,
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
    // ── Taxonomy ─────────────────────────────────────────────────────────────
    {
      name: 'tags',
      type: 'array',
      label: 'Tags',
      fields: [
        {
          name: 'tag',
          type: 'text',
          required: true,
        },
      ],
    },
  ],
  access: {
    // Public can read published posts; authenticated users see all
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
