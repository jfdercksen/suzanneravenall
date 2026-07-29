import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import * as Sentry from '@sentry/nextjs'
import { topics, topicBySlug } from '@/app/explore/topics'
import { quizBySlug } from '@/app/explore/quizzes'
import QuizGate from '@/components/quiz/QuizGate'
import {
  getServiceRoleClient,
  getSubscriberByToken,
  markStarted,
  type QuizSubscriberRow,
} from '@/lib/quiz/subscriber'

// In Next.js 14 App Router, params and searchParams are Promises in dynamic routes.
type PageProps = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ token?: string }>
}

// Pre-render the quiz route for every topic. Only nervous-system has a quiz
// today; the others render a "coming soon" screen until their quizzes ship.
export function generateStaticParams(): Array<{ slug: string }> {
  return topics.map((topic) => ({ slug: topic.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const quiz = quizBySlug(slug)
  if (!quiz) {
    return { title: 'Diagnostic Coming Soon | Dr. Suzanne Ravenall' }
  }
  return {
    title: `${quiz.title} | Dr. Suzanne Ravenall`,
    description: quiz.subtitle,
  }
}

export default async function QuizPage({ params, searchParams }: PageProps) {
  const { slug } = await params
  const { token } = await searchParams
  const topic = topicBySlug(slug)

  // Not a real topic → 404.
  if (!topic) notFound()

  const quiz = quizBySlug(slug)
  if (quiz) {
    if (!token) return <QuizGate quiz={quiz} initialMode="gate" />

    const supabase = getServiceRoleClient()
    let subscriber: QuizSubscriberRow | null = null
    if (supabase) {
      try {
        subscriber = await getSubscriberByToken(supabase, slug, token)
      } catch (err) {
        // A transient DB error shouldn't hard-crash this route — degrade to
        // the same "invalid link" screen a bad token would show.
        Sentry.captureException(err)
        subscriber = null
      }
    }

    if (!subscriber) return <QuizGate quiz={quiz} initialMode="invalid" />

    if (subscriber.status === 'completed') {
      const total = quiz.questions.length
      // JSONB round-trips object keys as strings — convert back to the
      // numeric question IDs QuizFlow's answers state expects.
      const initialAnswers = Object.fromEntries(
        Object.entries(subscriber.answers ?? {}).map(([id, value]) => [Number(id), value])
      )
      return (
        <QuizGate
          quiz={quiz}
          initialMode="quiz"
          subscriber={{
            id: subscriber.id,
            accessToken: token,
            email: subscriber.email,
            initialAnswers,
            initialStep: total + 1,
          }}
        />
      )
    }

    if (subscriber.status === 'pending' && supabase) {
      // Non-critical status bookkeeping — a failure here shouldn't block the
      // user from reaching their quiz, which they've already been verified for.
      try {
        await markStarted(supabase, subscriber.id)
      } catch (err) {
        Sentry.captureException(err)
      }
    }

    return (
      <QuizGate
        quiz={quiz}
        initialMode="quiz"
        subscriber={{ id: subscriber.id, accessToken: token, email: subscriber.email }}
      />
    )
  }

  // Valid topic without a quiz yet → "coming soon" with a route back to the topic.
  return (
    <section className="relative min-h-[70vh] w-full bg-brand-primary text-white flex items-center justify-center overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[500px] rounded-full bg-brand-accent/10 blur-3xl"
      />
      <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 py-20 text-center">
        <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent-300 mb-6">
          Diagnostic Coming Soon
        </p>
        <h1 className="text-4xl lg:text-6xl font-light leading-tight mb-6">
          This pattern diagnostic is on its way
        </h1>
        <p className="text-lg text-white/70 font-light leading-relaxed mb-10">
          We&apos;re building the {topic!.title} diagnostic. In the meantime,
          explore the topic or book a discovery call with Suzanne.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href={`/explore/${topic!.slug}`}
            className="inline-flex items-center justify-center gap-3 rounded-button bg-brand-accent px-8 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-white transition-all duration-300 hover:bg-brand-accent-700"
          >
            Explore {topic!.title}
            <span aria-hidden="true">→</span>
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center px-8 py-4 border border-white/30 hover:border-white/60 text-white font-semibold text-sm uppercase tracking-widest rounded-button transition-all duration-300 hover:bg-white/10"
          >
            Book a Discovery Call
          </Link>
        </div>
      </div>
    </section>
  )
}
