import { describe, expect, it } from 'vitest'
import { applySpatialInput } from './spatialInput'

describe('applySpatialInput', () => {
  it('appends printable keys up to the max length', () => {
    expect(applySpatialInput('hel', { key: 'l' }, 8)).toEqual({
      value: 'hell',
      submitted: false,
    })
  })

  it('removes the last character on backspace', () => {
    expect(applySpatialInput('hello', { key: 'Backspace' }, 32)).toEqual({
      value: 'hell',
      submitted: false,
    })
  })

  it('submits and clears a non-empty answer on enter', () => {
    expect(applySpatialInput(' yes ', { key: 'Enter' }, 32)).toEqual({
      value: '',
      submitted: true,
    })
  })

  it('ignores control keys and empty enter', () => {
    expect(applySpatialInput('', { key: 'Enter' }, 32)).toEqual({
      value: '',
      submitted: false,
    })
    expect(applySpatialInput('hi', { key: 'Shift' }, 32)).toEqual({
      value: 'hi',
      submitted: false,
    })
  })
})
