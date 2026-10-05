import type { MetadataRoute } from 'next'

// Web app manifest (site check M3). Served at /manifest.webmanifest and linked
// from every page by Next. The icons are Suzanne's signature (public/logos/
// Favicon.png) squared onto its own white ground.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Dr. Suzanne Ravenall',
    short_name: 'Suzanne Ravenall',
    description:
      'Break the childhood patterns holding you back. Dr. Suzanne Ravenall delivers permanent, measurable transformation through science-backed Neuro-Repatterning® coaching.',
    start_url: '/',
    display: 'browser',
    background_color: '#ffffff',
    theme_color: '#ffffff',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  }
}
