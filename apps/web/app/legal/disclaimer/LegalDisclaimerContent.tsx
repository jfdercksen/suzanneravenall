"use client"

import { motion } from 'framer-motion'

const LAST_UPDATED = '29 July 2026'

interface Section {
  title: string
  paragraphs: string[]
}

const sections: Section[] = [
  {
    title: '1. Overview',
    paragraphs: [
      'Welcome to suzanneravenall.com (the "Website"). Please read this Disclaimer before purchasing, accessing, enrolling in or using any sessions, practices, online programmes or content (collectively, the "Services"). The term "You" refers to the user, client or viewer of the Website. The Website and its content are owned by the Ravenall Institute (offices of which reside in South Africa).',
      'By viewing this Website or anything made available on or through this Website — including but not limited to programmes, products, services, opt-in gifts, e-books, videos, webinars, blog posts, newsletters, emails, social media and/or other communication — You are agreeing to accept all parts of this Disclaimer. If You do not agree with the Disclaimer below, You should leave the Website now.',
    ],
  },
  {
    title: '2. For Educational and Informational Purposes Only',
    paragraphs: [
      'The information provided in or through this Website is for educational and informational purposes only, and solely as a self-help tool for your own use. You are welcome to share the Website with your loved ones, friends and beyond — the same Disclaimer remains valid for them as well.',
    ],
  },
  {
    title: '3. No Substitute for Medical Advice',
    paragraphs: [
      'We are not medical doctors, psychologists or medical professionals, nor do we hold ourselves out to be. The information contained in this Website is not intended to be a substitute for medical or mental health treatment, and should not be perceived as or relied upon in any way as medical or mental health advice. The information provided through the Website and Services is not intended to be a substitute for professional medical advice, diagnosis or treatment that can be provided by your own medical doctor, psychologist and/or therapist.',
      'Do not disregard or discontinue professional medical advice, or delay seeking professional advice, because of information You have read on the Website or the Services, or received from us. Do not stop taking any medications without speaking to your health care professional. If You have, or suspect that You have, a medical or mental health issue, contact your own health care provider promptly.',
      'We do not provide health care, medical or nutrition therapy services, and we do not attempt to diagnose, treat, prevent or cure in any manner whatsoever any physical ailment, or any mental or emotional issue, disease or condition. We are not giving medical, psychological or religious advice whatsoever. Although care has been taken in preparing the information provided to You, to the fullest extent permitted by law we cannot be held responsible for any errors or omissions, and we accept no liability whatsoever for any kind of loss or damage You may incur. Always seek medical and/or psychological counsel relating to your specific circumstances for any and all questions and concerns You now have, or may have in the future. You agree that the information on our Website is not medical or psychological advice.',
    ],
  },
  {
    title: '4. Personal Responsibility',
    paragraphs: [
      'You aim to accurately represent the information provided to us on or through our Website. You acknowledge that You are participating voluntarily in using our Website and that You are solely and personally responsible for your choices, actions and results, now and in the future. You accept full responsibility for the consequences of your use, or non-use, of any information provided on or through this Website, and You agree to use your own judgment and due diligence before implementing any idea, suggestion or recommendation from the Website in your life, family, career or business.',
    ],
  },
  {
    title: '5. No Guarantees',
    paragraphs: [
      "When You choose to work with Suzanne, attend a class, or follow an online course, she will always be there to support You. Her role is to accompany and assist You in reaching your own goals, but your success depends primarily on your own effort, motivation, commitment and follow-through. We cannot predict, and do not guarantee, that You will attain a particular result, and You accept and understand that results differ for each individual. Each individual's results depend on his or her unique background, dedication, desire, motivation, actions and numerous other factors. You fully agree that there are no guarantees as to the specific outcome or results You can expect from using the information You receive on or through this Website.",
    ],
  },
  {
    title: '6. Earnings Disclaimer',
    paragraphs: [
      'You acknowledge that we have not made, and do not make, any representations as to the physical health, mental health, emotional health, spiritual or other health benefits, future income, obtaining of any position or promotion, expenses, sales volume or potential profitability or loss of any kind that may be derived as a result of your participation in the Services. We cannot and do not guarantee that You will attain a particular result, positive or negative, financial or otherwise, through the use of the Services, and You accept and understand that results differ for each individual.',
      'We expressly disclaim responsibility in any way for the choices, actions, results, use, misuse or non-use of the information provided or obtained through any of the Services. You agree that your results are strictly your own, and that we are not liable or responsible in any way for your results.',
    ],
  },
  {
    title: '7. Not Legal or Financial Advice',
    paragraphs: [
      'We are not attorneys, accountants or financial advisors, nor do we hold ourselves out to be. The information contained in this Website is not intended to be a substitute for legal or financial advice that can be provided by your own attorney, accountant and/or financial advisor, and should not be perceived or relied upon in any way as business, financial or legal advice.',
      'Always seek financial and/or legal counsel relating to your specific circumstances for any and all questions and concerns You now have, or may have in the future. You agree that the information on our Website is not business, legal or financial advice, and that we are not responsible for your earnings, the success or failure of your professional or business decisions, the increase or decrease of your finances or income level, or any other result of any kind that You may experience as a result of information presented to You through the Website and Services. You are solely responsible for your results.',
    ],
  },
  {
    title: '8. Technology Disclaimer',
    paragraphs: [
      'We try to ensure that the availability and delivery of the Services is uninterrupted and error-free — including our content and communications through the Website, private groups, email communications, videos, audio recordings, webinars, downloadable files, handouts and e-books, or any other materials provided to You. However, we cannot guarantee that your access will not be suspended or restricted from time to time, including to allow for repairs, maintenance or updates, although we will of course try to limit the frequency and duration of any suspension or restriction.',
      'To the fullest extent permitted by law, we will not be liable to You for damages or refunds, or for any other recourse, should the Services become unavailable, or should access to them become slow or incomplete, due to any reason — such as system back-up procedures, internet traffic volume, upgrades, overload of requests to the servers, general network failures or delays, or any other cause which may from time to time make the Services inaccessible to You.',
    ],
  },
  {
    title: '9. Testimonials',
    paragraphs: [
      'We present real-world experiences, testimonials and insights about other people’s experiences with our Website and Services for purposes of illustration only. The testimonials and examples used are of actual clients and results they personally achieved, or they are comments from individuals who can speak to Suzanne’s character and/or the quality of the work (though names and photos may have been changed for anonymity). They are not intended to represent or guarantee that current or future clients will achieve the same or similar results; rather, these testimonials represent what is possible, for illustrative purposes only.',
    ],
  },
  {
    title: '10. Assumption of Risk',
    paragraphs: [
      'As with all situations, there are sometimes unknown individual risks and circumstances that can arise during use of the Website that cannot be foreseen and that can influence or reduce results. You understand that any mention of any suggestion or recommendation on or through the Website is to be taken at your own risk, with no liability on our part, recognising that there is a rare chance that illness, injury or even death could result, and You agree to assume all risks. Do what You feel is right for You — double-check, and ask around if necessary.',
    ],
  },
  {
    title: '11. Limitation of Liability',
    paragraphs: [
      'By using this Website and Services, You agree to absolve us of any liability or loss that You, or any other person, may incur from use of the information, products or materials that You request or receive through or on the Website. You agree that we will not be liable to You, or to any other individual, company or entity, for any type of damages — including direct, indirect, special, incidental, equitable or consequential loss or damages — for use of or reliance on the Website.',
      'You agree that we do not assume liability for accidents, delays, injuries, harm, loss, damage, death, lost profits, personal, professional or business interruptions, misapplication of information, physical or mental disease, condition or issue, or any other type of loss or damage due to any act or default by us or anyone acting as our agent, consultant, affiliate, joint venture partner, employee, shareholder, director, staff, team member, or anyone otherwise affiliated with our business, who is engaged in delivering content on or through this Website or Services.',
      'In any event, our entire liability to You is equal to the value of the goods and/or services paid by You to us during the duration of our contract. Should You not be satisfied with the provided Service, we will refund your money within 7 days, in line with our satisfaction guarantee policy.',
    ],
  },
  {
    title: '12. Indemnification and Release of Claims',
    paragraphs: [
      'You hereby fully and completely hold harmless, indemnify and release us — and any of our agents, consultants, affiliates, joint venture partners, employees, shareholders, directors, staff, team members, or anyone otherwise affiliated with our business — from any and all causes of action, allegations, suits, claims, damages or demands whatsoever, in law or equity, that may arise in the past, present or future, that are in any way related to the Website or Services.',
    ],
  },
  {
    title: '13. No Warranties',
    paragraphs: [
      'We make no warranties related to the performance or operation of the Website and Services. We make no representations or warranties of any kind, express or implied, as to the information, content, materials, programmes, products or services included on or through this Website. To the fullest extent permissible by applicable law, we disclaim all warranties, express or implied, including implied warranties of merchantability and fitness for a particular purpose.',
    ],
  },
  {
    title: '14. Errors and Omissions',
    paragraphs: [
      'Every effort has been made to present You with the most accurate, up-to-date information, but because the nature of scientific research is constantly evolving, we cannot be held responsible or accountable for the accuracy of the content. We make no warranty or guarantee as to the accuracy, timeliness, performance, completeness or suitability of the information in the Services.',
      'You agree that we are not responsible for the views, opinions or accuracy of facts referenced on or through the Services or Website, or for those of any other individual or company affiliated with the business in any way. You acknowledge that such information may inadvertently contain inaccuracies, typographical errors or other errors, and that we are not liable for any such inaccuracies or errors to the fullest extent permitted by law. Should You find a typo, an incongruence or new information You want to share, we would love to hear from You.',
    ],
  },
  {
    title: '15. No Endorsement',
    paragraphs: [
      'References or links in the Website to the information, opinions, advice, programmes, products or services of any other individual, business or entity do not constitute our formal endorsement. We share information that we find worth sharing, for your own self-help only, and we give credit where credit is due. We are not responsible for the website content, blogs, emails, videos, social media, programmes, products and/or services of any other person, business or entity that may be linked or referenced in the Website or Services. Conversely, should a link to this Website appear in any other individual’s, business’s or entity’s website, programme, product or services, it does not constitute a formal endorsement of them, their business or their website either.',
    ],
  },
  {
    title: '16. Affiliates',
    paragraphs: [
      'From time to time, we may promote, affiliate with, or partner with other individuals or businesses whose programmes, products and services align with ours. In the spirit of transparency, we want You to be aware that there may be instances when we promote, market, share or sell programmes, products or services of other partners, and in exchange we may receive financial compensation or other rewards. We are highly selective, and we only promote partners whose programmes, products and/or services we respect.',
      'At the same time, You agree that any such promotion or marketing does not serve as any form of endorsement whatsoever. You are still required to use your own judgment to determine that any such programme, product or service is appropriate for You. You assume all risks, and You agree that we are not liable in any way for any programme, product or service that we may promote, market, share or sell on or through the Website.',
    ],
  },
]

