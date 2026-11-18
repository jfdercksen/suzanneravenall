import { redirect } from 'next/navigation'

/** /staff/submissions opens the quiz tab. */
export default function StaffSubmissionsIndex() {
  redirect('/staff/submissions/quiz')
}
