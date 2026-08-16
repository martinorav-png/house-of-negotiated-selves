import { describe, expect, it } from 'vitest'
import { sampleFaceTopologyConnections } from './mirrorFaceTopology'

describe('sampleFaceTopologyConnections', () => {
  it('selects every fourth connection in stable order by default', () => {
    const connections = Array.from({ length: 9 }, (_, index) => ({
      start: index,
      end: index + 100,
    }))

    expect(sampleFaceTopologyConnections(connections)).toEqual([
      { start: 0, end: 100 },
      { start: 4, end: 104 },
      { start: 8, end: 108 },
    ])
  })

  it('filters malformed endpoints before sampling', () => {
    const connections = [
      { start: 0, end: 10 },
      { start: -1, end: 11 },
      { start: 1.5, end: 12 },
      { start: Number.NaN, end: 13 },
      { start: 4, end: 4 },
      { start: 1, end: 11 },
      { start: 2, end: 12 },
      { start: 3, end: 13 },
      { start: 4, end: 14 },
    ]

    expect(sampleFaceTopologyConnections(connections, 2)).toEqual([
      { start: 0, end: 10 },
      { start: 2, end: 12 },
      { start: 4, end: 14 },
    ])
  })
})
