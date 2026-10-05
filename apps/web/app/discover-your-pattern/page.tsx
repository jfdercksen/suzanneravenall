import type { Metadata } from 'next'
import Script from 'next/script'
import PatternHubStickyBar from '@/components/pattern-hub/PatternHubStickyBar'
import PatternHubHero from '@/components/pattern-hub/PatternHubHero'
import PatternHubPositioning from '@/components/pattern-hub/PatternHubPositioning'
import PatternHubHowItWorks from '@/components/pattern-hub/PatternHubHowItWorks'
import PatternHubQuizGrid from '@/components/pattern-hub/PatternHubQuizGrid'
import PatternHubDeeperPositioning from '@/components/pattern-hub/PatternHubDeeperPositioning'
import PatternHubMethod from '@/components/pattern-hub/PatternHubMethod'
import PatternHubQuote from '@/components/pattern-hub/PatternHubQuote'
import PatternHubFinalCta from '@/components/pattern-hub/PatternHubFinalCta'

export function generateMetadata(): Metadata {
  return {
    title: 'Discover Your Pattern',
    description:
      'Take a free diagnostic to uncover the emotional, relational, health or performance pattern quietly running your life, then learn how to change it.',
  }
}

export default function DiscoverYourPatternPage() {
  return (
    <>
      {/* Runs before hydration so Header is already pushed down on first paint —
          without this the fixed sticky bar covers the header logo/nav until
          PatternHubStickyBar's effect fires. Offset must match BAR_OFFSET there.
          A remembered dismissal (site check M9, key DISMISS_STORAGE_KEY there)
          skips the offset and hides the bar before it can flash. */}
      <Script id="pattern-bar-offset-init" strategy="beforeInteractive">
        {`(function(){var d=document.documentElement,x=false;try{x=localStorage.getItem('pattern-hub-bar-dismissed')==='1'}catch(e){}if(x){d.setAttribute('data-pattern-bar-dismissed','')}else{d.style.setProperty('--pattern-bar-offset','2.5rem');document.body.style.paddingTop='2.5rem'}})();`}
      </Script>
      <PatternHubStickyBar />
      <main>
        <PatternHubHero />
        <PatternHubPositioning />
        <PatternHubHowItWorks />
        <PatternHubQuizGrid />
        <PatternHubDeeperPositioning />
        <PatternHubMethod />
        <PatternHubQuote />
        <PatternHubFinalCta />
      </main>
    </>
  )
}