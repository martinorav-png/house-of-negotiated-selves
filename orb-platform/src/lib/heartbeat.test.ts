import { describe, expect, it } from 'vitest'
import { heartbeat } from './heartbeat'

describe('heartbeat', () => {
  it('keeps the lub peak broad enough to feel smooth', () => {
    expect(heartbeat(0.04, 60)).toBeGreaterThan(0.45)
  })
})