export default function LegalDisclaimerContent() {
  return (
    <>
      {/* Dark hero */}
      <section className="py-20 lg:py-32 bg-brand-primary-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '0px' }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-xs uppercase tracking-[0.3em] font-medium text-brand-accent mb-4">
              Legal
            </p>
            <h1 className="text-4xl lg:text-6xl font-light text-white mb-6">
              Disclaimer
            </h1>
            <p className="text-gray-300 text-sm">
              Sessions, practices &amp; online programmes by Dr. Suzanne Ravenall / Ravenall Institute
            </p>
            <p className="text-gray-300 text-sm mt-1">Last updated: {LAST_UPDATED}</p>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="py-20 lg:py-32 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '0px' }}
            transition={{ duration: 0.6 }}
            className="space-y-12"
          >
            {sections.map((section) => (
              <div key={section.title}>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">{section.title}</h2>
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph.slice(0, 40)} className="text-gray-600 leading-relaxed mb-3">
                    {paragraph}
                  </p>
                ))}
              </div>
            ))}

            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">17. Questions</h2>
              <p className="text-gray-600 leading-relaxed">
                By using the Website You are agreeing to all parts of the above Disclaimer. If You have
                any questions about this Disclaimer, please contact{' '}
                <a
                  href="mailto:admin@ravenallinstitute.com"
                  className="text-brand-accent underline hover:no-underline"
                >
                  admin@ravenallinstitute.com
                </a>
                .
              </p>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  )
}
