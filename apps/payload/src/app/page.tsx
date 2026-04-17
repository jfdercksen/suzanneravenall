import { redirect } from 'next/navigation'

// Redirect the root URL to the Payload admin panel
export default function RootPage() {
  redirect('/admin')
}
