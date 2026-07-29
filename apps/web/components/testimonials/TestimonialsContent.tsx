'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import VideoTestimonials from '@/components/shared/VideoTestimonials'

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: 'easeOut' as const },
})

// Real client testimonials harvested from the previous suzanneravenall.com site
// (homepage carousel + about.md + masterclass.md). Attribution as given.
const writtenTestimonials = [
  {
    quote:
      'Suzanne is highly skilled at cutting through the noise and getting to the core of an issue. Her sessions are deep and empowering and I always leave with a sense of clarity and understanding of the underlying causes of the challenges I face in my life.',
    name: 'Matheo',
    location: 'Cyprus',
  },
  {
    quote:
      'What an incredible experience it was to benefit from the extraordinary repatterning skills that Dr Suzanne Ravenall facilitated. Layers of old beliefs that I was unaware of, lifted. I definitely feel lighter and money is flowing into my life with greater ease. Highly recommended.',
    name: 'Jen',
    location: 'California',
  },
  {
    quote:
      'She has been so professional and helpful that no words can describe. Her guidance and kindness mean so much to me and I am truly grateful for everything I have learnt from her. She never hesitates sharing her knowledge and personal experiences, and they open my eyes to new stages of personal development and growth.',
    name: 'Sally',
    location: 'Hong Kong',
  },
  {
    quote:
      'With Suzanne’s compassionate guidance during the sessions the shifts within me came very quickly; there is still work to be done but within days I became a different person, more engaged with life, motivated and enthusiastic. I continue to evolve and I thank you Suzanne for the opportunity to finally find peace with several areas of past trauma. My life will only get better from hereon in.',
    name: 'Jayne',
    location: 'France',
  },
  {
    quote:
      'I loved the reading you gave me. You identified some core patterns and problems which I know are correct from the work I have already done on myself. The affirmations and new pattern ideas really helped.',
    name: 'Johanna',
    location: 'United Kingdom',
  },
  {
    quote:
      'I released a lot of negativity. It was an extremely valuable experience to me. I enjoyed it. It was relaxing and cathartic. I experienced tremendous relief and release. It helped clear up my thought processes. I definitely recommend Suzanne.',
    name: 'Seth',
    location: 'America',
  },
  {
    quote:
      'This was an awesome experience. I was able to relate to what came up. Apart from the content you have such a nice personable way of connecting, which made it very easy for me to dive into the unknown. I feel more at ease with and about myself.',
    name: 'Anke',
    location: 'USA',
  },
  {
    quote:
      'Suzanne taps into areas that need to be cleared. She is compassionate in her sessions.',
    name: 'Gloria',
    location: 'USA',
  },
  {
    quote:
      'Suzanne made me feel completely at ease and I felt I could trust her and loved her energy. She really seems to know how to access the information that’s valuable for you and has an ability to do this in such a down-to-earth manner. I would absolutely recommend working with Suzanne Ravenall. I believe she’s definitely genuine and one of a kind.',
    name: 'Ivana Vranic',
    location: 'Scotland',
  },
  {
    quote:
      'I enjoyed this experience immensely. Suzanne immediately put me at ease and the time flew by. Suzanne was quickly able to find and address issues that have plagued me since birth. I feel so validated and heard. I have worked with many over the years but Suzanne was the first one that was able to get literally to the heart of the matter and express my issues with compassion and nonjudgment. I went into the session not really knowing what to expect, but came away so much lighter and reassured.',
    name: 'Jennifer',
    location: 'United Kingdom',
  },
  {
    quote:
      'I have achieved so much. I met amazing people through the training system which truly transforms lives in an amazing way. It is a real learning experience to heal yourself and to help heal other people and to touch lives in a spectacular way. I feel blessed and lucky to have met Suzanne — she has been my mentor. It has been a wonderful journey of transformation.',
    name: 'Adriana',
    location: 'Venezuela',
  },
  {
    quote: 'I have had amazing life changing results. I have found my voice.',
    name: 'Angela',
    location: 'USA',
  },
  {
    quote:
      'I am not much of a group person, but was pleasantly surprised how much I enjoyed being part of the group class. The group came up with such wonderfully pertinent emotional information that I had forgotten, so it was much simpler to integrate. It’s certainly had a profound effect on the way I relate to money and I am looking at it more positively from now on.',
    name: 'Amanda',
    location: 'South Africa',
  },
  {
    quote:
      'In the past I would shut down a lot to avoid the possibility of being affected or of becoming overly sensitive and nervous. Now I aim to remain strong when challenged and release any fear related to being challenged. With the knowledge that I now have, I have the power to protect myself should it be required, and there is no need to enter fear mode at any given time.',
    name: 'Anonymous',
    location: 'South Africa',
  },
  {
    quote:
      'Suzanne is a God-sent angel on a mission to change people’s lives for the better and help heal their lives. In using Repatterning, her perseverance, dedication and professionalism have made the sessions priceless.',
    name: 'Sally',
    location: 'Hong Kong',
  },
  {
    quote:
      'I am a warrior. Looking forward to continuing the integrating and letting it all settle into the cellular structures with a sense of permanence.',
    name: 'Anonymous',
    location: 'South Africa',
  },
  {
    quote:
      'I am blessed and lucky to have met Suzanne when I was feeling so depressed and lost. Suzanne always carries positive and passionate vibes and has given me support and strength during my difficult times. She reminds me to stay positive during the chaotic moment, and be confident when facing all sorts of challenges.',
    name: 'Anonymous',
    location: 'Hong Kong',
  },
  {
    quote:
      'I realise I can’t allow myself to be knocked off balance by others, and allow the nerves to take over and cause anxiety. I also realise that one can’t always have the approval of all people.',
    name: 'Anonymous',
    location: 'South Africa',
  },
  {
    quote:
      'I went to Suzanne to work on a particular block. I had been struggling to find a resolution after many months and felt stuck, confused and unable to move forward. Suzanne helped me see my own part in creating the situation and helped me clear the unconscious belief that was keeping me stuck. After my session it felt as if the emotional baggage had cleared and I could move forward with more clarity and focus, renewed enthusiasm and passion.',
    name: 'Deborah',
    location: 'South Africa',
  },
  {
    quote:
      'Thank you so much for putting yourself on this path to help others. I loved everything about how you handled our session. I definitely got a lot of clarity, particularly about my children.',
    name: 'Victoria',
    location: 'Colorado',
  },
  {
    quote:
      'I could feel positive change immediately. Suzanne was great to work with. Within 5–10 minutes I felt at ease. Suzanne quickly and succinctly got to the heart of the matter. I definitely felt the change as it was happening. It was a great session.',
    name: 'Andrew',
    location: 'United Kingdom',
  },
  {
    quote:
      'It was mind-blowing. The session revealed a very deep fear and program that I thought I had under control. Suzanne is very dynamic and is very passionate about what she is doing. She helped me get to grips with a very strong negative belief that I thought I had eliminated.',
    name: 'Meli',
    location: 'United States',
  },
  {
    quote:
      'A huge big thank you!! The tools provided in your course are working very well for me. Facing the shadow has been fundamental in my processing, as well as the daily work — it’s been awesome.',
    name: 'Jean',
    location: 'South Africa',
  },
  {
    quote:
      'I thoroughly loved the session. Suzanne, you were absolutely bang on — certain issues which nobody could tell me about before, and you confirmed the reasons why. I felt totally helpless and disappointed with others I reached out to for help. You helped me with the answers and reasons where others couldn’t.',
    name: 'Jaya',
    location: 'India',
  },
  {
    quote:
      'Suzanne’s session hit home in a number of ways. Certain aspects of my personality and history that I couldn’t seem to overcome came out in the session. It has allowed me to have a new understanding of myself and I feel lighter and free. She has a compassionate nature and I would highly recommend her.',
    name: 'Leah',
    location: 'United States',
  },
  {
    quote:
      'Since our session, I have found myself looking at my life in such a grateful way! And since our session a few events have happened that have pushed me exactly to the path that I wanted to be walking. I had no fear of changing direction.',
    name: 'Cristina',
    location: 'South America',
  },
  {
    quote:
      'There’s a shift alright — the exercises are proving a challenge! One day at a time, one moment at a time. I want to thank you for your energy specifically.',
    name: 'Gavin',
    location: 'South Africa',
  },
  {
    quote:
      'I want to say thank you. My awareness and coherence is growing and it is the most wonderful thing I have ever experienced. I have cried because I have felt so much happiness and joy inside. I had no idea that it was even possible.',
    name: 'Nisha',
    location: 'USA',
  },
  {
    quote:
      'I have now started to re-read the notes — they contain priceless knowledge. Many, many thanks. I’m literally absorbing the content and I want to put this knowledge into practice. I’m so grateful to you.',
    name: 'Houshana',
    location: 'Mauritius',
  },
  {
    quote:
      'I couldn’t have done this without your help. You took me on a deep journey and brought to light the tension and pain I was carrying. You have helped me heal. I am so grateful that I could be part of the program.',
    name: 'Magda',
    location: 'Poland',
  },
  {
    quote: 'Absolutely brilliant session! I feel 1000 times lighter already!',
    name: 'Dante',
    location: 'United Kingdom',
  },
  {
    quote:
      'One of my staff members opened up that she had been struggling and feeling depressed. I find that I can now help a lot by taking her through some of the fundamental points. I immediately witnessed a shift in her. I’m very grateful for having received the tools you provided — to not only help myself but to shine a light for others as well.',
    name: 'Anonymous',
    location: 'South Africa',
  },
  {
    quote:
      'I agree with your beautiful insightful teaching! Your light and heart shine forth, enlightening many. I am blessed to be in your classes and benefit from your willingness to speak your truth with care and love for all.',
    name: 'Dee',
    location: 'USA',
  },
  {
    quote:
      'I am really loving how you strike a very beautiful balance between the logical and emotional parts of the brain in your style of teaching.',
    name: 'Melissa',
    location: 'USA',
  },
  {
    quote:
      'There is something special about group sessions — it’s like we are helping each other unravel our deepest issues with total vulnerability, and yet we feel so protected knowing a lot of our negative conditioning is just garbage that we need to throw out. It’s a privilege to be guided by Suzanne.',
    name: 'Schweta',
    location: 'Mauritius',
  },
  {
    quote:
      'WOW WOW WOW!!! I’m blown away, dear Suzanne. I am humbled by your work and what a humble person you are. I have so much to learn, and may this be the first of many to come.',
    name: 'Jennifer',
    location: 'South Africa',
  },
]

