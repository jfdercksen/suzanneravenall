import type { Metadata } from 'next'
import { StaffGate } from '@/components/staff/StaffGate'
import { StaffHeader } from '@/components/staff/StaffHeader'
import { StaffSection } from '@/components/staff/StaffSection'
import { logError } from '@/lib/log'
import { getServiceRoleClient } from '@/lib/quiz/subscriber'
import { currentStaffAccess } from '@/lib/staff/current'
import { formatSast } from '@/lib/staff/present'
import { levelOf, STATUS_LABEL, staffApplications, type NoviceApplication } from '@/lib/novice/applications'

/**
 * /staff/novice (Suzanne, 19 Nov 2026): Novice applications for the team.
 * Sent applications first (oldest first), then those still waiting on the
 * member. Staff role only, the same CMS login as /staff/submissions (KI125).
 * Plain anchors between staff pages, as there (full loads, no analytics).
 */
export const metadata: Metadata = {
  title: 'Novice applications',
  robots: { index: false, follow: false },
  // same-origin, not no-referrer: no referrer leaves for another site, and the
  // browser still sends this site's Origin on the Approve form post. Under
  // no-referrer it sends Origin: null and the decision route refused every
  // approval with 403 (KI138, 24 Nov 2026).
  referrer: 'same-origin',
}

export const dynamic = 'force-dynamic'

export default async function StaffNoviceList() {
  const access = await currentStaffAccess()
  if (access.status !== 'allowed') {
    return (
      <StaffSection>
        <StaffHeader title="Novice applications" />
        <StaffGate access={access} />
      </StaffSection>
    )
  }

  const supabase = getServiceRoleClient()
  let rows: NoviceApplication[] | null = null
  if (supabase) {
    try {
      rows = await staffApplications(supabase)
    } catch (error) {
      logError('[staff/novice] list failed', error)
    }
  }

  return (
    <StaffSection>
      <StaffHeader title="Novice applications" viewer={access.viewer} />
      {rows === null ? (
        <p className="text-brand-ink">The applications cannot be shown right now.</p>
      ) : rows.length === 0 ? (
        <p className="text-brand-ink">No open Novice applications.</p>
      ) : (
        <ul className="divide-y divide-brand-border border-y border-brand-border">
          {rows.map((row) => (
            <li key={row.id}>
              <a href={`/staff/novice/${row.id}`} className="block py-4 transition-all duration-300 hover:bg-brand-sand">
                <span className="block font-medium text-brand-ink">{row.first_name ? `${row.first_name} (${row.email})` : row.email}</span>
                <span className="block text-sm text-brand-muted">
                  {STATUS_LABEL[row.status]} · {levelOf(row)?.title ?? row.sku} · {row.files.length} file(s)
                  {row.submitted_at ? ` · sent ${formatSast(row.submitted_at)}` : ` · opened ${formatSast(row.created_at)}`}
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </StaffSection>
  )
}
