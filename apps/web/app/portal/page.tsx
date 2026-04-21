'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/utils/supabase/client'

export default function PortalPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <main className="w-full bg-brand-primary min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-accent border-t-transparent rounded-full animate-spin" />
      </main>
    )
  }

  if (!user) {
    return (
      <main className="w-full bg-brand-primary min-h-screen flex items-center justify-center py-32">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="max-w-md w-full mx-4 bg-gray-900 rounded-2xl p-10 text-center"
        >
          <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-6">
            Member Portal
          </p>
          <h1 className="text-3xl font-light text-white mb-4">
            Members Only
          </h1>
          <p className="text-white/60 mb-8">
            Please log in to access the member portal.
          </p>
          <Link
            href="/portal/login"
            className="inline-flex items-center justify-center w-full px-8 py-4 bg-brand-accent-600 hover:bg-brand-accent-700 text-white font-semibold rounded-xl transition-colors duration-300"
          >
            Log In
          </Link>
          <p className="mt-6 text-white/40 text-sm">
            Don&apos;t have an account?{' '}
            <Link href="/portal/signup" className="text-brand-accent hover:underline">
              Sign up
            </Link>
          </p>
        </motion.div>
      </main>
    )
  }

  return (
    <main className="w-full bg-brand-primary min-h-screen py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl"
        >
          <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-6">
            Member Portal
          </p>
          <h1 className="text-4xl md:text-6xl font-light text-white mb-4">
            Welcome back
            {user.user_metadata?.full_name
              ? `, ${user.user_metadata.full_name as string}`
              : ''}
          </h1>
          <p className="text-xl text-white/70 leading-relaxed mb-12">
            Your portal is coming in Phase 3. Member resources, videos, and
            community access will be available here.
          </p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Link
              href="/programs"
              className="inline-flex items-center justify-center px-8 py-4 bg-brand-accent-600 hover:bg-brand-accent-700 text-white font-semibold rounded-xl transition-colors duration-300"
            >
              Explore Programmes
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center px-8 py-4 border border-white/20 hover:border-white/40 text-white font-semibold rounded-xl transition-colors duration-300"
            >
              Return Home
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </main>
  )
}
