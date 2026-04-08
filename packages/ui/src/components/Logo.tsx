import type React from 'react'
import Image from 'next/image'

// SVG logos received from Suzanne Ravenall (April 2026).
// Files are served from apps/web/public/logos/.

interface LogoProps {
  /**
   * 'white' — white logo for dark backgrounds (nav, hero, footer).
   * 'black' — black logo for light backgrounds.
   * 'auto'  — defaults to 'white'. Use an explicit variant when the background
   *            is known to avoid rendering the wrong contrast version.
   */
  variant?: 'white' | 'black' | 'auto'
  width?: number
  height?: number
  className?: string
  /** Set true when the logo is the Largest Contentful Paint element (e.g. in the nav above the fold) */
  priority?: boolean
}

const Logo: React.FC<LogoProps> = ({
  variant = 'white',
  width = 180,
  height = 60,
  className,
  priority = false,
}) => {
  const resolvedVariant = variant === 'auto' ? 'white' : variant
  const src =
    resolvedVariant === 'white'
      ? '/logos/logo-white.svg'
      : '/logos/logo-black.svg'

  return (
    <Image
      src={src}
      alt="Dr. Suzanne Ravenall"
      width={width}
      height={height}
      className={className}
      priority={priority}
      unoptimized
    />
  )
}

export default Logo
