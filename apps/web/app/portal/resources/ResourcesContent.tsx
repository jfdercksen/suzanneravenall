'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { hasAccess, tierLabel, type TierSlug, type ResourceKey } from '@/lib/access/tiers'

interface Resource {
  title: string
  description: string
  type: 'PDF' | 'Workbook' | 'Recording' | 'Template' | 'Assessment'
  resource: ResourceKey
  href?: string
}

interface ResourceCategory {
  title: string
  resource: ResourceKey
  resources: Resource[]
}

const RESOURCE_CATEGORIES: ResourceCategory[] = [
  {
    title: 'Getting Started',
    resource: 'resources_basic',
    resources: [
      {
        title: 'Welcome to the Portal',
        description: 'Your guide to navigating the member portal and getting the most from your membership.',
        type: 'PDF',
        resource: 'resources_basic',
        href: '#',
      },
      {
        title: 'Introduction to Human Performance Replicator',
        description: 'A foundational overview of the HPR methodology and how it creates lasting change.',
        type: 'PDF',
        resource: 'resources_basic',
        href: '#',
      },
      {
        title: 'Your Transformation Roadmap',
        description: 'A step-by-step guide to planning your personal transformation journey.',
        type: 'Workbook',
        resource: 'resources_basic',
        href: '#',
      },
    ],
  },
  {
    title: 'Assessments & Workbooks',
    resource: 'resources_assessments',
    resources: [
      {
        title: 'Pattern Recognition Assessment',
        description: 'Identify the unconscious patterns shaping your relationships and results.',
        type: 'Assessment',
        resource: 'resources_assessments',
        href: '#',
      },
      {
        title: 'Emotional Mastery Profile',
        description: 'Map your emotional response patterns, triggers, and growth edge.',
        type: 'Assessment',
        resource: 'resources_assessments',
        href: '#',
      },
      {
        title: 'Life Design Assessment',
        description: 'Gap analysis between your current reality and your ideal future.',
        type: 'Workbook',
        resource: 'resources_assessments',
        href: '#',
      },
      {
        title: 'Energy Audit Workbook',
        description: 'A comprehensive audit of where your energy is flowing and where it is being drained.',
        type: 'Workbook',
        resource: 'resources_assessments',
        href: '#',
      },
    ],
  },
  {
    title: 'Tools & Templates',
    resource: 'resources_media',
    resources: [
      {
        title: 'Weekly Intention Setting Template',
        description: 'A structured framework for setting and holding powerful weekly intentions.',
        type: 'Template',
        resource: 'resources_media',
        href: '#',
      },
      {
        title: 'Belief Mapping Worksheet',
        description: 'Trace limiting beliefs to their root and replace them with empowering alternatives.',
        type: 'Workbook',
        resource: 'resources_media',
        href: '#',
      },
      {
        title: 'Relationship Dynamics Analysis',
        description: 'Understand the energy dynamics at play in your key relationships.',
        type: 'PDF',
        resource: 'resources_media',
        href: '#',
      },
    ],
  },
  {
    title: 'Group Session Recordings',
    resource: 'group_sessions_recorded',
    resources: [
      {
        title: 'Rapid Repatterning — Group Session 1',
        description: 'Introduction to the RR process with group practice. 90 minutes.',
        type: 'Recording',
        resource: 'group_sessions_recorded',
      },
      {
        title: 'Emotional Freedom Intensive',
        description: 'Deep dive into the neuroscience of emotional regulation. 2 hours.',
        type: 'Recording',
        resource: 'group_sessions_recorded',
      },
      {
        title: 'Relationship Healing Session',
        description: 'Clearing ancestral and relational energy patterns. 90 minutes.',
        type: 'Recording',
        resource: 'group_sessions_recorded',
      },
    ],
  },
  {
    title: 'Live Session Recordings',
    resource: 'live_session_recordings',
    resources: [
      {
        title: 'Gold Cohort — May 2026 Intensive',
        description: 'Full 3-hour live coaching intensive with Gold members. Advanced patterns work.',
        type: 'Recording',
        resource: 'live_session_recordings',
      },
      {
        title: 'VIP Masterclass — Energy Leadership',
        description: 'Exclusive masterclass on energy leadership for high-performance professionals.',
        type: 'Recording',
        resource: 'live_session_recordings',
      },
    ],
  },
  {
    title: 'Practitioner Resources',
    resource: 'practitioner_resources',
    resources: [
      {
        title: 'HPR Practitioner Manual',
        description: 'The complete clinical reference for certified HPR practitioners.',
        type: 'PDF',
        resource: 'practitioner_resources',
        href: '#',
      },
      {
        title: 'Client Assessment Battery',
        description: 'Validated assessment tools for use with your own clients.',
        type: 'Workbook',
        resource: 'practitioner_resources',
        href: '#',
      },
      {
        title: 'Supervision Case Notes Template',
        description: 'Structured templates for practitioner supervision and case documentation.',
        type: 'Template',
        resource: 'practitioner_resources',
        href: '#',
      },
    ],
  },
]

const TYPE_BADGE: Record<Resource['type'], string> = {
  PDF: 'bg-blue-500/20 text-blue-300',
  Workbook: 'bg-purple-500/20 text-purple-300',
  Recording: 'bg-brand-accent/20 text-brand-accent',
  Template: 'bg-green-500/20 text-green-300',
  Assessment: 'bg-yellow-500/20 text-yellow-300',
}

interface ResourcesContentProps {
  tier: TierSlug
}

