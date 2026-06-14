import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { quizzes, quizBySlug } from '@/app/explore/quizzes'
import { topicBySlug } from '@/app/explore/topics'
import QuizFlow from '@/components/quiz/QuizFlow'

// In Next.js 14 App Router, params is a Promise in dynamic routes.
type PageProps = {
  params: Promise<{ slug: string }>
}

// Pre-render only the slugs that currently have a quiz. Other valid topic
// slugs are handled on demand and redirect to their topic page.
export function generateStaticParams(): Array<{ slug: string }> {
  return Object.keys(quizzes).map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const quiz = quizBySlug(slug)
  if (!quiz) {
    return { title: 'Diagnostic | Dr. Suzanne Ravenall' }
  }
  return {
    title: `${quiz.title} | Dr. Suzanne Ravenall`,
    description: quiz.subtitle,
  }
}

export default async function QuizPage({ params }: PageProps) {
  const { slug } = await params
  const quiz = quizBySlug(slug)

  // No quiz yet for this topic: send valid topics back to their page
  // ("Quiz coming soon"), and 404 anything that isn't a real topic.
  if (!quiz) {
    if (topicBySlug(slug)) redirect(`/explore/${slug}`)
    notFound()
  }

  return <QuizFlow quiz={quiz!} />
}
