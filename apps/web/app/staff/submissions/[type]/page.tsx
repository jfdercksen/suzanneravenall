import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { quizBySlug } from '@/app/explore/quizzes'
import { StaffGate } from '@/components/staff/StaffGate'
import { StaffHeader } from '@/components/staff/StaffHeader'
import { StaffSection } from '@/components/staff/StaffSection'
import { logError } from '@/lib/log'
import { getServiceRoleClient } from '@/lib/quiz/subscriber'
import { currentStaffAccess } from '@/lib/staff/current'
import { formatSast, personName } from '@/lib/staff/present'
import {
  PAGE_SIZE,
  isSubmissionType,
  listSubmissions,
  pageNumber,
  type IntakeListRow,
  type QuizListRow,
  type SubmissionList,
  type SubmissionType,
} from '@/lib/staff/submissions'

/**
 * /staff/submissions/quiz and /staff/submissions/intake (KI125): completed
 * submissions, newest first, searchable by name or email. Staff role only
 * (the CMS login). Read only: no export, edit or delete. The list shows no
 * answers, so opening it is not logged; opening one submission is.
 *
 * Links between staff pages are plain anchors on purpose, not next/link: every
 * view is then a full page load, where the analytics sanitiser (lib/analytics.ts)
 * drops the id and the search, and CookieConsent never starts Clarity. A
 * client-side navigation would send GA the raw URL as a history page_view.
 */
export const metadata: Metadata = {
  title: 'Submissions',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
}

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ type: string }>
  searchParams: Promise<{ q?: string; page?: string }>
}

const TAB_LABEL: Record<SubmissionType, string> = { quiz: 'Diagnostics (quiz)', intake: 'Intake forms' }

interface ListItem {
  id: string
  name: string
  email: string
  what: string
  completed: string
}

function quizItem(row: QuizListRow): ListItem {
  return {
    id: row.id,
    name: personName(row.first_name, row.last_name, row.email),
    email: row.email,
    what: quizBySlug(row.quiz_slug)?.title ?? row.quiz_slug,
    completed: formatSast(row.completed_at),
  }
}

function intakeItem(row: IntakeListRow): ListItem {
  return {
    id: row.id,
    name: personName(row.first_name, row.last_name, row.customer_email),
    email: row.customer_email,
    what: `${row.service_name}, order ${row.order_display_id ? `#${row.order_display_id}` : row.order_id}`,
    completed: formatSast(row.completed_at),
  }
}

function pageHref(type: SubmissionType, q: string, page: number): string {
  const params = new URLSearchParams()
  if (q) params.set('q', q)
  if (page > 1) params.set('page', String(page))
  const query = params.toString()
  return `/staff/submissions/${type}${query ? `?${query}` : ''}`
}

export default async function StaffSubmissionsList({ params, searchParams }: PageProps) {
  const { type } = await params
  if (!isSubmissionType(type)) notFound()
  const { q: rawQ, page: rawPage } = await searchParams
  const q = (rawQ ?? '').slice(0, 100)
  const page = pageNumber(rawPage)

  const access = await currentStaffAccess()
  if (access.status !== 'allowed') {
    return (
      <StaffSection>
        <StaffHeader title="Submissions" />
        <StaffGate access={access} />
      </StaffSection>
    )
  }

  const supabase = getServiceRoleClient()
  let list: SubmissionList<QuizListRow | IntakeListRow> | null = null
  if (supabase) {
    try {
      list = await listSubmissions(supabase, type, q, page)
    } catch (error) {
      logError('[staff/submissions] list failed', error, { type })
    }
  } else {
    logError('[staff/submissions] Supabase service-role client is not configured')
  }

  const items: ListItem[] = list
    ? type === 'quiz'
      ? (list.rows as QuizListRow[]).map(quizItem)
      : (list.rows as IntakeListRow[]).map(intakeItem)
    : []
  const lastPage = list ? Math.max(1, Math.ceil(list.total / PAGE_SIZE)) : 1

  return (
    <StaffSection>
      <StaffHeader title="Submissions" viewer={access.viewer} />

      <nav aria-label="Submission type" className="flex flex-wrap gap-2 mb-6">
        {(['quiz', 'intake'] as const).map((tab) => (
          <a
            key={tab}
            href={`/staff/submissions/${tab}`}
            aria-current={tab === type ? 'page' : undefined}
            className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
              tab === type
                ? 'bg-brand-accent-600 text-white'
                : 'bg-white text-brand-ink border border-brand-border hover:border-brand-primary-300'
            }`}
          >
            {TAB_LABEL[tab]}
          </a>
        ))}
      </nav>

      <form method="get" action={`/staff/submissions/${type}`} role="search" className="flex flex-col sm:flex-row gap-3 mb-8">
        <label htmlFor="staff-search" className="sr-only">
          Search by name or email
        </label>
        <input
          id="staff-search"
          name="q"
          type="search"
          defaultValue={q}
          maxLength={100}
          placeholder="Search by name or email"
          className="flex-1 px-4 py-3 rounded-full border border-brand-border bg-white text-sm text-brand-ink placeholder:text-brand-muted"
        />
        <button
          type="submit"
          className="px-6 py-3 rounded-full text-sm font-medium bg-brand-accent-600 text-white transition-all duration-300 hover:bg-brand-accent-700"
        >
          Search
        </button>
      </form>

      {!list ? (
        <p className="text-base leading-relaxed text-brand-ink">
          The submissions could not be loaded just now. Please try again in a minute.
        </p>
      ) : items.length === 0 ? (
        <p className="text-base leading-relaxed text-brand-ink">
          {q ? `No completed submissions match "${q}".` : 'No completed submissions yet.'}
        </p>
      ) : (
        <>
          <p className="mb-4 text-sm text-brand-muted">
            {list.total} completed, newest first{q ? `, matching "${q}"` : ''}.
          </p>
          <ul className="divide-y divide-brand-border bg-white border border-brand-border rounded-card">
            {items.map((item) => (
              <li key={item.id}>
                <a
                  href={`/staff/submissions/${type}/${item.id}`}
                  className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 px-5 py-4 transition-all duration-300 hover:bg-brand-sand"
                >
                  <span>
                    <span className="block text-base font-medium text-brand-ink">{item.name}</span>
                    <span className="block text-sm text-brand-muted">
                      {item.email} &middot; {item.what}
                    </span>
                  </span>
                  <span className="text-sm text-brand-muted whitespace-nowrap">{item.completed}</span>
                </a>
              </li>
            ))}
          </ul>
          {lastPage > 1 && (
            <nav aria-label="Pages" className="flex items-center justify-between mt-6 text-sm text-brand-ink">
              {page > 1 ? (
                <a href={pageHref(type, q, page - 1)} className="underline underline-offset-2">
                  Newer
                </a>
              ) : (
                <span />
              )}
              <span className="text-brand-muted">
                Page {page} of {lastPage}
              </span>
              {page < lastPage ? (
                <a href={pageHref(type, q, page + 1)} className="underline underline-offset-2">
                  Older
                </a>
              ) : (
                <span />
              )}
            </nav>
          )}
        </>
      )}
    </StaffSection>
  )
}
