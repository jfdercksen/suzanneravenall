'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { createClient } from '@/utils/supabase/client'

interface AccountContentProps {
  email: string
  firstName: string
  lastName: string
  phone: string
  tierName: string
  memberSince: string | null
  memberUntil: string | null
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default function AccountContent({
  email,
  firstName: initialFirstName,
  lastName: initialLastName,
  phone: initialPhone,
  tierName,
  memberSince,
  memberUntil,
}: AccountContentProps) {

  const [firstName, setFirstName] = useState(initialFirstName)
  const [lastName, setLastName] = useState(initialLastName)
  const [phone, setPhone] = useState(initialPhone)
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  async function handleProfileSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setProfileSaving(true)
    setProfileError(null)
    setProfileSuccess(false)

    const supabase = createClient()
    const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ')

    const { error } = await supabase.auth.updateUser({
      data: {
        full_name: fullName,
        phone: phone.trim() || null,
      },
    })

    if (error) {
      setProfileError(error.message)
    } else {
      setProfileSuccess(true)
      setTimeout(() => setProfileSuccess(false), 3000)
    }
    setProfileSaving(false)
  }

  async function handlePasswordChange(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPasswordError(null)
    setPasswordSuccess(false)

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.')
      return
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.')
      return
    }

    setPasswordSaving(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: newPassword })

    if (error) {
      setPasswordError(error.message)
    } else {
      setPasswordSuccess(true)
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setPasswordSuccess(false), 4000)
    }
    setPasswordSaving(false)
  }

  return (
    <main className="w-full bg-brand-primary min-h-screen py-16 lg:py-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="mb-10"
        >
          <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-4">
            Member Portal
          </p>
          <h1 className="text-3xl lg:text-5xl font-light text-white mb-3">My Account</h1>
          <p className="text-lg text-white/60">Manage your profile, password, and membership details.</p>
        </motion.div>

        {/* Profile section */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="mb-8 p-6 lg:p-8 bg-gray-900 rounded-2xl"
          aria-labelledby="profile-heading"
        >
          <h2 id="profile-heading" className="text-lg font-semibold text-white mb-6">Profile</h2>
          <form onSubmit={handleProfileSave} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="firstName" className="block text-xs font-medium text-white/50 uppercase tracking-widest mb-2">
                  First name
                </label>
                <input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-brand-accent/60 transition-colors"
                  placeholder="First name"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-xs font-medium text-white/50 uppercase tracking-widest mb-2">
                  Last name
                </label>
                <input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-brand-accent/60 transition-colors"
                  placeholder="Last name"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-medium text-white/50 uppercase tracking-widest mb-2">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                readOnly
                className="w-full px-4 py-3 bg-gray-800/50 border border-white/5 rounded-xl text-white/50 cursor-not-allowed"
                aria-describedby="email-note"
              />
              <p id="email-note" className="mt-1.5 text-xs text-white/30">
                Email cannot be changed here. Contact support if you need to update your email address.
              </p>
            </div>

            <div>
              <label htmlFor="phone" className="block text-xs font-medium text-white/50 uppercase tracking-widest mb-2">
                Phone number
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-brand-accent/60 transition-colors"
                placeholder="+27 82 000 0000"
              />
            </div>

            {profileError && (
              <p className="text-red-400 text-sm" role="alert">{profileError}</p>
            )}
            {profileSuccess && (
              <p className="text-green-400 text-sm" role="status">Profile updated successfully.</p>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={profileSaving}
                className="px-6 py-3 bg-brand-accent-600 hover:bg-brand-accent-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors duration-300"
              >
                {profileSaving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </form>
        </motion.section>

        {/* Password section */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8 p-6 lg:p-8 bg-gray-900 rounded-2xl"
          aria-labelledby="password-heading"
        >
          <h2 id="password-heading" className="text-lg font-semibold text-white mb-2">Change Password</h2>
          <p className="text-white/40 text-sm mb-6">
            Password changes are secured by your active session. You do not need to re-enter your current password.
          </p>
          <form onSubmit={handlePasswordChange} className="space-y-5">
            <div>
              <label htmlFor="newPassword" className="block text-xs font-medium text-white/50 uppercase tracking-widest mb-2">
                New password
              </label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-4 py-3 bg-gray-800 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-brand-accent/60 transition-colors"
                placeholder="At least 8 characters"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-medium text-white/50 uppercase tracking-widest mb-2">
                Confirm new password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-gray-800 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-brand-accent/60 transition-colors"
                placeholder="Repeat new password"
              />
            </div>

            {passwordError && (
              <p className="text-red-400 text-sm" role="alert">{passwordError}</p>
            )}
            {passwordSuccess && (
              <p className="text-green-400 text-sm" role="status">Password updated successfully.</p>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={passwordSaving}
                className="px-6 py-3 bg-brand-accent-600 hover:bg-brand-accent-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors duration-300"
              >
                {passwordSaving ? 'Updating…' : 'Update Password'}
              </button>
            </div>
          </form>
        </motion.section>

        {/* Membership details */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mb-8 p-6 lg:p-8 bg-gray-900 rounded-2xl"
          aria-labelledby="membership-heading"
        >
          <h2 id="membership-heading" className="text-lg font-semibold text-white mb-6">Membership Details</h2>
          <dl className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-white/[0.06]">
              <dt className="text-white/50 text-sm">Current tier</dt>
              <dd className="text-white font-semibold text-sm">{tierName}</dd>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-white/[0.06]">
              <dt className="text-white/50 text-sm">Member since</dt>
              <dd className="text-white font-semibold text-sm">{formatDate(memberSince)}</dd>
            </div>
            <div className="flex justify-between items-center py-3">
              <dt className="text-white/50 text-sm">Next renewal</dt>
              <dd className="text-white font-semibold text-sm">{formatDate(memberUntil)}</dd>
            </div>
          </dl>
          <div className="mt-5">
            <Link
              href="/portal/upgrade"
              className="inline-flex items-center gap-2 text-brand-accent text-sm font-medium hover:underline"
            >
              View upgrade options
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        </motion.section>

        {/* Danger zone */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="p-6 lg:p-8 bg-gray-900 rounded-2xl border border-red-900/30"
          aria-labelledby="danger-heading"
        >
          <h2 id="danger-heading" className="text-lg font-semibold text-red-400 mb-2">Danger Zone</h2>
          <p className="text-white/50 text-sm mb-5">
            To cancel your membership or delete your account, please contact us directly so we can assist you.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-5 py-2.5 border border-red-900/50 hover:border-red-700/60 text-red-400 hover:text-red-300 text-sm font-semibold rounded-xl transition-colors duration-300"
          >
            Cancel Membership
          </Link>
        </motion.section>

      </div>
    </main>
  )
}
