/**
 * Suzanne's booking terms, in her wording, from the "Terms and Conditions &
 * Waiver" on her current site (https://suzanneravenall.com/terms-and-conditions/,
 * read 25 Nov 2026). Her instruction of 24 Nov: "it is on the current site
 * please check and move these documents across it is under terms and
 * conditions of booking ... and can be seen when they accept it when they
 * check out and they can expand it if they want to".
 *
 * One source for /legal/terms and the expandable panel under the checkout
 * tick, so both show the same words. Only spelling and typing slips were
 * corrected (listed in docs/golive/A3-A5-before-after.md); nothing was added.
 */

export const REFUND_TERMS_TITLE = 'Return and Refunds policy'

/** Her clause, word for word. */
export const REFUND_TERMS =
  'The provision of goods and services by The Ravenall Institute Pty Ltd is subject to availability. In cases of unavailability, we will refund the client in full within 30 days. Cancellation of orders by the client after the purchase has been made will attract a 3% administration fee and if the courier has already dispatched the goods the cost of the courier.'

export const MEDIA_TERMS_TITLE = 'Events, photos and recordings'

export const MEDIA_TERMS =
  'As an attendee of an Event you may have been captured by us in a photo or video (including any audio recorded in the video) (collectively "Media") which Media has recorded your image, likeness or voice. With regard to the Media, you agree that you now grant to The Ravenall Institute a non-exclusive, perpetual, royalty free, sublicensable, license to copy, distribute and/or create derivative works of the Media and, to use such Media in the promotion of, including the sale of, the Ravenall Institute events, course or any future events or courses. Notwithstanding the foregoing, should you wish to not grant the foregoing license, you may send a request to opt out of such a license by sending an email to support@ravenallinstitute.com with your name, phone number and a recent photo of yourself and we will use a reasonably commercial effort to comply with your request but are unable to guarantee as such.'

export const LIVE_TERMS_TITLE = 'Live programs'

export const LIVE_TERMS_INTRO =
  'By signing up and purchasing a live online course as taught by an Instructor of the Ravenall Institute, you understand that there are certain limitations to learning in a Live online format as well as certain privacy limitations. In order to attend any event, or any other similar course, you agree to all the terms laid out below for as long as you continue to attend and partake in the courses.'

/** Her list, in her order. "(practitioner programme)" marks are hers. */
export const LIVE_TERMS: readonly string[] = [
  'I will keep my video on for the duration of the course so the Instructor can see me.',
  'I will keep my sound muted except when I have a question or when the Instructor asks me a question.',
  'I will ensure that I am in an environment where background noise will be negligible / minimal disruption when I am asked to participate or have a question.',
  'I will not step away from my computer during class time. (practitioner programme)',
  'I will watch the class in an environment where I will minimize any distractions or interruptions.',
  'I will keep my phone off during class to prevent me from being distracted or disturbing others.',
  'I will not use the chat window on Zoom for my comments other than those that are relevant to the topic.',
  'I will participate to the best of my ability when the Instructor asks for active participation.',
  'I will be in attendance for the entire duration of the course. If I cannot be in full attendance, I must consider registering for another course where I can attend in full. (practitioner programme)',
  'I will not video record all or any part of the course.',
  'I will not share any of the course material I receive before, during or after the course with any other person or parties who were not also in attendance at the same course.',
  'I will not share any course recordings that I receive with any other person or parties who were not also in attendance at the same course.',
  'I understand that in the event that a bad internet connection or power outage causes me to miss portions of the course, I may not graduate from the course unless I retake the portions of the course that I missed from the Instructor at a later date. If the portions of the course that I missed are not substantial or critical, I may request from the Instructor a recording of the portions I missed. (practitioner programme)',
  'I understand that the online course, facilitated by Zoom or similar mechanism, will be recorded by the Instructor and I consent to my voice, video and likeness being included in the recording.',
  'I understand that the video and/or audio recording of the course may be uploaded and shared, re-sold, or re-packaged on other media platforms, so future students may benefit from the course material, and I consent to my voice, recordings and likeness being in all recordings that are shared, re-sold, or re-packaged. And I agree that I earn no income in relation to such sale or sharing and have no entitlement to such.',
  'I understand that if there is any Protected Health Information (PHI) or Personally Identifiable Information (PII) that I choose to share, that it will be a part of the recording and I have consented as such. I hold harmless the Instructor and the organization for any information that may be shared by other students regarding the PHI and PII that I share.',
  'I understand that other students or volunteers may share their own PHI and PII during the course and I agree to respect their privacy and confidentiality and will not share those details in any manner such as but not limited to: verbal, electronic or written format.',
  "Because the course will be conducted through Zoom/similar media and the recording of the course may be temporarily stored on the Zoom cloud, I acknowledge and agree to the terms of Zoom's/similar Privacy Policy.",
  'I understand and hereby consent that there is a risk that another student could abuse their access to recordings of the course constituting a violation of the Student Waiver and take, use and reproduce photographs and audio and/or video recordings against my consent. No claim of any kind will be made by me against the Instructor or the organization because of or arising out of the taking and use of these images, video, or audio by a student. This release is given in exchange for valuable consideration, including the course to which it applies.',
  'I understand that this release is binding upon me, and my heirs, legal representatives, and assigns.',
  "I understand that a company representative may attend portions of the Instructor's course, and I am willing to allow for this minor disruption.",
  'I understand that the live online teaching format creates the possibility of technological challenges that may not be present in a live, in-person course; as such, I understand that the online course may not run completely smoothly or without disruptions.',
  'I understand that having a reliable internet connection and knowing how to operate and connect through the Zoom video conferencing/similar software is my responsibility. If I have issues, I will not hold the Instructor or the organization liable.',
  "I understand that if I miss significant (as determined by the Instructor) portions of the course due to internet or technology issues on my side, that I may not graduate or receive CEU credits for the course and it will be the Instructor's determination as to whether or not I am able to receive a refund or if I may monitor (re-take) a future course or portions of a future course at a reduced cost.",
  'I understand that in order for the Instructor or course Coordinator to give me the Zoom/similar link to attend courses and events, I must accept a copy of these terms and conditions related to any courses or events I plan to attend.',
  "If I receive audio and/or video recordings/ course content from the course from the Instructor or Coordinator, I agree that the recording shall be used solely for the purposes of individual private study by me, and that the recording(s) / content shall not be sold, shared, transferred, re-recorded, or published in any way. If recordings have been provided or downloaded I agree to destroy the recordings when they are no longer needed for purposes of my private study and within the time period provided. I acknowledge that abuse of the privilege to utilize audio and/or video recordings of the course material constitutes a violation of the organization's policies, as well as a violation of international guidelines that respect student confidentiality and privacy. I acknowledge that such violations will, at a minimum, result in the loss of such privileges in the future with any Instructor, and may involve legal action.",
]

/** Her live-training paragraph from the current Privacy Policy, word for word. */
export const LIVE_TRAINING_PRIVACY =
  'In respect to live training programs that you attend. Video and/or audio recording of the course may be uploaded and shared, re-sold, or re-packaged on other media platforms, so future students may benefit from the course material, and by attending you consent to your voice and likeness being in all recordings that are shared, re-sold, or re-packaged. And you agree that you earn no income or have such entitlement in relation to such content sale or sharing.'
