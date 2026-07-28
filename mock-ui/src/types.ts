export type Stage =
  | 'gallery'
  | 'entry'
  | 'self'
  | 'desire'
  | 'matches'
  | 'generating'
  | 'reveal'

export type TraitKey =
  | 'openness'
  | 'control'
  | 'warmth'
  | 'mirror'
  | 'risk'

export interface MatchPersona {
  id: string
  name: string
  age: number
  hue: number
  accent: string
  image?: string
}

export interface SessionState {
  displayName: string
  selfAnswers: string[]
  desireAnswers: string[]
  matchAnswers: { personaId: string; label: string }[]
  traitWeights: Record<TraitKey, number>
  lockedPersonaId: string | null
  confidence: number
  systemLogs: string[]
}

export const INITIAL_TRAITS: Record<TraitKey, number> = {
  openness: 0,
  control: 0,
  warmth: 0,
  mirror: 0,
  risk: 0,
}

export function createSession(): SessionState {
  return {
    displayName: '',
    selfAnswers: [],
    desireAnswers: [],
    matchAnswers: [],
    traitWeights: { ...INITIAL_TRAITS },
    lockedPersonaId: null,
    confidence: 62,
    systemLogs: [],
  }
}
