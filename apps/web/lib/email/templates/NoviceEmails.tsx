import { Body, Button, Container, Head, Heading, Html, Preview, Section, Text } from '@react-email/components'
import type { ReactNode } from 'react'

/**
 * The Novice application emails (Suzanne, 19 Nov 2026): what to upload after
 * paying, the team's request for more, and the team's notice that an
 * application is waiting. Approval sends the ordinary membership welcome.
 * The member's files are never attached or linked from email: they stay in
 * private Storage, behind the portal and staff logins.
 */

const INK = '#0A0A0A'
const MUTED = '#696969'
const SAND = '#F6F6F7'

const shell = (preview: string, children: ReactNode) => (
  <Html lang="en">
    <Head />
    <Preview>{preview}</Preview>
    <Body style={{ backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif', margin: 0, padding: 0 }}>
      <Container style={{ maxWidth: '600px', margin: '0 auto', padding: '32px 32px 24px' }}>{children}</Container>
    </Body>
  </Html>
)

const p = { color: INK, fontSize: '15px', lineHeight: '1.7', margin: '0 0 16px' }

const button = (href: string, label: string) => (
  <Section style={{ margin: '8px 0 24px' }}>
    <Button
      href={href}
      style={{ backgroundColor: '#171717', color: '#ffffff', fontSize: '15px', fontWeight: '700', padding: '14px 32px', borderRadius: '4px', textDecoration: 'none', display: 'inline-block' }}
    >
      {label}
    </Button>
  </Section>
)

export interface NoviceDocumentsProps {
  firstName: string | null
  levelTitle: string
  status: string
  items: string[]
  uploadUrl: string
  pathwayUrl: string
}

export function NoviceDocuments({ firstName, levelTitle, status, items, uploadUrl, pathwayUrl }: NoviceDocumentsProps) {
  return shell(
    `What to upload for your ${status} status`,
    <>
      <Heading as="h1" style={{ color: INK, fontSize: '24px', fontWeight: '400', margin: '0 0 20px' }}>
        {firstName ? `Thank you, ${firstName}` : 'Thank you'}
      </Heading>
      <Text style={p}>
        We have your payment for the {levelTitle}. Your Novice access starts once your team has checked your documents and
        recordings and approved them.
      </Text>
      <Text style={p}>Please upload the following in your member portal:</Text>
      <Section style={{ backgroundColor: SAND, borderRadius: '4px', padding: '16px 24px', marginBottom: '16px' }}>
        {items.map((item, i) => (
          <Text key={item} style={{ color: INK, fontSize: '14px', lineHeight: '1.6', margin: '0 0 8px' }}>
            {i + 1}. {item}
          </Text>
        ))}
      </Section>
      <Text style={p}>
        The full steps are in the{' '}
        <a href={pathwayUrl} style={{ color: INK }}>
          Career &amp; Certification Pathway
        </a>
        . When everything is uploaded, press Send to your team. Feedback is usually given within 15 working days.
      </Text>
      {button(uploadUrl, 'Upload your documents')}
      <Text style={{ ...p, color: MUTED, fontSize: '13px' }}>Log in with the email address you used to pay. Reply to this email if you need help.</Text>
    </>,
  )
}

export interface NoviceChangesRequestedProps {
  firstName: string | null
  levelTitle: string
  note: string
  uploadUrl: string
}

export function NoviceChangesRequested({ firstName, levelTitle, note, uploadUrl }: NoviceChangesRequestedProps) {
  return shell(
    'Your team has feedback on your Novice application',
    <>
      <Heading as="h1" style={{ color: INK, fontSize: '24px', fontWeight: '400', margin: '0 0 20px' }}>
        {firstName ? `Hello ${firstName}` : 'Hello'}
      </Heading>
      <Text style={p}>Your team has looked at your application for the {levelTitle} and needs a little more from you:</Text>
      <Section style={{ backgroundColor: SAND, borderRadius: '4px', padding: '16px 24px', marginBottom: '16px' }}>
        {note.split(/\n+/).map((line, i) => (
          <Text key={i} style={{ color: INK, fontSize: '14px', lineHeight: '1.6', margin: '0 0 8px' }}>
            {line}
          </Text>
        ))}
      </Section>
      <Text style={p}>Add what is needed in your member portal, then press Send to your team again.</Text>
      {button(uploadUrl, 'Go to your application')}
    </>,
  )
}

export interface NoviceSubmittedTeamProps {
  memberName: string
  memberEmail: string
  levelTitle: string
  fileCount: number
  reviewUrl: string
}

export function NoviceSubmittedTeam({ memberName, memberEmail, levelTitle, fileCount, reviewUrl }: NoviceSubmittedTeamProps) {
  return shell(
    `Novice application from ${memberName}`,
    <>
      <Heading as="h1" style={{ color: INK, fontSize: '22px', fontWeight: '400', margin: '0 0 16px' }}>
        Novice application to review
      </Heading>
      <Section style={{ backgroundColor: SAND, borderRadius: '4px', padding: '16px 20px', marginBottom: '16px' }}>
        {[
          ['Member', memberName],
          ['Email', memberEmail],
          ['Level', levelTitle],
          ['Files', String(fileCount)],
        ].map(([k, v]) => (
          <Text key={k} style={{ color: INK, fontSize: '14px', margin: '0 0 4px' }}>
            <strong>{k}:</strong> {v}
          </Text>
        ))}
      </Section>
      <Text style={p}>The files are not in this email. Open the application on the staff page (log in with your staff CMS account).</Text>
      {button(reviewUrl, 'Review the application')}
    </>,
  )
}
