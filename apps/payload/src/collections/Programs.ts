import type { CollectionConfig, Access } from 'payload'

const isAdmin: Access = ({ req: { user } }) =>
  (user as unknown as { role?: string } | null)?.role === 'admin'

export const Programs: CollectionConfig = {
  slug: 'programs',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'category', 'price', 'currency', 'isPublished', 'isFeatured'],
  },
  fields: [
    // ── Core identity ────────────────────────────────────────────────────────
    {
      name: 'name',
      type: 'text',
      label: 'Program Name',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      label: 'Slug',
      required: true,
      unique: true,
      hooks: {
        beforeValidate: [
          ({ data, value }) => {
            if (!value && data?.name) {
              return (data.name as string)
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, '')
            }
            return value
          },
        ],
      },
    },
    // ── Descriptions ─────────────────────────────────────────────────────────
    {
      name: 'shortDescription',
      type: 'textarea',
      label: 'Short Description',
      admin: {
        description: 'Used on program cards and listing pages. Keep under 200 characters.',
      },
    },
    {
      name: 'description',
      type: 'richText',
      label: 'Full Description',
    },
    // ── Pricing ──────────────────────────────────────────────────────────────
    {
      name: 'price',
      type: 'number',
      label: 'Price',
      admin: {
        description: 'Price in the selected currency. Leave blank for "Contact us" pricing.',
      },
    },
    {
      name: 'currency',
      type: 'select',
      label: 'Currency',
      options: [
        { label: 'ZAR — South African Rand', value: 'ZAR' },
        { label: 'USD — US Dollar', value: 'USD' },
      ],
      defaultValue: 'ZAR',
      required: true,
    },
    // ── Features ─────────────────────────────────────────────────────────────
    {
      name: 'features',
      type: 'array',
      label: 'Features / What is Included',
      fields: [
        {
          name: 'feature',
          type: 'text',
          required: true,
          admin: {
            description: 'One bullet point, e.g. "6 x 1-hour private sessions"',
          },
        },
      ],
    },
    // ── Classification ───────────────────────────────────────────────────────
    {
      name: 'category',
      type: 'select',
      label: 'Category',
      options: [
        { label: 'Private Session', value: 'private-session' },
        { label: 'Group Program', value: 'group-program' },
        { label: 'Practitioner Training', value: 'practitioner' },
        { label: 'Self-Paced', value: 'self-paced' },
        { label: 'Live Event', value: 'live' },
        { label: 'Speaking / Keynote', value: 'speaking' },
      ],
      required: true,
    },
    // ── Logistics ────────────────────────────────────────────────────────────
    {
      name: 'duration',
      type: 'text',
      label: 'Duration',
      admin: {
        description: 'Human-readable duration, e.g. "6 weeks" or "1 day".',
      },
    },
    {
      name: 'maxParticipants',
      type: 'number',
      label: 'Max Participants',
      admin: {
        description: 'Leave blank for unlimited or one-on-one programs.',
      },
    },
    {
      name: 'nextIntakeDate',
      type: 'date',
      label: 'Next Intake Date',
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
        description: 'Appears in the Featured Programs section on the homepage.',
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
