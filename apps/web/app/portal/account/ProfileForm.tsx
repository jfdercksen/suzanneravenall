'use client'

import { useRef, useState } from 'react'

interface ProfileFormProps {
  email: string
  initialFirstName: string
  initialLastName: string
  initialPhone: string
  className?: string
}

export default function ProfileForm({
  email,
  initialFirstName,
  initialLastName,
  initialPhone,
  className,
}: ProfileFormProps) {
  const [firstName, setFirstName] = useState(initialFirstName)
  const [lastName, setLastName] = useState(initialLastName)
  const [phone, setPhone] = useState(initialPhone)
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)

  const profileSuccessTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  async function handleProfileSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setProfileSaving(true)
    setProfileError(null)
    setProfileSuccess(false)
    if (profileSuccessTimer.current) clearTimeout(profileSuccessTimer.current)

    // Lazy import keeps @supabase/ssr + supabase-js out of first-load JS (KI016);
    // it is only fetched when the member actually submits the form.
    const { createClient } = await import('@/utils/supabase/client')
    const supabase = createClient()
    const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ')

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          // page.tsx reads from user.user_metadata — writes here are correct
          full_name: fullName,
          phone: phone.trim() || null,
        },
      })
      if (error) {
        setProfileError(error.message)
      } else {
        setProfileSuccess(true)
        profileSuccessTimer.current = setTimeout(() => setProfileSuccess(false), 3000)
      }
    } finally {
      setProfileSaving(false)
    }
  }

  return (
    <section
      className={`mb-8 p-6 lg:p-8 bg-gray-900 rounded-card${className ? ` ${className}` : ''}`}
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
            className="px-6 py-3 bg-brand-accent-600 hover:bg-brand-accent-700 disabled:opacity-50 text-white font-semibold rounded-button transition-colors duration-300"
          >
            {profileSaving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </section>
  )
}
