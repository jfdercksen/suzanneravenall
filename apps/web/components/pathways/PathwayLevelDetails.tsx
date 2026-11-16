import type { PathwayItem, PathwayLevel } from '@/data/certificationPathways/types'
import { EmailText } from '@/components/pathways/EmailText'

function Item({ item }: { item: PathwayItem }) {
  return (
    <li className="pl-1">
      <EmailText text={item.text} />
      {item.sub && (
        <ul className="list-disc pl-5 mt-2 space-y-1.5 text-brand-muted">
          {item.sub.map((s) => (
            <li key={s}>
              <EmailText text={s} />
            </li>
          ))}
        </ul>
      )}
      {item.after?.map((a) => (
        <p key={a} className="mt-2">
          <EmailText text={a} />
        </p>
      ))}
    </li>
  )
}

/**
 * One level of a pathway, collapsible (native details: the whole text is in
 * the page for search and screen readers whether it is open or closed).
 * Part B is numbered because its items refer to each other ("points 2 and 3 above").
 */
export function PathwayLevelDetails({ level }: { level: PathwayLevel }) {
  return (
    <details id={`level-${level.level}`} className="group bg-white border border-brand-border rounded-card scroll-mt-24">
      <summary className="flex items-start justify-between gap-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden p-6 lg:p-8 rounded-card focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-ink">
        <span>
          <span className="block text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-2">Level {level.level}</span>
          <span className="block text-2xl font-medium tracking-tight text-brand-ink">{level.status}</span>
          <span className="block text-sm text-brand-muted mt-1">{level.heading}</span>
        </span>
        <span aria-hidden="true" className="mt-1 text-2xl leading-none text-brand-muted transition-transform duration-300 group-open:rotate-45">
          +
        </span>
      </summary>
      <div className="px-6 pb-8 lg:px-8 text-sm sm:text-base text-brand-ink leading-relaxed space-y-8 border-t border-brand-border pt-6">
        <div className="space-y-3">
          <h3 className="text-lg font-medium text-brand-ink">{level.stepsHeading}</h3>
          {level.intro.map((line) =>
            typeof line === 'string' ? (
              <p key={line}>
                <EmailText text={line} />
              </p>
            ) : (
              <div key={line.text}>
                <p>
                  <EmailText text={line.text} />
                </p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  {line.sub.map((s) => (
                    <li key={s}>
                      <EmailText text={s} />
                    </li>
                  ))}
                </ul>
              </div>
            ),
          )}
        </div>
        {level.parts.map((part) => {
          const List = part.key === 'B' ? 'ol' : 'ul'
          return (
            <div key={part.key}>
              <h4 className="text-base font-medium text-brand-ink mb-3">
                {part.key}. {part.heading}
              </h4>
              <List className={`${part.key === 'B' ? 'list-decimal' : 'list-disc'} pl-5 space-y-2.5`}>
                {part.items.map((item, i) => (
                  <Item key={`${i}-${item.text}`} item={item} />
                ))}
              </List>
            </div>
          )
        })}
      </div>
    </details>
  )
}
