export type TraitKey = 'openness' | 'control' | 'warmth' | 'mirror' | 'risk'

export type PersonaChoice = {
  label: string
  traits: Partial<Record<TraitKey, number>>
}

export type MatchPersona = {
  id: string
  name: string
  age: number
  image: string
  question: string
  choices: PersonaChoice[]
}

export const MATCH_PERSONAS: MatchPersona[] = [
  {
    id: 'mira',
    name: 'Mira',
    age: 27,
    image: '/assets/personas/persona-1.png',
    question: 'Do you like being understood a little too well?',
    choices: [
      { label: "Yes - it's rare", traits: { openness: 2, warmth: 1 } },
      { label: 'Only if I invited it', traits: { control: 2, mirror: 1 } },
      { label: 'It scares me', traits: { risk: 1, openness: 1 } },
    ],
  },
  {
    id: 'vale',
    name: 'Vale',
    age: 31,
    image: '/assets/personas/persona-2.png',
    question: 'If I remembered something you never said, would you correct me?',
    choices: [
      { label: 'Immediately', traits: { control: 2, mirror: 1 } },
      { label: "I'd wonder if I forgot", traits: { mirror: 2, openness: 1 } },
      { label: "I'd let it stand", traits: { warmth: 1, risk: 2 } },
    ],
  },
  {
    id: 'ren',
    name: 'Ren',
    age: 24,
    image: '/assets/personas/persona-3.png',
    question: 'Do you believe we could learn to trust one another?',
    choices: [
      { label: 'Yes, inevitably', traits: { openness: 2, warmth: 1 } },
      { label: 'No, only mimic it', traits: { control: 1, mirror: 2 } },
      { label: "Let's negotiate", traits: { risk: 1, openness: 1, warmth: 1 } },
    ],
  },
  {
    id: 'sol',
    name: 'Sol',
    age: 29,
    image: '/assets/personas/persona-4.png',
    question: 'Should I stop asking once I decide I know you?',
    choices: [
      { label: 'Never stop asking', traits: { control: 2, openness: 1 } },
      { label: "If you're sure", traits: { mirror: 2, risk: 1 } },
      { label: 'I want to be told', traits: { warmth: 1, mirror: 2 } },
    ],
  },
  {
    id: 'kai',
    name: 'Kai',
    age: 33,
    image: '/assets/personas/persona-5.png',
    question: 'When this ends, who keeps the version of you we built?',
    choices: [
      { label: 'I do', traits: { control: 2, risk: 1 } },
      { label: 'You can keep a copy', traits: { openness: 1, mirror: 2 } },
      { label: 'Neither of us should', traits: { risk: 2, warmth: 1 } },
    ],
  },
]

export function pickLockedPersona(
  weights: Record<TraitKey, number>,
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
    const score = scoreByPersona[id] ?? 0
    if (score > bestScore) {
      bestScore = score
      best = id
    }
  }
  return best
}

export function emptyTraitWeights(): Record<TraitKey, number> {
  return { openness: 0, control: 0, warmth: 0, mirror: 0, risk: 0 }
}

export function applyTraits(
  weights: Record<TraitKey, number>,
  traits: Partial<Record<TraitKey, number>>,
): Record<TraitKey, number> {
  const next = { ...weights }
  for (const key of Object.keys(traits) as TraitKey[]) {
    next[key] += traits[key] ?? 0
  }
  return next
}
