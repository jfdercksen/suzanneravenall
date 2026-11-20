'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { createClient } from '@/utils/supabase/client'

export interface NoviceApplicationView {
  id: string
  levelTitle: string
  status: 'awaiting_documents' | 'submitted' | 'changes_requested' | 'approved'
  canUpload: boolean
  reviewerNote: string | null
  checklist: string[]
  pathwayHref: string
  files: { name: string; size: number; uploadedAt: string }[]
}

interface NoviceContentProps {
  applications: NoviceApplicationView[]
  unavailable: boolean
  emailConfirmed: boolean
}

const BUCKET = 'novice-applications'

const STATUS_TEXT: Record<NoviceApplicationView['status'], string> = {
  awaiting_documents: 'Waiting for your documents',
  submitted: 'With your team for review',
  changes_requested: 'Your team asked for more',
  approved: 'Approved: your Novice access has started',
}

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${Math.max(1, Math.round(bytes / 1024))} KB`
}

async function postJson(url: string, body: unknown): Promise<{ ok: boolean; data: Record<string, unknown> }> {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>
  return { ok: res.ok, data }
}

function ApplicationCard({ initial }: { initial: NoviceApplicationView }) {
  const [app, setApp] = useState(initial)
  const [busy, setBusy] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function upload(files: FileList | null) {
    if (!files || files.length === 0) return
    setMessage(null)
    const supabase = createClient()
    for (const file of Array.from(files)) {
      setBusy(`Uploading ${file.name}`)
      const signed = await postJson('/api/portal/novice/upload-url', { applicationId: app.id, name: file.name, size: file.size, type: file.type })
      if (!signed.ok) {
        setMessage(`${file.name}: ${String(signed.data.error ?? 'could not be uploaded')}. Use PDF, Word, Excel, pictures, audio or video.`)
        continue
      }
      const { error } = await supabase.storage.from(BUCKET).uploadToSignedUrl(String(signed.data.path), String(signed.data.token), file, { contentType: file.type })
      if (error) {
        setMessage(`${file.name} could not be uploaded. Please try again.`)
        continue
      }
      const saved = await postJson('/api/portal/novice/files', { applicationId: app.id, path: signed.data.path, name: file.name, size: file.size, type: file.type })
      if (!saved.ok) {
        setMessage(`${file.name} could not be saved. Please try again.`)
        continue
      }
      const list = saved.data.files as { name: string; size: number; uploaded_at: string }[]
      setApp((a) => ({ ...a, files: list.map((f) => ({ name: f.name, size: f.size, uploadedAt: f.uploaded_at })) }))
    }
    setBusy(null)
  }

  async function send() {
    setBusy('Sending')
    setMessage(null)
    const res = await postJson('/api/portal/novice/submit', { applicationId: app.id })
    setBusy(null)
    if (res.ok) {
      setApp((a) => ({ ...a, status: 'submitted', canUpload: false, reviewerNote: null }))
      setMessage('Sent. Your team will email you, usually within 15 working days.')
    } else {
      setMessage(res.data.error === 'no-files' ? 'Upload at least one file first.' : 'Your application could not be sent. Please try again.')
    }
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.6 }}
      className="w-full p-6 sm:p-8 rounded-2xl bg-brand-primary-800 border border-white/15"
    >
      <p className="mb-2 text-xs uppercase tracking-[0.3em] font-medium text-brand-accent-400">{STATUS_TEXT[app.status]}</p>
      <h2 className="mb-6 text-2xl font-medium tracking-tight text-white">{app.levelTitle}</h2>

      {app.reviewerNote && (
        <div className="mb-6 p-4 rounded-xl bg-white/10 text-white/90 text-sm leading-relaxed whitespace-pre-line">
          <p className="mb-2 font-semibold text-white">Your team&rsquo;s note</p>
          {app.reviewerNote}
        </div>
      )}

      {app.canUpload && (
        <>
          <p className="mb-3 text-sm text-white/80">Please upload:</p>
          <ol className="mb-4 space-y-2 list-decimal list-inside text-sm text-white/80 leading-relaxed">
            {app.checklist.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
          <p className="mb-6 text-sm text-white/70">
            The full steps are in the{' '}
            <Link href={app.pathwayHref} className="underline underline-offset-2 text-white">
              Career &amp; Certification Pathway
            </Link>
            .
          </p>
        </>
      )}

      <h3 className="mb-3 text-sm font-semibold text-white">Your files ({app.files.length})</h3>
      {app.files.length === 0 ? (
        <p className="mb-6 text-sm text-white/70">No files yet.</p>
      ) : (
        <ul className="mb-6 space-y-1 text-sm text-white/80">
          {app.files.map((f) => (
            <li key={`${f.name}-${f.uploadedAt}`} className="break-all">
              {f.name} <span className="text-white/60">({formatSize(f.size)})</span>
            </li>
          ))}
        </ul>
      )}

      {app.canUpload && (
        <div className="flex flex-col sm:flex-row gap-3">
          <label className="inline-flex items-center justify-center px-6 py-3 border border-white/50 text-white text-sm font-semibold uppercase tracking-widest rounded-button cursor-pointer transition-all duration-300 hover:bg-white/10">
            Add files
            <input type="file" multiple className="sr-only" disabled={busy !== null} onChange={(e) => void upload(e.target.files)} />
          </label>
          <button
            type="button"
            onClick={() => void send()}
            disabled={busy !== null || app.files.length === 0}
            className="px-6 py-3 bg-white text-brand-primary text-sm font-semibold uppercase tracking-widest rounded-button transition-all duration-300 hover:bg-brand-sand disabled:opacity-50"
          >
            Send to your team
          </button>
        </div>
      )}

      {(busy || message) && (
        <p className="mt-4 text-sm text-white/80" role="status">
          {busy ?? message}
        </p>
      )}
    </motion.article>
  )
}

export default function NoviceContent({ applications, unavailable, emailConfirmed }: NoviceContentProps) {
  return (
    <div className="w-full min-h-screen bg-brand-primary">
      <motion.section
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full py-20 lg:py-32"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="mb-6 text-xs uppercase tracking-[0.3em] font-medium text-brand-accent-400">Novice</p>
          <h1 className="mb-6 text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-white leading-[1.05]">Your Novice application</h1>
          <p className="mb-12 max-w-2xl text-base lg:text-lg text-white/70 leading-relaxed">
            Upload what your pathway asks for and send it to your team. Your Novice access starts once your team has checked
            your documents and recordings and approved them.
          </p>

          {unavailable && <p className="text-white/80">Your application cannot be shown right now. Please try again later.</p>}

          {!unavailable && applications.length === 0 && (
            <p className="max-w-2xl text-white/80 leading-relaxed">
              {emailConfirmed
                ? 'You have no Novice application. One opens when you pay for a Novice membership with this email address.'
                : 'Please confirm your email address first: your application is matched to the email you paid with.'}
            </p>
          )}

          <div className="grid gap-8">
            {applications.map((app) => (
              <ApplicationCard key={app.id} initial={app} />
            ))}
          </div>
        </div>
      </motion.section>
    </div>
  )
}
