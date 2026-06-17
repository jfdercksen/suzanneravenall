import { redirect } from 'next/navigation'

// The Private Sessions hub lives on the main Services page. This route exists
// so /services/private-sessions does not 404 (and so deep links / old WP URLs
// resolve) — it immediately redirects to the Private Sessions section.
export default function PrivateSessionsHubPage() {
  redirect('/services#private')
}
