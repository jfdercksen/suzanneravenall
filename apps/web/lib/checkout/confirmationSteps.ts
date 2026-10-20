import type { OrderProductType } from '@/lib/email/types'

/**
 * "What happens next" on the confirmation page, one branch per product type,
 * the same branches as the order mail's next steps (emails/OrderConfirmation
 * getNextSteps). The mail can say "above"; the page points at the mail.
 * KI065 and KI044: the page used to print one paragraph for every order.
 */
export function confirmationNextSteps(productType: OrderProductType | null): string {
  switch (productType) {
    case 'session':
      return 'Book your session with the button below or the link in your confirmation email. Choose a time that suits you, and bring any questions or intentions you want to explore.'
    case 'self-paced':
      return 'Watch for your course access email from Ravenall Institute: it has your login for the course platform. Then work through the materials at your own pace.'
    case 'live':
      return 'Your joining instructions and Zoom details are emailed to you 48 hours before your first session.'
    case 'live-course':
      return 'Watch for your course access email from Ravenall Institute with your login for the programme materials. Joining instructions and Zoom details for the live sessions follow 48 hours before your first session.'
    case 'group':
      return 'Your Zoom link is emailed to you 24 hours before the session. Sessions are recorded, and the recording link follows afterwards.'
    case 'download':
      return 'Your download links are in your confirmation email. Save the files to your device: the links stop working after a while.'
    case 'mentorship':
      return 'Mentorship runs on the last Wednesday of every month at 4pm South African time. There is nothing to book: we will email you closer to the time with the joining details.'
    default:
      return 'Your confirmation email has the details of your order. If anything is unclear, email sravenall@suzanneravenall.com and we will help.'
  }
}
