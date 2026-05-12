import { cookies } from 'next/headers'
import type { Metadata } from 'next'
import { createClient } from '@/utils/supabase/server'
import { requireAccess } from '@/lib/access/check-access'
import AssessmentsContent from './AssessmentsContent'

export const metadata: Metadata = {
  title: 'Assessments | Dr. Suzanne Ravenall',
  description: 'Self-assessment tools for transformation. Silver membership required.',
}

export default async function AssessmentsPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  await requireAccess(supabase, 'resources_assessments', '/resources/assessments')

  return <AssessmentsContent />
}
