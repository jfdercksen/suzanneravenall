import React from 'react'

export const metadata = {
  title: 'Suzanne Ravenall CMS',
}

// Minimal root layout required by Next.js.
// Payload admin routes use (payload)/layout.tsx which provides the full
// RootLayout with providers. This wrapper just satisfies Next.js requirements.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