function ResourceCard({ resource, tier }: { resource: Resource; tier: TierSlug }) {
  const unlocked = hasAccess(tier, resource.resource)

  if (unlocked && resource.resource === 'group_sessions_recorded') {
    return (
      <Link
        href={`/portal/videos?category=group-sessions`}
        className="group flex flex-col gap-3 p-5 bg-gray-800 hover:bg-gray-700 rounded-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
      >
        <div className="flex items-start justify-between gap-3">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_BADGE[resource.type]}`}>
            {resource.type}
          </span>
          <svg className="w-4 h-4 text-brand-accent opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </div>
        <p className="text-white font-semibold text-sm leading-snug">{resource.title}</p>
        <p className="text-white/50 text-xs leading-relaxed">{resource.description}</p>
      </Link>
    )
  }

  if (unlocked && resource.href) {
    return (
      <a
        href={resource.href}
        className="group flex flex-col gap-3 p-5 bg-gray-800 hover:bg-gray-700 rounded-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
        download
      >
        <div className="flex items-start justify-between gap-3">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_BADGE[resource.type]}`}>
            {resource.type}
          </span>
          <svg className="w-4 h-4 text-brand-accent opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
        </div>
        <p className="text-white font-semibold text-sm leading-snug">{resource.title}</p>
        <p className="text-white/50 text-xs leading-relaxed">{resource.description}</p>
      </a>
    )
  }

  if (!unlocked) {
    const minTier = (['free', 'silver', 'gold', 'practitioner'] as TierSlug[]).find(
      (t) => hasAccess(t, resource.resource),
    ) ?? 'silver'

    return (
      <div className="relative flex flex-col gap-3 p-5 bg-gray-900/50 rounded-card border border-white/5 select-none">
        <div className="absolute inset-0 rounded-card backdrop-blur-[1px] bg-gray-950/40 flex items-center justify-center">
          <div className="text-center px-4">
            <svg className="w-5 h-5 text-white/30 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
            <p className="text-white/40 text-xs">
              Unlock with{' '}
              {/* TODO: Build /portal/upgrade page */}
              <Link href="/shop?collection=membership" className="text-brand-accent hover:underline">
                {tierLabel(minTier)}
              </Link>
            </p>
          </div>
        </div>
        <div className="flex items-start justify-between gap-3 opacity-20">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_BADGE[resource.type]}`}>
            {resource.type}
          </span>
        </div>
        <p className="text-white font-semibold text-sm leading-snug opacity-20">{resource.title}</p>
        <p className="text-white/50 text-xs leading-relaxed opacity-20">{resource.description}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 p-5 bg-gray-800 rounded-card">
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium w-fit ${TYPE_BADGE[resource.type]}`}>
        {resource.type}
      </span>
      <p className="text-white font-semibold text-sm leading-snug">{resource.title}</p>
      <p className="text-white/50 text-xs leading-relaxed">{resource.description}</p>
    </div>
  )
}

export default function ResourcesContent({ tier }: ResourcesContentProps) {
  return (
    <main className="relative w-full bg-brand-primary min-h-screen py-20 lg:py-32 overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute bg-brand-accent/10 blur-[140px] rounded-full w-96 h-96 top-1/4 left-1/2 -translate-x-1/2" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-4">
            Member Portal
          </p>
          <h1 className="text-4xl lg:text-6xl font-light text-white mb-4">
            Resource Library
          </h1>
          <p className="text-xl text-white/60 max-w-2xl">
            Your complete toolkit for transformation — assessments, workbooks, templates, and session recordings.
          </p>
        </motion.div>

        <div className="space-y-16">
          {RESOURCE_CATEGORIES.map((category, catIndex) => {
            const categoryUnlocked = hasAccess(tier, category.resource)

            return (
              <motion.div
                key={category.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.5, delay: catIndex * 0.05 }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <h2 className="text-xl font-semibold text-white">{category.title}</h2>
                  {/* TODO: Build /portal/upgrade page */}
                  {!categoryUnlocked && (
                    <Link
                      href="/shop?collection=membership"
                      className="inline-flex items-center gap-1 px-3 py-1 bg-brand-accent/10 text-brand-accent text-xs font-semibold uppercase tracking-widest rounded-full hover:bg-brand-accent/20 transition-colors"
                    >
                      <svg aria-hidden="true" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                      </svg>
                      Upgrade to unlock
                    </Link>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {category.resources.map((resource) => (
                    <ResourceCard key={resource.title} resource={resource} tier={tier} />
                  ))}
                </div>
              </motion.div>
            )
          })}
        </div>

        {tier === 'free' && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
            className="mt-20 relative overflow-hidden rounded-card bg-gray-900 p-8 lg:p-12"
          >
            <div className="flex flex-col lg:flex-row lg:items-center gap-8">
              <div className="flex-1">
                <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-3">
                  Unlock Everything
                </p>
                <h2 className="text-2xl lg:text-3xl font-light text-white mb-3">
                  Ready to access the full library?
                </h2>
                <p className="text-white/60 max-w-xl">
                  Upgrade to Silver or above to unlock all assessments, workbooks, tools, and session recordings.
                </p>
              </div>
              <div className="flex-shrink-0">
                {/* TODO: Build /portal/upgrade page */}
                <Link
                  href="/shop?collection=membership"
                  className="inline-flex items-center justify-center px-8 py-4 bg-brand-accent-600 hover:bg-brand-accent-700 text-white font-semibold rounded-button transition-colors duration-300"
                >
                  View Upgrade Options
                </Link>
              </div>
            </div>
          </motion.div>
        )}

      </div>
    </main>
  )
}
