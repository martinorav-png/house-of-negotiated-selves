export type BinaryAnswer = 'yes' | 'no'

export type StationOnePhase =
  | 'name'
  | 'age'
  | 'analysis-intro'
  | 'scan-face'
  | 'scan-eyes'
  | 'scan-focus'
  | 'self-check'
  | 'dissolve'
  | 'calculating'
  | 'complete'

export type StationOneState = {
  phase: StationOnePhase
  name: string
  age: string
  answer: BinaryAnswer | null
}

export type StationOneAction =
  | { type: 'SUBMIT_NAME'; value: string }
  | { type: 'SUBMIT_AGE'; value: string }
  | { type: 'ANSWER'; value: BinaryAnswer }
  | { type: 'ADVANCE' }

const STATION_ONE_ADVANCE: Partial<Record<StationOnePhase, StationOnePhase>> = {
  'analysis-intro': 'scan-face',
  'scan-face': 'scan-eyes',
  'scan-eyes': 'scan-focus',
  'scan-focus': 'self-check',
  dissolve: 'calculating',
  calculating: 'complete',
}

export function createStationOneState(
  overrides: Partial<StationOneState> = {},
): StationOneState {
  return {
    phase: 'name',
    name: '',
    age: '',
    answer: null,
    ...overrides,
  }
}

export function stationOneReducer(
  state: StationOneState,
  action: StationOneAction,
): StationOneState {
  if (action.type === 'SUBMIT_NAME' && state.phase === 'name') {
    const name = action.value.trim()
    return name ? { ...state, name, phase: 'age' } : state
  }

  if (action.type === 'SUBMIT_AGE' && state.phase === 'age') {
    const age = action.value.trim()
    return age ? { ...state, age, phase: 'analysis-intro' } : state
  }

  if (action.type === 'ANSWER' && state.phase === 'self-check') {
    return { ...state, answer: action.value, phase: 'dissolve' }
  }

  if (action.type === 'ADVANCE') {
    const phase = STATION_ONE_ADVANCE[state.phase]
    return phase ? { ...state, phase } : state
  }

  return state
}

export type StationTwoPhase =
  | 'percentile'
  | 'companion-intro'
  | 'debra-brief'
  | 'question'
  | 'height'
  | 'complete'

export type StationTwoQuestion = {
  id: string
  prompt: string
}

export const STATION_TWO_QUESTIONS: StationTwoQuestion[] = [
  { id: 'attractiveness', prompt: 'Is attractiveness important to you?' },
  { id: 'challenge', prompt: 'Should your companion challenge you?' },
  {
    id: 'companionship',
    prompt: 'Would you choose companionship over independence?',
  },
]

export type StationTwoState = {
  phase: StationTwoPhase
  questionIndex: number
  answers: BinaryAnswer[]
  height: number
}

export type StationTwoAction =
  | { type: 'ADVANCE' }
  | { type: 'ANSWER'; value: BinaryAnswer }
  | { type: 'SET_HEIGHT'; value: number }

export function createStationTwoState(
  overrides: Partial<StationTwoState> = {},
): StationTwoState {
  return {
    phase: 'percentile',
    questionIndex: 0,
    answers: [],
    height: 0.5,
    ...overrides,
  }
}

export function stationTwoReducer(
  state: StationTwoState,
  action: StationTwoAction,
): StationTwoState {
  if (action.type === 'ADVANCE') {
    if (state.phase === 'percentile') return { ...state, phase: 'companion-intro' }
    if (state.phase === 'companion-intro') return { ...state, phase: 'debra-brief' }
    if (state.phase === 'debra-brief') return { ...state, phase: 'question' }
    if (state.phase === 'height') return { ...state, phase: 'complete' }
    return state
  }

  if (action.type === 'ANSWER' && state.phase === 'question') {
    const answers = [...state.answers, action.value]
    const questionIndex = state.questionIndex + 1
    return questionIndex >= STATION_TWO_QUESTIONS.length
      ? { ...state, answers, questionIndex, phase: 'height' }
      : { ...state, answers, questionIndex }
  }

  if (action.type === 'SET_HEIGHT' && state.phase === 'height') {
    return { ...state, height: Math.min(1, Math.max(0, action.value)) }
  }

  return state
}

export function sessionPercentile(seed: string): number {
  let hash = 2166136261
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return 12 + ((hash >>> 0) % 85)
}
