// @vitest-environment jsdom

import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const camera = vi.hoisted(() => ({
  videoRef: { current: null as HTMLVideoElement | null },
  status: 'active' as const,
  landmarks: Array.from({ length: 455 }, () => ({ x: 0.5, y: 0.5, z: 0 })),
  signals: {
    blink: 0,
    gazeX: 0,
    gazeY: 0,
    mouthOpen: 0,
    smile: 0,
    browLift: 0,
    headYaw: 0,
    headPitch: 0,
    headRoll: 0,
  },
}))

vi.mock('../hooks/useMirrorCamera', () => ({
  useMirrorCamera: () => camera,
}))

import { MirrorCameraLayer } from './MirrorCameraLayer'

describe('MirrorCameraLayer', () => {
  let container: HTMLDivElement
  const fillText = vi.fn()
  const lineTo = vi.fn()
  const strokeOperations: Array<{
    strokeStyle: string
    lineWidth: number
    lineToCount: number
  }> = []
  const context = {
    scale: vi.fn(),
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo,
    closePath: vi.fn(),
    stroke: vi.fn(() => {
      strokeOperations.push({
        strokeStyle: context.strokeStyle,
        lineWidth: context.lineWidth,
        lineToCount: lineTo.mock.calls.length,
      })
    }),
    setLineDash: vi.fn(),
    ellipse: vi.fn(),
    fillText,
    strokeStyle: '',
    fillStyle: '',
    lineWidth: 1,
    font: '',
  }

  beforeEach(() => {
    ;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
      .IS_REACT_ACT_ENVIRONMENT = true
    container = document.createElement('div')
    document.body.append(container)
    strokeOperations.length = 0
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
      context as unknown as WebGL2RenderingContext,
    )
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.clearAllMocks()
    container.remove()
  })

  it('draws eye tracking geometry without an eye vector text label', () => {
    const root = createRoot(container)
    act(() => root.render(<MirrorCameraLayer mode="eyes" />))

    expect(context.stroke).toHaveBeenCalled()
    expect(strokeOperations).toContainEqual({
      strokeStyle: 'rgba(232, 184, 140, 0.16)',
      lineWidth: 0.55,
      lineToCount: expect.any(Number),
    })
    expect(
      strokeOperations.find((operation) => operation.lineWidth === 0.55)?.lineToCount,
    ).toBeGreaterThan(40)
    expect(fillText).not.toHaveBeenCalledWith('EYE VECTOR', expect.anything(), expect.anything())

    act(() => root.unmount())
  })
})
