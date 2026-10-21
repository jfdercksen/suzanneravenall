/**
 * The intake forms as the client sent them (20 Oct 2026, Shayna), transcribed
 * from docs/content-source/intake-forms/. Seeded into an EMPTY intake-forms
 * collection by payload.config.ts onInit; after that the team owns the forms
 * in the CMS and nothing here overwrites them.
 *
 * Group Family Coaching is a placeholder (scanned PDF, not transcribed yet):
 * inactive, so its purchases get the default form until the team fills it in
 * and switches it on.
 */

type FieldType = 'heading' | 'text' | 'textarea' | 'email' | 'date' | 'select' | 'checkbox-group' | 'scale'

export interface SeedField {
  type: FieldType
  label: string
  helpText?: string
  options?: string
  required?: boolean
  withDetail?: boolean
}

export interface SeedForm {
  title: string
  formKey: string
  active: boolean
  isDefault: boolean
  services: { productHandle: string; label: string; introduction?: string }[]
  intro: string
  acknowledgement: string
  fields: SeedField[]
}

const heading = (label: string): SeedField => ({ type: 'heading', label })
const text = (label: string, extra: Partial<SeedField> = {}): SeedField => ({ type: 'text', label, ...extra })
const long = (label: string, extra: Partial<SeedField> = {}): SeedField => ({ type: 'textarea', label, ...extra })
const ticks = (label: string, options: string[], extra: Partial<SeedField> = {}): SeedField => ({
  type: 'checkbox-group',
  label,
  options: options.join('\n'),
  ...extra,
})

const INTRO =
  'Please fill in the form to the best of your abilities. Leave out items you feel you would prefer not to answer. This is really helpful in understanding how we talk with you, and how we can interact with you through the sessions. This helps us to help you have a great and comfortable experience.'

const INTRO_SHORT = 'Please fill in the form to the best of your abilities.'

const ACKNOWLEDGEMENT =
  'In completing this form and booking the appointment, I acknowledge that any treatment session provided is intended to enhance and assist in releasing mental, emotional, and/or energetic blockages and to assist in creating a new state of mind and awareness that helps in creating a better and healthier life for me. I understand that it is not a substitute for traditional medical treatment or medications. I am aware that the practitioner does not diagnose illness or disease and does not prescribe medications.'

const FEELINGS = [
  'Abused', 'Paranoid', 'Unable to grieve', 'Panic', 'Criticized', 'Overwhelm', 'Apprehensive', 'Intolerant',
  'Overwork', 'Muddled', 'Agitated', 'Uncertainty', 'Paralysed', 'Persecuted', 'Uneasy', 'Aggravated',
  'Depressed', 'Guilty', 'Distress', 'Annoyed', 'Rejected', 'Easily irritated', 'Fearful',
]

const FEELINGS_EXTENDED = [
  'Abused', 'Paranoid', 'Unable to grieve', 'Panic', 'Criticized', 'Overwhelm', 'Apprehensive', 'Intolerant',
  'Overwork', 'Muddled', 'Agitated', 'Uncertainty', 'Paralyzed', 'Persecuted', 'Uneasy', 'Aggravated', 'Guilty',
  'Distress', 'Annoyed', 'Rejected', 'Easily irritated', 'Fearful', 'Angry', 'Despair', 'Anxious', 'Impatient',
  'Outrage', 'Helpless', 'Sad', 'Intimidated', 'Nervous', 'Hopeless', 'Grieving', 'Restless', 'Worried',
]

const MENTAL_HEALTH: SeedField = {
  type: 'select',
  label: 'Do you suffer from psychosis or epilepsy or any mental disorders?',
  options: 'Yes\nNo\nOther',
  withDetail: true,
  helpText: 'If yes or other, please give details.',
}

const READY_TO_CHANGE: SeedField = {
  type: 'scale',
  label: 'On a scale from 1 to 10, how ready are you to change?',
  helpText: '1 is nothing, 10 is fully committed.',
}

const PHONE_HINT = 'Include the country and area code.'

// Personal details shared by the standard and Akashic forms (items 1 to 14).
const PERSONAL_DETAILS: SeedField[] = [
  heading('Personal details'),
  text('Full name, including title, and what you would like to be known as', { required: true }),
  { type: 'email', label: 'Email address', required: true },
  long('Postal address and code'),
  long('Physical address (if different from postal)'),
  text('Telephone (work)', { helpText: PHONE_HINT }),
  text('Telephone (home)', { helpText: PHONE_HINT }),
  text('Mobile number', { helpText: PHONE_HINT, required: true }),
  long('Details of next of kin (emergency contact)'),
  { type: 'date', label: 'Date of birth' },
  text('Current age'),
  text('Relationship status'),
  text('Occupation'),
  text('Are you religious or spiritual? If religious, what denomination are you?'),
  text('How did you find us?', { helpText: 'Internet, RR website, friend, referral. If a referral, from whom?' }),
]

