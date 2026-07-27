import type { MatchPersona } from '../types'

export const DEBRA_INTRO_LEAD = 'Welcome to the installation.'
export const DEBRA_INTRO_ITALIC = 'I am Debra, your guide.'
export const DEBRA_INTRO_SUB = "Let's begin your intake."

export const SELF_STEPS: {
  prompt: string
  placeholder?: string
  kind: 'text' | 'chips' | 'photo' | 'voice' | 'textarea'
  chips?: string[]
  debra?: string
  log?: string
}[] = [
  {
    prompt: 'What should we call you — for now?',
    placeholder: 'A name, nickname, or alias…',
    kind: 'text',
    debra: 'I already like the sound of that.',
  },
  {
    prompt: 'Describe your current state of being.',
    placeholder: 'I feel...',
    kind: 'textarea',
    chips: ['Harmonious', 'Restless', 'Seeking', 'Numb', 'Overwhelmed'],
    debra: 'Take your time — we’re listening carefully.',
    log: 'Voice recording active... hesitation noted.',
  },
  {
    prompt: 'ID capture — hold still for the ringlight.',
    kind: 'photo',
    debra: 'There you are. We’ll keep this frame.',
    log: 'ID ringlight status: active',
  },
  {
    prompt: 'Voice sample — say anything you like for about ten seconds.',
    kind: 'voice',
    debra: 'Your voice is soft data. Precious data.',
    log: 'voice sample captured',
  },
  {
    prompt: 'When was the last time you pretended to be someone else online?',
    kind: 'chips',
    chips: [
      'Never consciously',
      'For safety',
      'For fun',
      'I don’t remember',
      'I’m doing it now',
    ],
    debra: 'No wrong answers. Only useful ones.',
    log: 'unsettling probe logged',
  },
]

export const DESIRE_STEPS: {
  prompt: string
  chips: string[]
  debra?: string
  stranger?: boolean
  log?: string
}[] = [
  {
    prompt: 'What is the texture of the presence you seek?',
    chips: ['Rough & grounding', 'Silken & ethereal', 'Warm & weightless'],
    debra: 'Assembling a candidate... analyzing patterns.',
    log: 'avatar pipeline: queued',
  },
  {
    prompt: 'In a partner, you need more…',
    chips: ['Warmth', 'Clarity', 'Mystery', 'Control', 'Mirroring'],
    debra: 'Desire is just preference with better lighting.',
  },
  {
    prompt: 'Would you rather be understood accurately, or kindly?',
    chips: ['Accurately', 'Kindly', 'Both — insist on it', 'Neither — surprise me'],
    stranger: true,
    debra: 'Interesting. Most people flinch here.',
  },
  {
    prompt: 'If a match already knew what you’d say next — is that intimacy or theft?',
    chips: ['Intimacy', 'Theft', 'Depends who benefits', 'I want that anyway'],
    stranger: true,
    debra: 'We’re almost ready to introduce you.',
    log: 'candidate silhouette seeded',
  },
]

export const MATCH_PERSONAS: MatchPersona[] = [
  {
    id: 'mira',
    name: 'Mira',
    age: 27,
    hue: 350,
    accent: '#ff7f7f',
    image: '/stitch/03-matches-asset-1.jpg',
    question: 'Do you like being understood a little too well?',
    choices: [
      { label: 'Yes — it’s rare', traits: { openness: 2, warmth: 1 } },
      { label: 'Only if I invited it', traits: { control: 2, mirror: 1 } },
      { label: 'It scares me', traits: { risk: 1, openness: 1 } },
    ],
  },
  {
    id: 'vale',
    name: 'Vale',
    age: 31,
    hue: 8,
    accent: '#a43a3d',
    image: '/stitch/03-matches-asset-2.jpg',
    question: 'If I remembered something you never said, would you correct me?',
    choices: [
      { label: 'Immediately', traits: { control: 2, mirror: 1 } },
      { label: 'I’d wonder if I forgot', traits: { mirror: 2, openness: 1 } },
      { label: 'I’d let it stand', traits: { warmth: 1, risk: 2 } },
    ],
  },
  {
    id: 'ren',
    name: 'Ren',
    age: 24,
    hue: 18,
    accent: '#ff5c47',
    image: '/stitch/03-matches-asset-3.jpg',
    question: 'Do you believe we could learn to trust one another?',
    choices: [
      { label: 'Yes, inevitably', traits: { openness: 2, warmth: 1 } },
      { label: 'No, only mimic it', traits: { control: 1, mirror: 2 } },
      { label: 'Let’s negotiate', traits: { risk: 1, openness: 1, warmth: 1 } },
    ],
  },
  {
    id: 'sol',
    name: 'Sol',
    age: 29,
    hue: 5,
    accent: '#b52619',
    image: '/stitch/03-matches-asset-4.jpg',
    question: 'Should I stop asking once I decide I know you?',
    choices: [
      { label: 'Never stop asking', traits: { control: 2, openness: 1 } },
      { label: 'If you’re sure', traits: { mirror: 2, risk: 1 } },
      { label: 'I want to be told', traits: { warmth: 1, mirror: 2 } },
    ],
  },
  {
    id: 'kai',
    name: 'Kai',
    age: 33,
    hue: 340,
    accent: '#ff7f7f',
    image: '/stitch/03-matches-asset-5.jpg',
    question: 'When this ends, who keeps the version of you we built?',
    choices: [
      { label: 'I do', traits: { control: 2, risk: 1 } },
      { label: 'You can keep a copy', traits: { openness: 1, mirror: 2 } },
      { label: 'Neither of us should', traits: { risk: 2, warmth: 1 } },
    ],
  },
]

export const TRAIT_LABELS: Record<string, string> = {
  openness: 'openness',
  control: 'control',
  warmth: 'warmth',
  mirror: 'mirror',
  risk: 'risk',
}

export function pickLockedPersona(
  weights: Record<string, number>,
  answeredIds: string[],
): string {
  const scoreByPersona: Record<string, number> = {
    mira: weights.openness + weights.warmth,
    vale: weights.control + weights.mirror,
    ren: weights.openness + weights.warmth + weights.risk,
    sol: weights.mirror + weights.risk,
    kai: weights.control + weights.risk,
  }

  let best = answeredIds[0] ?? 'mira'
  let bestScore = -1
  for (const id of answeredIds) {
    const s = scoreByPersona[id] ?? 0
    if (s >= bestScore) {
      bestScore = s
      best = id
    }
  }
  return best
}
