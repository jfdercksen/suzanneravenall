import type { Metadata } from 'next'
import PatternCoachContent from './PatternCoachContent'

export const metadata: Metadata = {
  title: 'Pattern Coach: 24/7 AI Coaching | Dr. Suzanne Ravenall',
  description:
    'The Pattern Intelligence Coach™, a brilliant coach in your pocket, 24 hours a day. Start your 30-day free trial, then continue on a simple monthly subscription.',
}

export default function PatternCoachPage() {
  return <PatternCoachContent />
}
