import type { Metadata } from 'next'
import AssessmentsContent from './AssessmentsContent'

export const metadata: Metadata = {
  title: 'Assessments',
  description:
    'Self-assessment tools for transformation are coming soon. Join the list to be told when they launch.',
}

// Public on purpose: the assessments are not built yet, so this page is only a
// "coming soon" notice plus a notify-me form. Anyone must be able to join the
// waitlist. When real assessment tools ship, gate THOSE (e.g. a member-only
// section using requireAccess / hasAccess with 'resources_assessments') and
// keep the notify form public.
export default function AssessmentsPage() {
  return <AssessmentsContent />
}
