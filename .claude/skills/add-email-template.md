---
name: add-email-template
description: Create a new transactional email template using React Email and Resend. Use when any new automated email is needed — order confirmations, booking confirmations, membership renewals, welcome emails, cart abandonment. Always build mobile-first and test rendering before shipping.
allowed-tools: Bash, Read, Write, Edit, Glob, Grep
---

# Add Email Template

## Goal
Create a production-ready transactional email template using React Email that renders correctly across all major email clients and delivers via Resend.

## Inputs
- Email name and purpose
- Trigger event (what causes this email to send)
- Recipient (customer, member, admin)
- Dynamic data needed (name, order details, booking time, etc.)
- Brand requirements (use Suzanne's colours and tone)

## Key References
- React Email docs: https://react.email/docs
- React Email components: https://react.email/docs/components/html
- Resend docs: https://resend.com/docs
- Resend sending email: https://resend.com/docs/send-with-nextjs
- Email preview: https://react.email/docs/cli#email-preview

## Project Structure
- Email templates: `packages/ui/emails/`
- Email sending service: `apps/web/src/lib/email/send.ts`
- Email preview server: run `npx react-email dev` in `packages/ui/`

## Brand Guidelines for All Emails
- Primary colour: use CLAUDE.md design tokens
- Font: Arial or system sans-serif — never web fonts in email
- Logo: include at top of every email
- Tone: warm, professional, encouraging — matches Suzanne's coaching voice
- Footer: always include unsubscribe link, physical address, Ai Dynamic Advisory credit
- Mobile-first: single column layout always

## Process

### Step 1 — Check existing templates
```bash
ls packages/ui/emails/
```
Read one existing template to understand the pattern before creating a new one.

### Step 2 — Create the template file
File: `packages/ui/emails/{email-name}.tsx`
```typescript
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components"

interface {EmailName}Props {
  // define all dynamic props
  recipientName: string
  // add other props
}

export function {EmailName}Email({
  recipientName,
  // other props
}: {EmailName}Props) {
  return (
    <Html>
      <Head />
      <Preview>{One line preview text — shown in email client inbox}</Preview>
      <Body style={main}>
        <Container style={container}>

          {/* Logo */}
          <Img
            src="https://suzanneravenall.com/logo.png"
            width="150"
            height="auto"
            alt="Dr. Suzanne Ravenall"
            style={logo}
          />

          <Heading style={heading}>
            {Email heading}
          </Heading>

          <Text style={paragraph}>
            Hi {recipientName},
          </Text>

          {/* Main content */}
          <Text style={paragraph}>
            {Email body content}
          </Text>

          {/* CTA Button */}
          <Button style={button} href="{action URL}">
            {Button text}
          </Button>

          <Hr style={hr} />

          {/* Footer */}
          <Text style={footer}>
            Dr. Suzanne Ravenall | effectivenesscompany.com
            <br />
            <Link href="{unsubscribe URL}" style={footerLink}>
              Unsubscribe
            </Link>
            {" · "}
            <Link href="https://suzanneravenall.com/privacy" style={footerLink}>
              Privacy Policy
            </Link>
          </Text>

          <Text style={footerCredit}>
            Powered by Vibe Marketing · Ai Dynamic Advisory
          </Text>

        </Container>
      </Body>
    </Html>
  )
}

export default {EmailName}Email

// Styles — inline always for email client compatibility
const main = {
  backgroundColor: "#f6f9fc",
  fontFamily: "Arial, sans-serif",
}

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
  maxWidth: "600px",
}

const logo = {
  margin: "0 auto",
  display: "block",
  padding: "20px 0",
}

const heading = {
  fontSize: "24px",
  letterSpacing: "-0.5px",
  lineHeight: "1.3",
  fontWeight: "700",
  color: "#1A3A5C",
  padding: "17px 0 0",
}

const paragraph = {
  margin: "0 0 15px",
  fontSize: "15px",
  lineHeight: "1.6",
  color: "#3c4149",
}

const button = {
  backgroundColor: "#E8733A",
  borderRadius: "4px",
  color: "#fff",
  fontSize: "15px",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  padding: "12px",
  margin: "24px 0",
}

const hr = {
  borderColor: "#dfe1e4",
  margin: "32px 0 24px",
}

const footer = {
  color: "#9ba1a6",
  fontSize: "13px",
  lineHeight: "1.5",
  textAlign: "center" as const,
}

const footerLink = {
  color: "#9ba1a6",
  textDecoration: "underline",
}

const footerCredit = {
  color: "#c8cbce",
  fontSize: "11px",
  textAlign: "center" as const,
  marginTop: "8px",
}
```

### Step 3 — Preview the template
```bash
cd packages/ui && npx react-email dev
```
Open http://localhost:3000 and check rendering. Verify:
- Mobile layout (375px) looks correct
- All dynamic props render correctly
- CTA button is tappable size on mobile
- Preview text shows correctly

### Step 4 — Add sending function
File: `apps/web/src/lib/email/send.ts`
```typescript
import { Resend } from "resend"
import { {EmailName}Email } from "@suzanne/ui/emails/{email-name}"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function send{EmailName}Email(
  to: string,
  props: {EmailName}Props
): Promise<void> {
  await resend.emails.send({
    from: "Dr. Suzanne Ravenall <hello@suzanneravenall.com>",
    to,
    subject: "{Email subject line}",
    react: {EmailName}Email(props),
  })
}
```

### Step 5 — Add to email index
Export from `apps/web/src/lib/email/index.ts`

### Step 6 — Spawn code-reviewer
Ask code-reviewer to review the template and sending function.

### Step 7 — Spawn qa-unit
Ask qa-unit to test the sending function — mock Resend API calls.

## Email Templates This Project Needs
Build these in this order:
1. `order-confirmation` — Triggered by Medusa order placed
2. `booking-confirmation` — Triggered by Cal.com booking created
3. `membership-welcome` — Triggered by first membership purchase
4. `membership-renewal-reminder` — Triggered by n8n 7 days before expiry
5. `membership-expired` — Triggered by n8n on expiry date
6. `cart-abandonment-1` — 1 hour after cart abandoned
7. `cart-abandonment-2` — 24 hours after cart abandoned
8. `cart-abandonment-3` — 72 hours after cart abandoned
9. `password-reset` — Triggered by Supabase Auth
10. `admin-new-member` — Alert to Suzanne when new member joins

## Rules
- Never use web fonts — Arial and system fonts only
- Always inline all styles — email clients strip head styles
- Always include unsubscribe link in footer — legal requirement
- Single column layout always — multi-column breaks on mobile
- Test at 375px, 600px widths minimum before shipping
- Preview text must be set on every email — shown in inbox before opening
- From address must always be hello@suzanneravenall.com
- Never hardcode URLs — use environment variables for base URL

## Output Format
Always report:
- Template name and trigger event
- Dynamic props required
- Preview tested at mobile and desktop widths
- Sending function location
- Any environment variables required
