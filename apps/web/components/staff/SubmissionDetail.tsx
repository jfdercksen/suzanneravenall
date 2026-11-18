import type { AnswerGroup } from '@/lib/staff/present'

interface SubmissionDetailProps {
  facts: [string, string][]
  groups: AnswerGroup[]
  /** Shown above the answers, e.g. where the question wording comes from. */
  answersNote?: string
}

/** One submission: the record (who, when, consent, marketing) and every answer with its question. */
export function SubmissionDetail({ facts, groups, answersNote }: SubmissionDetailProps) {
  const answered = groups.some((g) => g.items.length > 0)
  return (
    <>
      <dl className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-3 mb-10 p-6 lg:p-8 bg-white border border-brand-border rounded-card text-sm">
        {facts.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-brand-muted">{label}</dt>
            <dd className="sm:col-span-2 text-brand-ink break-words">{value}</dd>
          </div>
        ))}
      </dl>

      <h2 className="mb-2 text-2xl font-medium tracking-tight text-brand-ink">Answers</h2>
      {answersNote && <p className="mb-6 text-sm text-brand-muted">{answersNote}</p>}
      {!answered ? (
        <p className="text-base text-brand-ink">No answers are stored for this submission.</p>
      ) : (
        <div className="space-y-8">
          {groups.map((group, index) => (
            <div key={`${group.section ?? 'answers'}-${index}`} className="p-6 lg:p-8 bg-white border border-brand-border rounded-card">
              {group.section && (
                <h3 className="mb-4 text-xs uppercase tracking-[0.3em] font-medium text-brand-accent">{group.section}</h3>
              )}
              <ol className="space-y-5">
                {group.items.map((item, i) => (
                  <li key={`${item.question}-${i}`}>
                    <p className="text-sm text-brand-muted">{item.question}</p>
                    <p className="mt-1 text-base text-brand-ink whitespace-pre-line break-words">{item.answer}</p>
                    {item.detail && (
                      <p className="mt-1 text-sm text-brand-ink whitespace-pre-line break-words">Detail: {item.detail}</p>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
