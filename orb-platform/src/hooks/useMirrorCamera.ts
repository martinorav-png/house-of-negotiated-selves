import { useEffect, useRef, useState, type RefObject } from 'react'
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision'
import { PARALLAX } from '../config'
import {
  detectIntervalMs,
  getDeviceQuality,
  mirrorCameraConstraints,
} from '../lib/deviceQuality'
import {
  deriveMirrorFaceSignals,
  NEUTRAL_MIRROR_FACE_SIGNALS,
  type MirrorFaceSignals,
} from '../lib/mirrorFaceSignals'
import type { NormalizedLandmark } from '../lib/mirrorLandmarks'

export type MirrorCameraStatus =
  | 'starting'
  | 'active'
  | 'denied'
  | 'unavailable'

export type MirrorCameraHandle = {
  videoRef: RefObject<HTMLVideoElement | null>
  status: MirrorCameraStatus
  landmarks: NormalizedLandmark[]
  signals: MirrorFaceSignals
}

export function useMirrorCamera({
  tracking = true,
}: {
  tracking?: boolean
} = {}): MirrorCameraHandle {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [status, setStatus] = useState<MirrorCameraStatus>('starting')
  const [landmarks, setLandmarks] = useState<NormalizedLandmark[]>([])
  const [signals, setSignals] = useState<MirrorFaceSignals>(
    NEUTRAL_MIRROR_FACE_SIGNALS,
  )

  useEffect(() => {
    let cancelled = false
    let stream: MediaStream | null = null
    let permissionTimer: ReturnType<typeof setTimeout> | undefined
    let permissionTimedOut = false

    const isEmbedded =
      new URLSearchParams(window.location.search).get('embedded') === '1'

    const start = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        if (!cancelled) setStatus('unavailable')
        return
      }

      // When embedded, wait for the parent page to have a camera stream
      // ready. The parent calls getUserMedia on a user gesture (which
      // browsers require), then exposes the stream on window.__mirrorCameraStream.
      // We poll for it since the iframe may load before or after the parent
      // gets the stream.
      if (isEmbedded) {
        console.log('[useMirrorCamera] embedded mode, polling for parent stream')
        const parentStream = await new Promise<MediaStream | null>((resolve) => {
          if (window.parent === window) return resolve(null)
          const check = () => {
            const s = (window.parent as any).__mirrorCameraStream as
              | MediaStream
              | undefined
            if (s && s.active) return resolve(s)
            if (cancelled) return resolve(null)
            setTimeout(check, 200)
          }
          check()
          setTimeout(() => resolve(null), 30_000)
        })
        if (!parentStream || cancelled) {
          console.warn('[useMirrorCamera] no parent stream available')
          if (!cancelled) setStatus('unavailable')
          return
        }

        // Use the parent's stream directly — no getUserMedia call needed
        // (which would require a user gesture inside this iframe).
        console.log('[useMirrorCamera] got parent stream, attaching to video')
        stream = parentStream
        const video = videoRef.current
        if (!video) {
          console.error('[useMirrorCamera] video element not ready')
          setStatus('unavailable')
          return
        }
        video.srcObject = stream
        try {
          await video.play()
          console.log('[useMirrorCamera] video playing, status active')
        } catch (playErr) {
          console.error('[useMirrorCamera] video.play() failed:', playErr)
          setStatus('unavailable')
          return
        }
        if (!cancelled) setStatus('active')
        return
      }

      try {
        permissionTimer = setTimeout(() => {
          permissionTimedOut = true
          if (!cancelled) setStatus('unavailable')
        }, 15_000)
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: mirrorCameraConstraints(),
        })
        clearTimeout(permissionTimer)
        permissionTimer = undefined
        if (permissionTimedOut) {
          stream.getTracks().forEach((track) => track.stop())
          stream = null
          return
        }
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }

        const video = videoRef.current
        if (!video) throw new Error('Camera view is unavailable')
        video.srcObject = stream
        await video.play()

        if (!cancelled) setStatus('active')
      } catch (error) {
        clearTimeout(permissionTimer)
        permissionTimer = undefined
        if (cancelled) return
        console.error('[useMirrorCamera] getUserMedia failed:', error)
        setStatus(
          error instanceof DOMException && error.name === 'NotAllowedError'
            ? 'denied'
            : 'unavailable',
        )
      }
    }

    void start()

    return () => {
      cancelled = true
      clearTimeout(permissionTimer)
      // Only stop tracks we own — not the parent's shared stream.
      if (stream && stream !== (window.parent as any).__mirrorCameraStream) {
        stream.getTracks().forEach((track) => track.stop())
      }
      const video = videoRef.current
      if (video) {
        video.pause()
        video.srcObject = null
      }
    }
  }, [])

  useEffect(() => {
    if (!tracking || status !== 'active') {
      if (!tracking) {
        setLandmarks([])
        setSignals(NEUTRAL_MIRROR_FACE_SIGNALS)
      }
      return
    }

    let cancelled = false
    let landmarker: FaceLandmarker | null = null
    let raf = 0
    let lastDetection = 0
    const interval = detectIntervalMs()
    const quality = getDeviceQuality()

    const detect = (now: number) => {
      if (cancelled) return
      const video = videoRef.current
      if (
        video &&
        landmarker &&
        video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
        now - lastDetection >= interval
      ) {
        lastDetection = now
        const result = landmarker.detectForVideo(video, now)
        const detectedLandmarks =
          (result.faceLandmarks?.[0] as NormalizedLandmark[] | undefined) ?? []
        setLandmarks(detectedLandmarks)
        setSignals(
          detectedLandmarks.length > 0
            ? deriveMirrorFaceSignals(
                result.faceBlendshapes?.[0]?.categories,
                result.facialTransformationMatrixes?.[0]?.data,
              )
            : NEUTRAL_MIRROR_FACE_SIGNALS,
        )
      }
      raf = requestAnimationFrame(detect)
    }

    const createLandmarker = async () => {
      const vision = await FilesetResolver.forVisionTasks(PARALLAX.wasmBase)
      const options = {
        runningMode: 'VIDEO' as const,
        numFaces: 1,
        outputFaceBlendshapes: true,
        outputFacialTransformationMatrixes: true,
      }
      if (quality === 'kiosk') {
        return FaceLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: PARALLAX.modelUrl, delegate: 'CPU' },
          ...options,
        })
      }
      try {
        return await FaceLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: PARALLAX.modelUrl, delegate: 'GPU' },
          ...options,
        })
      } catch {
        return FaceLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: PARALLAX.modelUrl, delegate: 'CPU' },
          ...options,
        })
      }
    }

    void createLandmarker()
      .then((created) => {
        if (cancelled) {
          created.close()
          return
        }
        landmarker = created
        raf = requestAnimationFrame(detect)
      })
      .catch(() => {
        landmarker = null
      })

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      landmarker?.close()
    }
  }, [status, tracking])

  return { videoRef, status, landmarks, signals }
}
