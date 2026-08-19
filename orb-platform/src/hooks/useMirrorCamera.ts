import { useEffect, useRef, useState, type RefObject } from 'react'
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision'
import { PARALLAX } from '../config'
import {
  deriveMirrorFaceSignals,
  NEUTRAL_MIRROR_FACE_SIGNALS,
  type MirrorFaceSignals,
} from '../lib/mirrorFaceSignals'
import type { NormalizedLandmark } from '../lib/mirrorLandmarks'
import { readSelectedCameraId, writeSelectedCameraId } from '../lib/mirrorCameraDevice'

export type MirrorCameraStatus =
  | 'starting'
  | 'active'
  | 'denied'
  | 'unavailable'

export type MirrorCameraDeviceOption = { deviceId: string; label: string }

export type MirrorCameraHandle = {
  videoRef: RefObject<HTMLVideoElement | null>
  status: MirrorCameraStatus
  landmarks: NormalizedLandmark[]
  signals: MirrorFaceSignals
  /** Enumerated video inputs — only has real labels once permission has
   * been granted at least once (browser privacy rule, not a bug here). */
  devices: MirrorCameraDeviceOption[]
  /** What the operator explicitly asked for (persisted); null means
   * "browser default" (facingMode: 'user'). */
  selectedDeviceId: string | null
  /** What's actually running right now, read back from the live track —
   * lets the picker show the right entry even before anyone has chosen
   * one explicitly. */
  activeDeviceId: string | null
  selectDevice: (deviceId: string | null) => void
}

export function useMirrorCamera(): MirrorCameraHandle {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [status, setStatus] = useState<MirrorCameraStatus>('starting')
  const [landmarks, setLandmarks] = useState<NormalizedLandmark[]>([])
  const [signals, setSignals] = useState<MirrorFaceSignals>(
    NEUTRAL_MIRROR_FACE_SIGNALS,
  )
  const [devices, setDevices] = useState<MirrorCameraDeviceOption[]>([])
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(
    () => readSelectedCameraId(),
  )
  const [activeDeviceId, setActiveDeviceId] = useState<string | null>(null)

  const selectDevice = (deviceId: string | null) => {
    writeSelectedCameraId(deviceId)
    setSelectedDeviceId(deviceId)
  }

  useEffect(() => {
    let cancelled = false
    let stream: MediaStream | null = null
    let landmarker: FaceLandmarker | null = null
    let raf = 0
    let lastDetection = 0
    let permissionTimer: ReturnType<typeof setTimeout> | undefined
    let permissionTimedOut = false

    const detect = (now: number) => {
      if (cancelled) return
      const video = videoRef.current
      if (
        video &&
        landmarker &&
        video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
        now - lastDetection >= PARALLAX.detectIntervalMs
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
      try {
        return await FaceLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: PARALLAX.modelUrl, delegate: 'GPU' },
          runningMode: 'VIDEO',
          numFaces: 1,
          outputFaceBlendshapes: true,
          outputFacialTransformationMatrixes: true,
        })
      } catch {
        return FaceLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: PARALLAX.modelUrl, delegate: 'CPU' },
          runningMode: 'VIDEO',
          numFaces: 1,
          outputFaceBlendshapes: true,
          outputFacialTransformationMatrixes: true,
        })
      }
    }

    const start = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        if (!cancelled) setStatus('unavailable')
        return
      }

      try {
        permissionTimer = setTimeout(() => {
          permissionTimedOut = true
          if (!cancelled) setStatus('unavailable')
        }, 4_000)
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: selectedDeviceId
            ? {
                deviceId: { exact: selectedDeviceId },
                width: { ideal: 1080 },
                height: { ideal: 1920 },
              }
            : {
                facingMode: 'user',
                width: { ideal: 1080 },
                height: { ideal: 1920 },
              },
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

        const activeTrack = stream.getVideoTracks?.()[0]
        if (!cancelled) {
          setActiveDeviceId(activeTrack?.getSettings?.().deviceId ?? null)
        }

        // Device labels are only populated once permission has been
        // granted at least once — this is the earliest point that's true,
        // so the picker's option list only really fills in after a first
        // successful connection. A failure here shouldn't block the
        // camera itself; it's only a nice-to-have for the picker UI.
        if (navigator.mediaDevices.enumerateDevices) {
          try {
            const list = await navigator.mediaDevices.enumerateDevices()
            if (!cancelled) {
              setDevices(
                list
                  .filter((entry) => entry.kind === 'videoinput')
                  .map((entry, index) => ({
                    deviceId: entry.deviceId,
                    label: entry.label || `Camera ${index + 1}`,
                  })),
              )
            }
          } catch {
            // Ignored — see comment above.
          }
        }

        try {
          landmarker = await createLandmarker()
        } catch {
          landmarker = null
        }

        if (!cancelled) {
          setStatus('active')
          raf = requestAnimationFrame(detect)
        }
      } catch (error) {
        clearTimeout(permissionTimer)
        permissionTimer = undefined
        if (cancelled) return
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
      cancelAnimationFrame(raf)
      landmarker?.close()
      stream?.getTracks().forEach((track) => track.stop())
      const video = videoRef.current
      if (video) {
        video.pause()
        video.srcObject = null
      }
    }
  }, [selectedDeviceId])

  return {
    videoRef,
    status,
    landmarks,
    signals,
    devices,
    selectedDeviceId,
    activeDeviceId,
    selectDevice,
  }
}
