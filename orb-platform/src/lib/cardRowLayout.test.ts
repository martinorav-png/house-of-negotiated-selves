import { describe, expect, it } from 'vitest'
import { getLayeredCardStyle } from './cardRowLayout'

describe('getLayeredCardStyle', () => {
  it('places cards along a rising diagonal depth stack', () => {
    expect(getLayeredCardStyle(0, 4)).toMatchObject({
      '--card-x': '-260px',
      '--card-y': '136px',
      zIndex: 10,
    })
    expect(getLayeredCardStyle(3, 4)).toMatchObject({
      '--card-x': '225px',
      '--card-y': '-116px',
      zIndex: 7,
    })
  })

  it('keeps later cards more transparent and farther back', () => {
    expect(getLayeredCardStyle(0, 4)).toMatchObject({
      '--card-depth': '0px',
      '--card-opacity': '0.88',
    })
    expect(getLayeredCardStyle(3, 4)).toMatchObject({
      '--card-depth': '-150px',
      '--card-opacity': '0.52',
    })
  })
})
