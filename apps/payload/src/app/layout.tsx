import React from 'react'

export const metadata = {
  title: 'Suzanne Ravenall CMS',
}

// Pass-through root layout. The (payload) route group provides the real
// <html>/<body> via Payload's RootLayout. Rendering <html>/<body> here too
// produced nested <html> tags, which broke React hydration (error #418).
// The only root-level page (page.tsx) just redirects, so it never needs
// an <html>/<body> from this layout.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children
}
