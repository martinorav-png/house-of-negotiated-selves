import type { MatchPersona } from '../types'

/** Entrance on-screen copy only. Spoken entrance monologue stays out of mock UI. */
export const DEBRA_INTRO_LEAD = 'Welcome to the installation.'
export const DEBRA_INTRO_ITALIC = 'I am Debra, your guide.'
export const DEBRA_INTRO_SUB = "Let's begin your intake."

/** Word-for-word from userjourney2.pdf Matchmaker script board. */
export const DEBRA_STATION = {
  selfHowTo:
    'Now, just answer what comes up on the mirror. You can type it out on the keyboard in front of you',
  selfPhoto:
    'To find your perfect match, we need to get to know you more deeply. First, let me get a better look at you, so I can match that face to those interesting hobbies of yours. Smile for the camera',
  selfDone:
    "Great! Now, go head to the next station. Keep walking and turn on your right. I've got some thinking to do...",
  desireIntro:
    "Now that I know who you are, let's talk about your potential match. Spill the tea, what's your dream partner like?",
  desireDone:
    "Mm. I like where this is going. We are done here, move to the next station. One more stop, and I'll have everything I need.",
  station3Intro:
    'To really understand you, I need to know: what kind of life have you envisioned with your future partner?',
  station3Done: 'Okay. We are done here, I think I found your one. Are you ready to meet them?',
  chamberInvite:
    "They're waiting for you, just a few steps away, go trough the curtains",
} as const

export type StationStepKind =
  | 'text'
  | 'textarea'
  | 'chips'
  | 'photo'
  | 'slider'
  | 'yesno'
  | 'blanks'

export interface StationStep {
  prompt: string
  placeholder?: string
  fieldLabel?: string
  kind: StationStepKind
  chips?: string[]
  blanks?: { key: string; label: string; placeholder: string }[]
  slider?: { min: number; max: number; unit: string; defaultValue: number }
  debra?: string
  log?: string
  stranger?: boolean
}

export const SELF_STEPS: StationStep[] = [
  {
    prompt: 'What is your full government name.',
    placeholder: 'Type your full government name...',
    fieldLabel: 'Government name',
    kind: 'text',
    debra: DEBRA_STATION.selfHowTo,
    log: 'identity label captured',
  },
  {
    prompt: 'Date of birth',
    placeholder: 'DD / MM / YYYY',
    fieldLabel: 'Date of birth',
    kind: 'text',
    log: 'date of birth logged',
  },
  {
    prompt: 'What is your orientation',
    kind: 'chips',
    chips: [
      'Heterosexual',
      'Homosexual',
      'Bisexual',
      'Pansexual',
      'Asexual',
      'Questioning',
      'Prefer not to say',
    ],
    log: 'orientation logged',
  },
  {
    prompt: 'What are your hobbies',
    placeholder: 'List a few hobbies...',
    fieldLabel: 'Hobbies',
    kind: 'textarea',
    log: 'hobbies logged',
  },
  {
    prompt: 'What do you do',
    placeholder: 'Work, study, or something else...',
    fieldLabel: 'Occupation',
    kind: 'text',
    log: 'occupation logged',
  },
  {
    prompt: 'Religion',
    placeholder: 'Religion, belief, or none...',
    fieldLabel: 'Religion',
    kind: 'text',
    log: 'religion logged',
  },
  {
    prompt: 'Nationality',
    placeholder: 'Nationality...',
    fieldLabel: 'Nationality',
    kind: 'text',
    log: 'nationality logged',
  },
  {
    prompt: 'Picture',
    kind: 'photo',
    debra: DEBRA_STATION.selfPhoto,
    log: 'ID ringlight status: active',
  },
]

