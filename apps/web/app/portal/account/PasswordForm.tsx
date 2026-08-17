'use client'

import { useRef, useState } from 'react'

interface PasswordFormProps {
  className?: string
}

export default function PasswordForm({ className }: PasswordFormProps) {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  const passwordSuccessTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

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
    if (passwordSuccessTimer.current) clearTimeout(passwordSuccessTimer.current)

    // Lazy import keeps @supabase/ssr + supabase-js out of first-load JS (KI016);
    // it is only fetched when the member actually submits the form.
    const { createClient } = await import('@/utils/supabase/client')
    const supabase = createClient()
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) {
        setPasswordError(error.message)
      } else {
        setPasswordSuccess(true)
        setNewPassword('')
        setConfirmPassword('')
        passwordSuccessTimer.current = setTimeout(() => setPasswordSuccess(false), 4000)
      }
    } finally {
      setPasswordSaving(false)
    }
  }

  return (
    <section
      className={`mb-8 p-6 lg:p-8 bg-gray-900 rounded-card${className ? ` ${className}` : ''}`}
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
            minLength={8}
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
            className="px-6 py-3 bg-brand-accent-600 hover:bg-brand-accent-700 disabled:opacity-50 text-white font-semibold rounded-button transition-colors duration-300"
          >
            {passwordSaving ? 'Updating…' : 'Update Password'}
          </button>
        </div>
      </form>
    </section>
  )
}
