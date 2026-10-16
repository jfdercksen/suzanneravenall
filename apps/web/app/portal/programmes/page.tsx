import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { fetchMemberProgrammes, type ProgrammeItem } from '@/lib/medusa/member-programmes'
import ProgrammesContent from './ProgrammesContent'

export const metadata = {
  title: 'My Programmes | Member Portal',
}

export type { ProgrammeItem }

export default async function ProgrammesPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/portal/login?redirect=/portal/programmes')
  }

  // Only a confirmed address proves ownership of the orders placed with it.
  const programmes =
    user.email && user.email_confirmed_at ? await fetchMemberProgrammes(user.email) : []

  return <ProgrammesContent programmes={programmes} />
}
