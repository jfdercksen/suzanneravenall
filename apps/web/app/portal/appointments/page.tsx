import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { loadMemberAppointments } from '@/lib/portal/load-appointments'
import AppointmentsContent from './AppointmentsContent'

export const metadata = {
  title: 'My Appointments | Member Portal',
}

export default async function AppointmentsPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/portal/login?redirect=/portal/appointments')
  }

  const appointments = await loadMemberAppointments(supabase, user)

  return <AppointmentsContent {...appointments} />
}