export const DESIRE_STEPS: StationStep[] = [
  {
    prompt: 'Introverted or extroverted, or sth in between?',
    kind: 'chips',
    chips: ['Introverted', 'Extroverted', 'Something in between'],
    debra: DEBRA_STATION.desireIntro,
    log: 'avatar pipeline: queued',
  },
  {
    prompt: 'What is their life style, athlete, creative etc',
    kind: 'chips',
    chips: ['Athlete', 'Creative', 'Academic', 'Homebody', 'Social butterfly', 'Work-first'],
    log: 'lifestyle preference logged',
  },
  {
    prompt: 'Personality base, how do they talk, flirty, calm and collected,',
    kind: 'chips',
    chips: ['Flirty', 'Calm and collected', 'Dry humor', 'Warm and earnest', 'Sharp and teasing'],
    log: 'personality preference logged',
  },
  {
    prompt: 'Age range',
    kind: 'chips',
    chips: ['18-24', '25-34', '35-44', '45-54', '55+', 'No preference'],
    log: 'age range logged',
  },
  {
    prompt: 'Height slider',
    kind: 'slider',
    slider: { min: 140, max: 210, unit: 'cm', defaultValue: 170 },
    log: 'height preference logged',
  },
  {
    prompt: 'Which hair color would you love to wake up next to',
    kind: 'chips',
    chips: ['Black', 'Brown', 'Blonde', 'Red', 'Grey', 'Any'],
    stranger: true,
    debra: DEBRA_STATION.desireDone,
    log: 'candidate silhouette seeded',
  },
]

export const STATION3_STEPS: StationStep[] = [
  {
    prompt:
      'Our perfect morning/date would be us going to ______ then doing ______ and then having _______',
    kind: 'blanks',
    blanks: [
      { key: 'going', label: 'going to', placeholder: '...' },
      { key: 'doing', label: 'then doing', placeholder: '...' },
      { key: 'having', label: 'then having', placeholder: '...' },
    ],
    debra: DEBRA_STATION.station3Intro,
    log: 'life vision draft logged',
  },
  {
    prompt: 'What is your dealbreaker/nonnegotiable, the partner needs to be/have____',
    placeholder: 'They need to be / have...',
    fieldLabel: 'Dealbreaker',
    kind: 'text',
    stranger: true,
    log: 'dealbreaker logged',
  },
  {
    prompt: 'Would your want this person to be your ride or die?',
    kind: 'yesno',
    stranger: true,
    log: 'polygraph: ride or die',
  },
  {
    prompt: 'Would they kill for you?',
    kind: 'yesno',
    stranger: true,
    log: 'polygraph: would they kill for you',
  },
  {
    prompt: 'Do you expect them to kill for you?',
    kind: 'yesno',
    stranger: true,
    debra: DEBRA_STATION.station3Done,
    log: 'polygraph: expect them to kill for you',
  },
]

/** Reveal visual seed only. Station 3 questionnaire no longer uses persona chat. */
export const MATCH_PERSONAS: MatchPersona[] = [
  {
    id: 'mira',
    name: 'Mira',
    age: 27,
    hue: 145,
    accent: 'var(--phosphor)',
    image: '/assets/personas/persona-1.png',
  },
  {
    id: 'vale',
    name: 'Vale',
    age: 31,
    hue: 35,
    accent: 'var(--amber)',
    image: '/assets/personas/persona-2.png',
  },
  {
    id: 'ren',
    name: 'Ren',
    age: 24,
    hue: 160,
    accent: 'var(--phosphor)',
    image: '/assets/personas/persona-3.png',
  },
  {
    id: 'sol',
    name: 'Sol',
    age: 29,
    hue: 12,
    accent: 'var(--alert)',
    image: '/assets/personas/persona-4.png',
  },
  {
    id: 'kai',
    name: 'Kai',
    age: 33,
    hue: 200,
    accent: 'var(--amber)',
    image: '/assets/personas/persona-5.png',
  },
]

export function seedPersonaFromAnswers(answers: string[]): string {
  const seed = answers.join('|')
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = (hash + seed.charCodeAt(i) * (i + 1)) % 997
  return MATCH_PERSONAS[hash % MATCH_PERSONAS.length]?.id ?? 'mira'
}
