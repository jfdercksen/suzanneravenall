import { STAFF_LOGOUT_PATH, type StaffViewer } from '@/lib/staff/payload-session'

interface StaffHeaderProps {
  title: string
  viewer?: StaffViewer
}

/** Eyebrow, page title and who is logged in, on every /staff/submissions page. */
export function StaffHeader({ title, viewer }: StaffHeaderProps) {
  return (
    <header className="mb-10">
      <p className="mb-4 text-xs uppercase tracking-[0.3em] font-medium text-brand-accent">Staff</p>
      <h1 className="mb-4 text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight leading-[1.05] text-brand-ink">
        {title}
      </h1>
      {viewer && (
        <p className="text-sm text-brand-muted">
          Logged in as {viewer.name ? `${viewer.name} (${viewer.email})` : viewer.email}. Every submission you open is
          logged.{' '}
          <a href={STAFF_LOGOUT_PATH} className="underline underline-offset-2 text-brand-ink hover:text-brand-primary">
            Log out
          </a>
        </p>
      )}
    </header>
  )
}
