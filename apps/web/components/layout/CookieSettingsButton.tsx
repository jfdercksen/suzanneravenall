'use client'

import { openCookieSettings } from './CookieConsent'

interface CookieSettingsButtonProps {
  className?: string
  children?: React.ReactNode
}

/** Reopens the cookie consent banner so a visitor can change their choice (site check M10). */
export default function CookieSettingsButton({
  className,
  children = 'Cookie settings',
}: CookieSettingsButtonProps) {
  return (
    <button type="button" onClick={openCookieSettings} className={className}>
      {children}
    </button>
  )
}