export default function TestimonialsContent() {
  return (
    <>
      {/* ── Hero — dark, short ─────────────────────────────────────────── */}
      <section
        aria-labelledby="testimonials-hero-heading"
        className="relative w-full bg-brand-primary py-20 lg:py-32 overflow-hidden"
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <div className="absolute bg-brand-accent/10 blur-[140px] rounded-full w-96 h-96 top-1/4 left-1/2 -translate-x-1/2" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.p
            {...fadeUp(0)}
            className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-6"
          >
            Testimonials
          </motion.p>

          <motion.h1
            id="testimonials-hero-heading"
            {...fadeUp(0.15)}
            className="text-4xl lg:text-6xl font-light text-white leading-[1.1] max-w-3xl mb-6"
          >
            Real People. Real Patterns. Real Change.
          </motion.h1>

          <motion.p
            {...fadeUp(0.3)}
            className="text-lg text-white/70 font-light max-w-xl leading-relaxed"
          >
            Clients around the world share what shifted when they found — and broke — the
            patterns that were holding them back.
          </motion.p>
        </div>
      </section>

      {/* ── Video testimonials — light (bg-white inside component) ─────── */}
      <VideoTestimonials showViewAllLink={false} />

      {/* ── Results spotlight — dark stats band ────────────────────────── */}
      <section
        aria-labelledby="testimonials-result-heading"
        className="bg-gray-950 py-20 lg:py-32 overflow-hidden"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

            {/* Stat anchor */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.7, ease: 'easeOut' as const }}
            >
              <p className="text-xs tracking-[0.3em] text-brand-accent uppercase font-medium mb-3">
                The Numbers Behind the Stories
              </p>
              <h2
                id="testimonials-result-heading"
                className="text-4xl lg:text-6xl font-light text-white leading-[1.1] mb-8"
              >
                When the pattern breaks, everything moves
              </h2>
              <div className="text-7xl lg:text-9xl font-light text-white leading-none mb-2">
                2&times;
              </div>
              <p className="text-xl lg:text-2xl text-white/60 font-light uppercase tracking-wider mb-8">
                Productivity in 6 months
              </p>
              <div className="w-16 h-px bg-brand-accent mb-8" />
              <p className="text-white/60 text-sm font-light leading-relaxed max-w-sm">
                Three sessions. One 30-year pattern found and dissolved. A business — and a
                life — running at double the pace.
              </p>
            </motion.div>

            {/* Outcomes — the homepage TestimonialSpotlight already carries the
                Sarah M. quote and links here, so this band summarises what
                clients consistently report instead of repeating it. */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.7, delay: 0.15, ease: 'easeOut' as const }}
            >
              <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-8">
                What Clients Report
              </p>
              <ul className="space-y-6 list-none">
                {[
                  'Patterns they had carried for decades — through therapy, books and willpower — finally naming themselves and losing their grip.',
                  'Relationships shifting as old attachment and communication loops dissolve.',
                  'Calm and clarity under pressure where there used to be anxiety and overwhelm.',
                  'Momentum in business and career once the invisible handbrake comes off.',
                ].map((outcome) => (
                  <li key={outcome} className="flex gap-4">
                    <span aria-hidden="true" className="mt-2.5 w-8 h-px bg-brand-accent flex-shrink-0" />
                    <span className="text-lg lg:text-xl font-light text-white/80 leading-relaxed">
                      {outcome}
                    </span>
                  </li>
                ))}
              </ul>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ── Written testimonials grid — light ──────────────────────────── */}
      <section
        aria-labelledby="written-testimonials-heading"
        className="bg-gray-50 py-20 lg:py-32"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-12 lg:mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <p className="text-brand-accent text-xs font-medium uppercase tracking-[0.3em] mb-3">
              In Their Words
            </p>
            <h2
              id="written-testimonials-heading"
              className="text-4xl lg:text-6xl font-light text-brand-primary mb-4"
            >
              What clients say
            </h2>
            <p className="text-gray-500 text-lg font-light max-w-2xl mx-auto">
              From private sessions to group programmes — in their own words, exactly as
              they shared them.
            </p>
          </motion.div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {writtenTestimonials.map(({ quote, name, location }, i) => (
              <motion.figure
                key={`${name}-${location}-${i}`}
                className="relative flex flex-col bg-white border border-gray-100 rounded-card p-8 shadow-sm hover:shadow-2xl hover:border-brand-accent/30 transition-all duration-500 hover:-translate-y-1"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.6, delay: (i % 3) * 0.1, ease: 'easeOut' }}
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 512 512"
                  fill="currentColor"
                  className="w-8 h-8 text-brand-accent/30 mb-6 flex-none"
                >
                  <path d="M464 256h-80v-64c0-35.3 28.7-64 64-64h8c13.3 0 24-10.7 24-24V56c0-13.3-10.7-24-24-24h-8c-88.4 0-160 71.6-160 160v240c0 26.5 21.5 48 48 48h128c26.5 0 48-21.5 48-48V304c0-26.5-21.5-48-48-48zm-288 0H96v-64c0-35.3 28.7-64 64-64h8c13.3 0 24-10.7 24-24V56c0-13.3-10.7-24-24-24h-8C71.6 32 0 103.6 0 192v240c0 26.5 21.5 48 48 48h128c26.5 0 48-21.5 48-48V304c0-26.5-21.5-48-48-48z" />
                </svg>

                <blockquote className="text-gray-600 text-base font-light leading-relaxed flex-1">
                  {quote}
                </blockquote>

                <figcaption className="mt-6 pt-6 border-t border-gray-100">
                  <p className="text-brand-primary font-medium text-sm">{name}</p>
                  <p className="text-gray-400 text-xs mt-0.5">{location}</p>
                </figcaption>
              </motion.figure>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA — dark ───────────────────────────────────────────── */}
      <section
        aria-labelledby="testimonials-cta-heading"
        className="relative w-full bg-brand-primary-900 py-20 lg:py-32 overflow-hidden"
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <div className="absolute bg-brand-accent/10 blur-[160px] rounded-full w-[32rem] h-[32rem] -bottom-40 left-1/2 -translate-x-1/2" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-6"
          >
            Your Turn
          </motion.p>

          <motion.h2
            id="testimonials-cta-heading"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
            className="text-4xl lg:text-6xl font-light text-white leading-[1.1] max-w-3xl mx-auto mb-6"
          >
            Ready to write your own story?
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
            className="text-lg text-white/70 font-light max-w-xl mx-auto leading-relaxed mb-10"
          >
            Start by finding the pattern that&apos;s running your life — it takes two
            minutes and it&apos;s free.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
            className="flex flex-col sm:flex-row justify-center gap-4"
          >
            <Link
              href="/discover-your-pattern"
              className="bg-brand-accent-600 hover:bg-brand-accent-700 text-white px-8 py-4 rounded-button text-sm uppercase tracking-widest font-medium transition-all duration-300 hover:shadow-[0_0_30px_rgba(23,25,244,0.4)] text-center"
            >
              Take the Free Pattern Scan &rarr;
            </Link>
            <Link
              href="/contact"
              className="border border-white/50 hover:border-white text-white/70 hover:text-white px-8 py-4 rounded-button text-sm uppercase tracking-widest font-medium transition-all duration-300 text-center"
            >
              Book a Discovery Call
            </Link>
          </motion.div>
        </div>
      </section>
    </>
  )
}
