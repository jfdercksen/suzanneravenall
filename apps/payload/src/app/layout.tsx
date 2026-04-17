import React from 'react'

export const metadata = {
  title: 'Suzanne Ravenall CMS',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
