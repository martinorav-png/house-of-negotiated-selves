// @vitest-environment jsdom

import { act, useEffect } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const vision = vi.hoisted(() => ({
  close: vi.fn(),
  detectForVideo: vi.fn<() => {
    faceLandmarks: Array<Array<{ x: number; y: number; z: number }>>
    faceBlendshapes?: Array<{
      categories: Array<{ categoryName: string; score: number }>
    }>
    facialTransformationMatrixes?: Array<{ data: number[] }>
  }>(() => ({ faceLandmarks: [] })),
  create: vi.fn(),
  resolve: vi.fn(),
}))

vi.mock('@mediapipe/tasks-vision', () => ({
  FilesetResolver: { forVisionTasks: vision.resolve },
  FaceLandmarker: { createFromOptions: vision.create },
}))

import { useMirrorCamera } from './useMirrorCamera'

function Harness({
  onStatus,
  tracking = true,
}: {
  onStatus: (status: string) => void
  tracking?: boolean
}) {
  const camera = useMirrorCamera({ tracking })
  useEffect(() => {
    onStatus(camera.status)
  }, [camera.status, onStatus])
  return (
    <video
      ref={camera.videoRef}
      data-status={camera.status}
      data-blink={camera.signals.blink}
      data-mouth-open={camera.signals.mouthOpen}
      data-head-yaw={camera.signals.headYaw}
    />
  )
}

describe('useMirrorCamera', () => {
  let container: HTMLDivElement
  let root: Root
  let animationFrames: FrameRequestCallback[]

  beforeEach(() => {
    ;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
      .IS_REACT_ACT_ENVIRONMENT = true
    container = document.createElement('div')
    document.body.append(container)
    root = createRoot(container)
    animationFrames = []
    vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => {
      animationFrames.push(callback)
      return animationFrames.length
    }))
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue()
    vision.resolve.mockResolvedValue({})
    vision.create.mockResolvedValue({
      close: vision.close,
      detectForVideo: vision.detectForVideo,
    })
  })

  afterEach(() => {
    act(() => root.unmount())
    vi.restoreAllMocks()
    vi.clearAllMocks()
    container.remove()
  })

  it('attaches a local camera stream and reports an active session', async () => {
    const stop = vi.fn()
    const stream = {
      getTracks: () => [{ stop }],
      getVideoTracks: () => [{}],
    } as unknown as MediaStream
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: vi.fn().mockResolvedValue(stream) },
    })
    const statuses: string[] = []

    await act(async () => {
      root.render(<Harness onStatus={(status) => statuses.push(status)} />)
      await Promise.resolve()
      await Promise.resolve()
      await Promise.resolve()
      await Promise.resolve()
      await Promise.resolve()
    })

    const video = container.querySelector('video')!
    expect(video.srcObject).toBe(stream)
    expect(statuses).toContain('active')
    expect(vision.create).toHaveBeenCalledOnce()
    expect(vision.create).toHaveBeenCalledWith(
      {},
      expect.objectContaining({
        outputFaceBlendshapes: true,
        outputFacialTransformationMatrixes: true,
      }),
    )

    act(() => root.unmount())
    root = createRoot(container)
    expect(stop).toHaveBeenCalledOnce()
    expect(vision.close).toHaveBeenCalledOnce()
  })

  it('publishes blendshape and transformation signals from a detected face', async () => {
    const stream = { getTracks: () => [{ stop: vi.fn() }] } as unknown as MediaStream
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: vi.fn().mockResolvedValue(stream) },
    })
    vision.detectForVideo.mockReturnValue({
      faceLandmarks: [[{ x: 0.5, y: 0.5, z: 0 }]],
      faceBlendshapes: [{ categories: [
        { categoryName: 'eyeBlinkLeft', score: 0.8 },
        { categoryName: 'eyeBlinkRight', score: 0.4 },
        { categoryName: 'jawOpen', score: 0.75 },
      ] }],
      facialTransformationMatrixes: [{ data: [
        Math.cos(Math.PI / 6), 0, -Math.sin(Math.PI / 6), 0,
        0, 1, 0, 0,
        Math.sin(Math.PI / 6), 0, Math.cos(Math.PI / 6), 0,
        0, 0, 0, 1,
      ] }],
    })

    await act(async () => {
      root.render(<Harness onStatus={() => undefined} />)
      await Promise.resolve()
      await Promise.resolve()
      await Promise.resolve()
      await Promise.resolve()
      await Promise.resolve()
    })
    const video = container.querySelector('video')!
    Object.defineProperty(video, 'readyState', {
      configurable: true,
      value: HTMLMediaElement.HAVE_CURRENT_DATA,
    })

    await act(async () => {
      animationFrames.at(-1)?.(1000)
    })

    expect(video.dataset.blink).toBe('0.6000000000000001')
    expect(video.dataset.mouthOpen).toBe('0.75')
    expect(Number(video.dataset.headYaw)).toBeCloseTo(0.5)
  })

  it('keeps the journey usable when camera permission is denied', async () => {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: vi.fn().mockRejectedValue(new DOMException('Denied', 'NotAllowedError')),
      },
    })
    const statuses: string[] = []

    await act(async () => {
      root.render(<Harness onStatus={(status) => statuses.push(status)} />)
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(statuses.at(-1)).toBe('denied')
    expect(container.querySelector('video')?.dataset.status).toBe('denied')
  })

  it('falls back when a camera permission request remains unanswered', async () => {
    vi.useFakeTimers()
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: vi.fn(() => new Promise<MediaStream>(() => undefined)) },
    })
    const statuses: string[] = []

    await act(async () => {
      root.render(<Harness onStatus={(status) => statuses.push(status)} />)
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5_000)
    })

    expect(statuses.at(-1)).toBe('unavailable')
    expect(container.querySelector('video')?.dataset.status).toBe('unavailable')
    vi.useRealTimers()
  })

  it('keeps the live camera but skips MediaPipe when tracking is off', async () => {
    const stream = { getTracks: () => [{ stop: vi.fn() }] } as unknown as MediaStream
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: vi.fn().mockResolvedValue(stream) },
    })

    await act(async () => {
      root.render(<Harness tracking={false} onStatus={() => undefined} />)
      await Promise.resolve()
      await Promise.resolve()
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(container.querySelector('video')?.srcObject).toBe(stream)
    expect(vision.create).not.toHaveBeenCalled()
  })
})
