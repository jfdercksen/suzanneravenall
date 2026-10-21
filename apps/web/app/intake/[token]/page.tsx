import type { Metadata } from 'next'
import { loadIntakePage } from '@/lib/intake/service'
import { INTAKE_SUPPORT_EMAIL } from '@/lib/email/intake'
import IntakeFormContent from './IntakeFormContent'
import IntakeNotice from './IntakeNotice'

/**
 * /intake/<token>: the client's personal intake form (H-12). The token in the
 * mail is the only key; the form itself comes from the CMS (intake-forms).
 */

export const metadata: Metadata = {
  title: 'Intake form',
  description: 'Your intake form for your session with Dr Suzanne Ravenall.',
  robots: { index: false, follow: false },
  // The token is in the path: never send it to another site as a referrer.
  referrer: 'no-referrer',
}

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ token: string }>
}

export default async function IntakePage({ params }: PageProps) {
  const { token } = await params
  const page = await loadIntakePage(token)

  switch (page.state) {
    case 'open':
      return (
        <IntakeFormContent
          token={token}
          form={page.form}
          serviceName={page.record.service_name}
          firstName={page.record.first_name}
          introduction={page.introduction}
          supportEmail={INTAKE_SUPPORT_EMAIL}
        />
      )
    case 'completed':
      return (
        <IntakeNotice
          title="Thank you, your form is in"
          lines={[
            `We have already received your intake form for ${page.serviceName}. There is nothing more to do here.`,
            'If you would like to add or change something, please write to us.',
          ]}
          supportEmail={INTAKE_SUPPORT_EMAIL}
        />
      )
    case 'expired':
      return (
        <IntakeNotice
          title="This link has expired"
          lines={[
            `The link to your intake form for ${page.serviceName} is no longer open.`,
            'Please write to us and we will send you a new one.',
          ]}
          supportEmail={INTAKE_SUPPORT_EMAIL}
        />
      )
    case 'unavailable':
      return (
        <IntakeNotice
          title="The form cannot be shown right now"
          lines={['Something on our side is not answering. Please try again in a few minutes; your link stays valid.']}
          supportEmail={INTAKE_SUPPORT_EMAIL}
        />
      )
    default:
      return (
        <IntakeNotice
          title="This link is not valid"
          lines={[
            'This intake form link is incomplete or has been changed. Please open it again from the mail we sent you.',
          ]}
          supportEmail={INTAKE_SUPPORT_EMAIL}
        />
      )
  }
}
