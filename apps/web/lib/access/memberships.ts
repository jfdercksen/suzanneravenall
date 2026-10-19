/**
 * Are memberships on sale? OFF for launch (Johan, 19 Oct 2026).
 *
 * The 29 seeded membership products are unpublished drafts (KI071) and the
 * portal's Silver / Gold / Practitioner names do not match the seeded tiers
 * (KI072), so until the product model is decided the portal sells no
 * membership: /portal/upgrade answers with the 404 page, no upgrade prompt or
 * tier name renders, and locked items are left out instead of shown behind
 * an "Unlock with Silver" link. With MEMBERSHIPS_ENABLED=true everything is
 * as before.
 *
 * Server-only and read at request time (not NEXT_PUBLIC_, which is baked into
 * the bundle at build), so switching it on is an env change and a container
 * recreate, not a rebuild. Server pages pass the answer to client components
 * as a prop.
 */
export function membershipsEnabled(env: Record<string, string | undefined> = process.env): boolean {
  return env.MEMBERSHIPS_ENABLED === 'true'
}
