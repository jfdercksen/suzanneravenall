import type { CollectionConfig, Access } from 'payload'

const isAdmin: Access = ({ req: { user } }) =>
  (user as unknown as { role?: string } | null)?.role === 'admin'

export const Testimonials: CollectionConfig = {
  slug: 'testimonials',
  admin: {
    useAsTitle: 'clientName',
    defaultColumns: ['clientName', 'clientRole', 'isFeatured', 'isPublished', 'order'],
  },
  fields: [
    // ── Client identity ──────────────────────────────────────────────────────
    {
      name: 'clientName',
      type: 'text',
      label: 'Client Name',
      required: true,
    },
    {
      name: 'clientRole',
      type: 'text',
      label: 'Client Role / Location',
      admin: {
        description: 'E.g. "CEO, Cape Town" or "Executive Coach, Johannesburg".',
      },
    },
    // ── Quote ────────────────────────────────────────────────────────────────
    {
      name: 'quote',
      type: 'textarea',
      label: 'Testimonial Quote',
      required: true,
      admin: {
        description: "The full testimonial in the client's own words.",
      },
    },
    // ── Result ───────────────────────────────────────────────────────────────
    {
      name: 'result',
      type: 'text',
      label: 'Result Statement',
      admin: {
        description: 'Short outcome statement, e.g. "Revenue doubled in 6 months".',
      },
    },
    {
      name: 'resultStat',
      type: 'text',
      label: 'Result Statistic',
      admin: {
        description: 'Large display stat shown on card, e.g. "2x" or "300%".',
      },
    },
    // ── Media ────────────────────────────────────────────────────────────────
    {
      name: 'photo',
      type: 'upload',
      relationTo: 'media',
      label: 'Client Photo',
    },
    {
      name: 'videoUrl',
      type: 'text',
      label: 'Video URL (Bunny Stream)',
      admin: {
        description:
          'Bunny Stream embed URL for video testimonials. Phase 3 feature — leave blank for now.',
      },
    },
    // ── Visibility ───────────────────────────────────────────────────────────
    {
      name: 'isPublished',
      type: 'checkbox',
      label: 'Published',
      defaultValue: false,
    },
    {
      name: 'isFeatured',
      type: 'checkbox',
      label: 'Featured on Homepage',
      defaultValue: false,
      admin: {
        description: 'Appears in the Testimonials section on the homepage.',
      },
    },
    {
      name: 'order',
      type: 'number',
      label: 'Display Order',
      admin: {
        description: 'Lower numbers appear first. Use to control display sequence.',
      },
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
