import type { CollectionConfig } from 'payload'

/**
 * Client intake forms (H-12). One document per form; the team edits the
 * questions here and the site's /intake/<token> page renders them as they
 * are saved.
 *
 * Which form a purchase gets: the first active form that lists the product's
 * handle under "Services". A private session whose product no form lists gets
 * the active form marked "Default form". Packages are variants of their
 * service's product, so they share its form.
 *
 * Read is public: the questions are not secret, and the web app reads them
 * over the internal network without a login. The answers never live here;
 * they are in Supabase (intake_submissions).
 */

const signedIn = ({ req }: { req: { user?: unknown } }) => Boolean(req.user)

export const INTAKE_FIELD_TYPES = [
  { label: 'Section heading', value: 'heading' },
  { label: 'Short text', value: 'text' },
  { label: 'Long text', value: 'textarea' },
  { label: 'Email address', value: 'email' },
  { label: 'Date', value: 'date' },
  { label: 'Choose one (dropdown)', value: 'select' },
  { label: 'Tick all that apply', value: 'checkbox-group' },
  { label: 'Scale 1 to 10', value: 'scale' },
]

export const IntakeForms: CollectionConfig = {
  slug: 'intake-forms',
  labels: { singular: 'Intake form', plural: 'Intake forms' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'formKey', 'active', 'isDefault', 'updatedAt'],
    description:
      'The forms clients complete after buying a private session. Changes show on the site straight away; forms already completed keep the questions they were answered against.',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: { description: 'Shown as the page title, e.g. "Client intake form".' },
    },
    {
      name: 'formKey',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { description: 'Internal name, lower case with dashes, e.g. "standard". Do not change it once in use.' },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'active',
          type: 'checkbox',
          defaultValue: true,
          admin: { description: 'Off: purchases of its services get the default form instead.' },
        },
        {
          name: 'isDefault',
          type: 'checkbox',
          label: 'Default form',
          defaultValue: false,
          admin: { description: 'Used for a private session that no form lists. Tick it on one form only.' },
        },
      ],
    },
    {
      name: 'services',
      type: 'array',
      labels: { singular: 'Service', plural: 'Services' },
      admin: {
        description:
          'The products that use this form. The handle is the last part of the shop link, e.g. "rapid-repatterning-session" for /shop/rapid-repatterning-session.',
      },
      fields: [
        { name: 'productHandle', type: 'text', required: true },
        {
          name: 'label',
          type: 'text',
          required: true,
          admin: { description: 'The service name the client sees, e.g. "Rapid Repatterning Session".' },
        },
        {
          name: 'introduction',
          type: 'textarea',
          admin: {
            description:
              'Optional text shown at the top of the form for this service only (for example the Rapid Repatterning introduction). Blank lines start a new paragraph.',
          },
        },
      ],
    },
    {
      name: 'intro',
      type: 'textarea',
      admin: { description: 'Shown above the questions. Blank lines start a new paragraph.' },
    },
    {
      name: 'acknowledgement',
      type: 'textarea',
      admin: { description: 'When filled in, the client must tick this statement before sending the form.' },
    },
    {
      name: 'fields',
      type: 'array',
      labels: { singular: 'Question', plural: 'Questions' },
      admin: { description: 'In the order the client sees them. Drag to reorder.' },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'type', type: 'select', required: true, defaultValue: 'text', options: INTAKE_FIELD_TYPES },
            { name: 'required', type: 'checkbox', defaultValue: false },
            {
              name: 'withDetail',
              type: 'checkbox',
              label: 'Add a details box',
              defaultValue: false,
              admin: { description: 'Adds a text box under the answer, e.g. "Other, please specify".' },
            },
          ],
        },
        { name: 'label', type: 'text', required: true, admin: { description: 'The question, or the heading text.' } },
        { name: 'helpText', type: 'text', admin: { description: 'Optional hint under the question.' } },
        {
          name: 'options',
          type: 'textarea',
          admin: {
            description: 'For "Choose one" and "Tick all that apply": one option per line.',
            condition: (_, sibling) => sibling?.type === 'select' || sibling?.type === 'checkbox-group',
          },
        },
      ],
    },
    {
      name: 'recipientEmail',
      type: 'email',
      admin: {
        description:
          'Optional. Completed forms go to this address instead of the usual team address (support).',
      },
    },
  ],
  access: {
    read: () => true,
    create: signedIn,
    update: signedIn,
    delete: ({ req }) => (req.user as { role?: string } | null | undefined)?.role === 'admin',
  },
}
