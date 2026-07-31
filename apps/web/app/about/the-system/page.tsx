import type { Metadata } from 'next'
import TheSystemContent from './TheSystemContent'

export const metadata: Metadata = {
  title: 'The System | Pattern Intelligence™ | Dr. Suzanne Ravenall',
  description:
    'Pattern Intelligence™ is the philosophy underpinning all of Dr. Suzanne Ravenall’s work: a coherent system of instruments and methods, from the Pattern Discovery Instrument™ to the Pattern Mapping Process™ and Pattern Intelligence AI™.',
}

export default function TheSystemPage() {
  return <TheSystemContent />
}
