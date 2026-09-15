import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-brand-cream px-4 py-24">
      <h1 className="text-4xl lg:text-6xl font-medium tracking-tight text-brand-primary text-center">404</h1>
      <p className="mt-4 text-lg text-brand-muted text-center">This page could not be found.</p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center justify-center rounded-button bg-brand-accent-600 hover:bg-brand-accent-700 px-6 py-3 text-xs sm:text-sm uppercase tracking-widest font-medium text-white transition-all duration-300"
      >
        Go home
      </Link>
    </main>
  )
}
