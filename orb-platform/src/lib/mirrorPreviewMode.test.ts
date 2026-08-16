import { describe, expect, it, vi } from 'vitest'
import {
  readMirrorPreviewMode,
  writeMirrorPreviewMode,
} from './mirrorPreviewMode'

describe('mirror preview mode', () => {
  it('defaults to portrait when no saved preference exists', () => {
    expect(readMirrorPreviewMode({ getItem: () => null })).toBe('portrait')
  })

  it('restores fill mode from storage', () => {
    expect(readMirrorPreviewMode({ getItem: () => 'fill' })).toBe('fill')
  })

  it('rejects invalid saved values', () => {
    expect(readMirrorPreviewMode({ getItem: () => 'sideways' })).toBe('portrait')
  })

  it('persists the selected mode under the mirror preview key', () => {
    const setItem = vi.fn()

    writeMirrorPreviewMode('fill', { setItem })

    expect(setItem).toHaveBeenCalledWith('mirror-preview-mode', 'fill')
  })
})
