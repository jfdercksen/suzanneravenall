import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import { companyPhysicalAddress } from '../company'

/**
 * "Your course access is ready": sent after a course purchase once the buyer
 * is enrolled in Thinkific (n8n migration step 1). The wording is the n8n
 * workflow's mail (medusa-thinkific-enrollment.json, "Prepare: Confirmation
 * Email"), unchanged; only the layout follows the other transactional mails.
 */

const NAVY = '#012B43'
const BLUE = '#1719F4'
const LIGHT_GRAY = '#F5F7FA'
const MEDIUM_GRAY = '#64748B'
const DARK_TEXT = '#334155'

export const THINKIFIC_COURSES_URL = 'https://ravenallinstitute-9629.thinkific.com/collections'

export interface CourseAccessProps {
  firstName: string
  courses: string[]
  coursesUrl?: string
}

export default function CourseAccess({ firstName, courses, coursesUrl = THINKIFIC_COURSES_URL }: CourseAccessProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{`Your course access is ready - ${courses.join(', ')}`}</Preview>
      <Body style={{ backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif', margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: '600px', margin: '0 auto' }}>
          <Section style={{ backgroundColor: NAVY, padding: '32px 40px 24px' }}>
            <Text style={{ color: '#ffffff', fontSize: '20px', fontWeight: '700', margin: '0 0 4px' }}>
              Dr Suzanne Ravenall
            </Text>
            <Text style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>Ravenall Institute</Text>
          </Section>

          <Section style={{ padding: '40px' }}>
            <Heading
              as="h1"
              style={{ color: NAVY, fontSize: '26px', fontWeight: '300', margin: '0 0 20px', lineHeight: '1.3' }}
            >
              Welcome to the Ravenall Institute!
            </Heading>
            <Text style={{ color: DARK_TEXT, fontSize: '16px', lineHeight: '1.7', margin: '0 0 16px' }}>
              Hi {firstName},
            </Text>
            <Text style={{ color: DARK_TEXT, fontSize: '16px', lineHeight: '1.7', margin: '0 0 16px' }}>
              Your payment was received and your course access has been activated. You can now start learning:
            </Text>

            <Section style={{ backgroundColor: LIGHT_GRAY, borderRadius: '4px', padding: '20px 28px', marginBottom: '28px' }}>
              {courses.map((title) => (
                <Text key={title} style={{ color: DARK_TEXT, fontSize: '15px', margin: '0 0 8px' }}>
                  {`• ${title}`}
                </Text>
              ))}
            </Section>

            <Section style={{ textAlign: 'center', marginBottom: '28px' }}>
              <Button
                href={coursesUrl}
                style={{
                  backgroundColor: BLUE,
                  color: '#ffffff',
                  fontSize: '16px',
                  fontWeight: '700',
                  padding: '16px 40px',
                  borderRadius: '4px',
                  textDecoration: 'none',
                  display: 'inline-block',
                }}
              >
                Access your courses on Thinkific
              </Button>
            </Section>

            <Text style={{ color: DARK_TEXT, fontSize: '15px', lineHeight: '1.7', margin: '0 0 16px' }}>
              You will also receive a separate welcome email from Thinkific for the first course - this may land in
              your promotions or spam folder, so please check there if you do not see it.
            </Text>
            <Text style={{ color: DARK_TEXT, fontSize: '15px', lineHeight: '1.7', margin: '0 0 16px' }}>
              If you have any questions, reply to this email and we will help you.
            </Text>

            <Hr style={{ borderColor: '#e2e8f0', margin: '24px 0' }} />

            <Text style={{ color: DARK_TEXT, fontSize: '15px', margin: 0 }}>
              Warm regards,
              <br />
              <strong>Dr. Suzanne Ravenall</strong>
            </Text>
          </Section>

          <Section style={{ backgroundColor: LIGHT_GRAY, padding: '24px 40px', borderTop: '1px solid #e2e8f0' }}>
            <Text style={{ color: MEDIUM_GRAY, fontSize: '12px', margin: 0 }}>
              Ravenall Institute · {companyPhysicalAddress()}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}
