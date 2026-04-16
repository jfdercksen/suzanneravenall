import type { Metadata } from 'next'
import AboutHero from '@/components/about/AboutHero'
import TheMethod from '@/components/about/TheMethod'
import TheStory from '@/components/about/TheStory'
import Credentials from '@/components/about/Credentials'
import HowItWorks from '@/components/about/HowItWorks'
import TheEcosystem from '@/components/about/TheEcosystem'
import AboutFinalCTA from '@/components/about/AboutFinalCTA'
import MediaLogos from '@/components/home/MediaLogos'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'About Dr. Suzanne Ravenall | Transformation & Performance Coach',
    description:
      'Meet Dr. Suzanne Ravenall — B.Msc. M.Msc. Msc.D. Modern-day explorer of human potential, transformation and performance coach, speaker, and multiple award-winning entrepreneur championing the change in the human condition one person at a time.',
  }
}

export default function AboutPage() {
  return (
    <main>
      <AboutHero />
      <TheMethod />
      <TheStory />
      <Credentials />
      <HowItWorks />
      <MediaLogos
        quote="\u201cWhen we find and disrupt the patterns that keep us stuck, we don\u2019t just change \u2014 we become.\u201d"
        quoteAttribution="Dr. Suzanne Ravenall"
      />
      <TheEcosystem />
      <AboutFinalCTA />
    </main>
  )
}
