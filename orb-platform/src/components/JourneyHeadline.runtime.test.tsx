// @vitest-environment jsdom

import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { JourneyHeadline } from './JourneyHeadline'

describe('JourneyHeadline', () => {
  let container: HTMLDivElement

  beforeEach(() => {
    ;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
      .IS_REACT_ACT_ENVIRONMENT = true
    container = document.createElement('div')
    document.body.append(container)
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    container.remove()
  })

  it('keeps semantic text while rendering a decorative Station III canvas', () => {
    const root = createRoot(container)
    act(() => {
      root.render(
        <JourneyHeadline lines={['Proceeding with', 'facial analysis']}>
          Proceeding with facial analysis
        </JourneyHeadline>,
      )
    })

    const heading = container.querySelector('h1')
    expect(heading?.textContent).toBe('Proceeding with facial analysis')
    const decorative = heading?.querySelector('[aria-hidden="true"]')
    expect(decorative?.querySelectorAll('.journey-headline-canvas')).toHaveLength(1)
    expect(decorative?.textContent).toBe('')

    act(() => root.unmount())
  })
})