const STANDARD: SeedForm = {
  title: 'Client intake form',
  formKey: 'standard',
  active: true,
  isDefault: true,
  services: [
    // The Rapid Repatterning introduction text is still to come from the client.
    { productHandle: 'rapid-repatterning-session', label: 'Rapid Repatterning Session', introduction: '' },
    { productHandle: 'resonance-repatterning-session', label: 'Resonance Repatterning Session' },
    { productHandle: 'rapid-transformation-therapy-session', label: 'Rapid Transformation Therapy Session' },
    { productHandle: 'exploring-the-alpha-mind-45-minutes', label: 'Exploring the Alpha Mind' },
    { productHandle: 'coaching-support-package', label: 'Coaching Support Package' },
  ],
  intro: INTRO,
  acknowledgement: ACKNOWLEDGEMENT,
  fields: [
    ...PERSONAL_DETAILS,
    long('What other health professional or coach are you seeing to help you with your problem?'),
    heading('Health information'),
    text("Doctor's name and telephone number", { helpText: PHONE_HINT }),
    long('Medications being taken'),
    long('Over-the-counter medications and supplements currently taken'),
    long('Activities that are difficult or limited because of the above. Have you had these problems before, and when?'),
    long('Hereditary illnesses you are aware of'),
    long('How much time do you have for yourself to relax or for hobbies?'),
    long('Do you meditate or practise mindfulness? How long and how often?'),
    long('Do you exercise? How long, how often and what kind?'),
    ticks('Feelings you have experienced in the last few months', FEELINGS, { helpText: 'Tick all that apply.' }),
    long('Health problems in the past'),
    long('Current health problems'),
    text('Hours of sleep a night, and is it restful or interrupted?'),
    long('Any pain you are experiencing: mental, emotional or physical'),
    heading('Areas of stress you currently experience'),
    { type: 'scale', label: 'Family', helpText: '1 is minimal, 10 is the worst.' },
    { type: 'scale', label: 'Relationship', helpText: '1 is minimal, 10 is the worst.' },
    { type: 'scale', label: 'Financial', helpText: '1 is minimal, 10 is the worst.' },
    { type: 'scale', label: 'Health', helpText: '1 is minimal, 10 is the worst.' },
    { type: 'scale', label: 'Other', helpText: '1 is minimal, 10 is the worst.', withDetail: true },
    MENTAL_HEALTH,
    heading('Your family'),
    long('Significant members of your family and the quality of your relationship with them'),
    heading('Information about your problem'),
    long('Fears or phobias (water, stairs and so on)'),
    long('What would you like to work on in your session?', { required: true }),
    long('Symptoms, triggers or habits related to the problem'),
    long('What would your life look like after the problem?'),
    long('What have you done to get rid of the problem? What worked and what did not?'),
    heading('Information needed for the session'),
    READY_TO_CHANGE,
  ],
}

const EXECUTIVE: SeedForm = {
  title: 'Client history: Executive and Transformational Coaching',
  formKey: 'executive-transformational-coaching',
  active: true,
  isDefault: false,
  services: [
    { productHandle: 'executive-coaching-30-mins', label: 'Executive Coaching Session' },
    { productHandle: 'transformation-coaching-60-mins', label: 'Transformation Coaching Session' },
  ],
  intro: INTRO,
  acknowledgement: ACKNOWLEDGEMENT,
  fields: [
    heading('Personal details'),
    text('Full name', { required: true }),
    long('Physical address, including postal code'),
    long('Postal address, including postal code'),
    text('Telephone (work)', { helpText: PHONE_HINT }),
    text('Mobile number', { helpText: PHONE_HINT, required: true }),
    { type: 'email', label: 'Email address', required: true },
    long('Details of next of kin (emergency contact)'),
    { type: 'date', label: 'Date of birth' },
    text('Current age'),
    text('Occupation'),
    text('Relationship status'),
    text('Are you religious or spiritual? If religious, what denomination are you?'),
    ticks('How did you find us?', ['Internet', 'Website', 'Friend', 'Referral', 'I know Suzanne', 'Social media'], {
      helpText: 'Tick all that apply. For a website or social media, tell us which one in the box below.',
      withDetail: true,
    }),
    text('If a referral, who referred you?'),
    heading('Your history'),
    long('Describe the challenge(s) for which you are seeking assistance, with dates', { required: true }),
    long('Past medical history: injuries, accidents, surgeries, trauma, with approximate dates'),
    MENTAL_HEALTH,
    long('Medications and supplements (including over the counter) presently taken'),
    long('Any pain you are experiencing: physical, mental or emotional'),
    text("Doctor's name and telephone number", { helpText: PHONE_HINT }),
    long('Activities that are more difficult or limited because of the above. Have you had these problems before, and when?'),
    long('Hereditary illness you are aware of'),
    long('How much time do you have for yourself to relax or for hobbies?'),
    long('Do you meditate or practise mindfulness? How long and how often?'),
    long('Do you exercise? How often and what?'),
    text('Hours of sleep a night, and is it restful or interrupted?'),
    ticks('Feelings you have experienced in the last few months', FEELINGS_EXTENDED, { helpText: 'Tick all that apply.' }),
    long('Fears or phobias (water, stairs and so on)'),
    long('Significant members of your family and the status of your relationship with them'),
    ticks('Stresses you currently experience', ['Family', 'Relationship', 'Work', 'Financial', 'Health', 'Other'], {
      helpText: 'Tick all that apply, and tell us more in the box below.',
      withDetail: true,
    }),
    heading('Your sessions'),
    long('What are the goals of your sessions?', { required: true }),
    long('What other professional coach are you seeing to help you with your problem?'),
    long('What would you like to work on in your session(s)?'),
    long('What have you done to get rid of the challenges? What worked and what did not?'),
    long('Symptoms, triggers or habits related to the challenge'),
    long('What would your life look like after the challenge is resolved?'),
    READY_TO_CHANGE,
  ],
}

