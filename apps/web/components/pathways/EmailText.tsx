import { CERTIFICATION_EMAIL, MEMBER_SUPPORT_EMAIL } from '@/data/certificationPathways'

const EMAILS = [MEMBER_SUPPORT_EMAIL, CERTIFICATION_EMAIL]
const SPLIT = new RegExp(`(${EMAILS.map((e) => e.replace(/[.]/g, '\\.')).join('|')})`)

/** Text from a pathway document, with the Institute's two addresses as mailto links. */
export function EmailText({ text }: { text: string }) {
  return (
    <>
      {text.split(SPLIT).map((part, i) =>
        EMAILS.includes(part) ? (
          <a
            key={i}
            href={`mailto:${part}`}
            className="underline underline-offset-4 decoration-brand-border hover:decoration-brand-ink transition-colors duration-300 break-words"
          >
            {part}
          </a>
        ) : (
          part
        ),
      )}
    </>
  )
}
