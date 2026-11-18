import { cookies } from 'next/headers'
import { checkStaffAccess, PAYLOAD_TOKEN_COOKIE, type StaffAccess } from './payload-session'

/** The staff access of the person making this request (their CMS login cookie). */
export async function currentStaffAccess(): Promise<StaffAccess> {
  const token = (await cookies()).get(PAYLOAD_TOKEN_COOKIE)?.value
  return checkStaffAccess(token)
}
