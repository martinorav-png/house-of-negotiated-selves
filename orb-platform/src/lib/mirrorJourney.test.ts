import { describe, expect, it } from 'vitest'
import {
  STATION_TWO_QUESTIONS,
  createStationOneState,
  createStationTwoState,
  sessionPercentile,
  stationOneReducer,
  stationTwoReducer,
} from './mirrorJourney'

describe('stationOneReducer', () => {
  it('keeps blank names on the name phase', () => {
    const state = createStationOneState()

    expect(stationOneReducer(state, { type: 'SUBMIT_NAME', value: '   ' })).toEqual(state)
  })

  it('moves submitted identity data into facial analysis', () => {
    const named = stationOneReducer(createStationOneState(), {
      type: 'SUBMIT_NAME',
      value: '  Ada  ',
    })
    const aged = stationOneReducer(named, { type: 'SUBMIT_AGE', value: '34' })

    expect(named).toMatchObject({ phase: 'age', name: 'Ada' })
    expect(aged).toMatchObject({ phase: 'analysis-intro', age: '34' })
  })

  it('runs the complete analysis and dissolve sequence in order', () => {
    let state = createStationOneState({ phase: 'analysis-intro', name: 'Ada', age: '34' })
    const phases = []

    for (let step = 0; step < 4; step += 1) {
      state = stationOneReducer(state, { type: 'ADVANCE' })
      phases.push(state.phase)
    }

    state = stationOneReducer(state, { type: 'ANSWER', value: 'yes' })
    phases.push(state.phase)
    state = stationOneReducer(state, { type: 'ADVANCE' })
    phases.push(state.phase)
    state = stationOneReducer(state, { type: 'ADVANCE' })
    phases.push(state.phase)

    expect(phases).toEqual([
      'scan-face',
      'scan-eyes',
      'scan-focus',
      'self-check',
      'dissolve',
      'calculating',
      'complete',
    ])
    expect(state.answer).toBe('yes')
  })
})

describe('stationTwoReducer', () => {
  it('asks the approved questions before opening the height control', () => {
    expect(STATION_TWO_QUESTIONS.map((question) => question.prompt)).toEqual([
      'Is attractiveness important to you?',
      'Should your companion challenge you?',
      'Would you choose companionship over independence?',
    ])

    let state = createStationTwoState()
    const introductionPhases = []
    for (let step = 0; step < 3; step += 1) {
      state = stationTwoReducer(state, { type: 'ADVANCE' })
      introductionPhases.push(state.phase)
    }

    expect(introductionPhases).toEqual(['companion-intro', 'debra-brief', 'question'])
    expect(state.phase).toBe('question')

    state = stationTwoReducer(state, { type: 'ANSWER', value: 'yes' })
    state = stationTwoReducer(state, { type: 'ANSWER', value: 'no' })
    state = stationTwoReducer(state, { type: 'ANSWER', value: 'yes' })

    expect(state.phase).toBe('height')
    expect(state.answers).toEqual(['yes', 'no', 'yes'])
  })

  it('clamps height and completes only after the height phase', () => {
    let state = createStationTwoState({ phase: 'height' })
    state = stationTwoReducer(state, { type: 'SET_HEIGHT', value: 1.4 })
    expect(state.height).toBe(1)

    state = stationTwoReducer(state, { type: 'ADVANCE' })
    expect(state.phase).toBe('complete')
  })
})

describe('sessionPercentile', () => {
  it('is stable for a visitor and remains inside a theatrical non-extreme range', () => {
    expect(sessionPercentile('Ada:34')).toBe(sessionPercentile('Ada:34'))
    expect(sessionPercentile('Ada:34')).toBeGreaterThanOrEqual(12)
    expect(sessionPercentile('Ada:34')).toBeLessThanOrEqual(96)
    expect(sessionPercentile('Lin:29')).not.toBe(sessionPercentile('Ada:34'))
  })
})
