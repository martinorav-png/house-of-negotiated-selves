// @vitest-environment jsdom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MirrorChoice } from './MirrorChoice'

describe('MirrorChoice', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    ;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
      .IS_REACT_ACT_ENVIRONMENT = true
    container = document.createElement('div')
    document.body.append(container)
    root = createRoot(container)
  })

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
  })

  it('exposes labelled yes and no controls to pointer input', () => {
    const onAnswer = vi.fn()
    act(() => root.render(<MirrorChoice onAnswer={onAnswer} />))

    const group = container.querySelector('[role="group"]')
    const buttons = container.querySelectorAll('button')
    expect(group?.getAttribute('aria-label')).toBe('Answer yes or no')
    expect(buttons[0].textContent).toBe('Yes')
    expect(buttons[1].textContent).toBe('No')

    act(() => buttons[0].click())
    expect(onAnswer).toHaveBeenCalledOnce()
    expect(onAnswer).toHaveBeenCalledWith('yes')
  })

  it('accepts Y and N keys once per key press', () => {
    const onAnswer = vi.fn()
    act(() => root.render(<MirrorChoice onAnswer={onAnswer} />))

    act(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'y' })))
    act(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'N' })))
    act(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' })))

    expect(onAnswer.mock.calls).toEqual([['yes'], ['no']])
  })
})