const AKASHIC: SeedForm = {
  title: 'Client history: Akashic Coaching',
  formKey: 'akashic-coaching',
  active: true,
  isDefault: false,
  services: [{ productHandle: 'akashic-clearing-session', label: 'Akashic Coaching Session' }],
  intro: INTRO_SHORT,
  acknowledgement:
    'In filling this form and booking the appointment, I acknowledge that any treatment session provided is intended to enhance and assist in releasing mental, emotional, energetic blockages and to assist in creating a new state of mind and awareness that helps in creating a better and healthier life for me. I understand that it is not a substitute for traditional medical treatment or medications. I am aware that the practitioner does not diagnose illness or disease and does not prescribe medications.',
  fields: [
    ...PERSONAL_DETAILS,
    heading('About your problem'),
    long('Describe the problem(s) for which you are seeking assistance, with dates', { required: true }),
    ticks('Feelings you have experienced in the last few months', FEELINGS, { helpText: 'Tick all that apply.' }),
    long('What are the goals of your treatment?'),
    long('What other health professional or coach are you seeing to help you with your problem?'),
    long('What would you like to work on in your session?'),
    long('What have you done to get rid of the problem? What worked and what did not?'),
    long('Symptoms, triggers or habits related to the problem'),
    long('What would your life look like after the problem?'),
    heading('Information needed for the session'),
    READY_TO_CHANGE,
  ],
}

const ENERGY_CLEARING: SeedForm = {
  title: 'Client intake form: Energy Clearing',
  formKey: 'energy-clearing',
  active: true,
  isDefault: false,
  services: [{ productHandle: 'energetic-clearing-completed-remotely', label: 'Energetic Clearing' }],
  intro: INTRO_SHORT,
  acknowledgement: AKASHIC.acknowledgement,
  fields: [
    heading('Personal details'),
    long('Full name, including middle names, and your birth name in full if you have changed it', { required: true }),
    long('Physical address, including postal code', { required: true }),
    long('Postal address, including postal code', { required: true }),
    text('Telephone (work)', { helpText: PHONE_HINT }),
    text('Telephone (home)', { helpText: PHONE_HINT }),
    text('Mobile number', { helpText: PHONE_HINT, required: true }),
    { type: 'date', label: 'Date of birth', required: true },
    text('Current age', { required: true }),
    text('Occupation', { required: true }),
    text('Relationship status'),
    text('Are you religious or spiritual? If religious, what denomination are you?'),
    ticks(
      'How did you find us?',
      ['Internet', 'RPA website', 'RR website', 'Friend', 'Referral', 'Suzanne Ravenall website', 'Ravenall Institute website'],
      { helpText: 'Tick all that apply.' },
    ),
    text('If a referral, who referred you?'),
    heading('About the clearing'),
    ticks('Feelings you have experienced in the last few months', FEELINGS, { helpText: 'Tick all that apply.' }),
    long('What are the problems you are currently experiencing that led you to book this clearing?'),
    long('Any problem people, and your relationship with them', { required: true }),
    long('What other health professional or coach are you seeing to help you with your problem?'),
    long('What have you done to get rid of the problem? What worked and what did not?'),
    long('Symptoms, triggers or habits related to the problem', { required: true }),
    long('What would your life look like after the problem?', { required: true }),
    { ...READY_TO_CHANGE, required: true },
  ],
}

const GROUP_FAMILY: SeedForm = {
  title: 'Client history: Group Family Coaching',
  formKey: 'group-family-coaching',
  // Placeholder until the scanned form is transcribed: inactive, so these
  // purchases get the default form meanwhile.
  active: false,
  isDefault: false,
  services: [{ productHandle: 'group-family-coaching-60-mins', label: 'Group Family Coaching' }],
  intro: INTRO,
  acknowledgement: ACKNOWLEDGEMENT,
  fields: [heading('Questions to follow'), long('Anything you would like us to know before the session')],
}

export const INTAKE_FORM_SEEDS: SeedForm[] = [STANDARD, EXECUTIVE, AKASHIC, ENERGY_CLEARING, GROUP_FAMILY]
