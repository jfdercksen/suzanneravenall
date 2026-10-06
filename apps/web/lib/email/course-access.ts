import { createElement } from 'react'
import { sendEmail } from './send'
import CourseAccess, { THINKIFIC_COURSES_URL } from './templates/CourseAccess'

/**
 * The buyer's "course access is ready" mail, called by Medusa (via
 * POST /api/email/course-access) after a Thinkific enrolment. Moved out of
 * the n8n workflow (medusa-thinkific-enrollment.json): same subject, same
 * reply-to, same text; sender is the site default (EMAIL_FROM_ADDRESS, which
 * defaults to the n8n mail's "Dr Suzanne Ravenall <hello@...>").
 *
 * Transactional (it confirms a purchase), so no unsubscribe link, like the
 * order confirmation.
 */

const REPLY_TO = 'sravenall@suzanneravenall.com'

export type CourseAccessEmailData = {
  email: string
  firstName: string
  courses: string[]
}

/** n8n "Prepare: Confirmation Email" subject. */
export function courseAccessSubject(courses: string[]): string {
  return `Your course access is ready - ${courses.join(', ')}`
}

function plainText(data: CourseAccessEmailData, coursesUrl: string): string {
  return [
    'Welcome to the Ravenall Institute!',
    '',
    `Hi ${data.firstName},`,
    '',
    'Your payment was received and your course access has been activated. You can now start learning:',
    ...data.courses.map((c) => `- ${c}`),
    '',
    `Access your courses on Thinkific: ${coursesUrl}`,
    '',
    'You will also receive a separate welcome email from Thinkific for the first course - this may land in your promotions or spam folder, so please check there if you do not see it.',
    '',
    'If you have any questions, reply to this email and we will help you.',
    '',
    'Warm regards,',
    'Dr. Suzanne Ravenall',
  ].join('\n')
}

export async function sendCourseAccessEmail(data: CourseAccessEmailData): Promise<string> {
  const coursesUrl = THINKIFIC_COURSES_URL
  return sendEmail({
    to: [data.email],
    replyTo: REPLY_TO,
    subject: courseAccessSubject(data.courses),
    react: createElement(CourseAccess, { firstName: data.firstName, courses: data.courses, coursesUrl }),
    text: plainText(data, coursesUrl),
  })
}
