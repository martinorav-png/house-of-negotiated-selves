import { useCallback, useEffect, useRef, useState } from 'react'
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision'
import { AUDIO, PARALLAX } from '../config'
import { audioLevels } from '../lib/audioLevels'
import { faceSizeToDepth } from '../lib/faceParallax'
import { facePose } from '../lib/facePose'

export type MediaSensorsHandle = {
  start: () => Promise<void>
  stop: () => void
  audioActive: boolean
  videoActive: boolean
  error: string | null
  starting: boolean
}

type Landmark = {
  x: number
  y: number
  z?: number
}

export function useMediaSensors(): MediaSensorsHandle {
  const [audioActive, setAudioActive] = useState(false)
  const [videoActive, setVideoActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [starting, setStarting] = useState(false)

  const streamRef = useRef<MediaStream | null>(null)
  const ctxRef = useRef<AudioContext | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const freqRef = useRef<Uint8Array | null>(null)
  const timeRef = useRef<Uint8Array | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const landmarkerRef = useRef<FaceLandmarker | null>(null)
  const rafRef = useRef<number | null>(null)
  const lastDetectRef = useRef(0)
  const sx = useRef(0)
  const sy = useRef(0)
  const sz = useRef(0.5)

  const resetLevels = useCallback(() => {
    audioLevels.active = false
    audioLevels.level = 0
    audioLevels.bass = 0
    audioLevels.mid = 0
    audioLevels.treble = 0
    facePose.active = false
    facePose.present = false
    facePose.x = 0
    facePose.y = 0
    facePose.z = 0.5
    sx.current = 0
    sy.current = 0
    sz.current = 0.5
  }, [])

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = null
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    void ctxRef.current?.close()
    ctxRef.current = null
    sourceRef.current = null
    analyserRef.current = null
    freqRef.current = null
    timeRef.current = null
    landmarkerRef.current?.close()
    landmarkerRef.current = null
        if (videoRef.current) {
          videoRef.current.pause()
          videoRef.current.srcObject = null
          videoRef.current.remove()
          videoRef.current = null
        }
    resetLevels()
    setAudioActive(false)
    setVideoActive(false)
    setStarting(false)
  }, [resetLevels])

  const setupAudio = useCallback(async (stream: MediaStream) => {
    if (stream.getAudioTracks().length === 0) return false

    const ctx = new AudioContext()
    ctxRef.current = ctx
    const source = ctx.createMediaStreamSource(stream)
    const analyser = ctx.createAnalyser()
    analyser.fftSize = AUDIO.fftSize
    analyser.smoothingTimeConstant = 0.75
    source.connect(analyser)
    sourceRef.current = source
    analyserRef.current = analyser
    freqRef.current = new Uint8Array(analyser.frequencyBinCount)
    timeRef.current = new Uint8Array(analyser.fftSize)
    audioLevels.active = true
    setAudioActive(true)
    if (ctx.state === 'suspended') await ctx.resume()
    return true
  }, [])

  const setupVideo = useCallback(async (stream: MediaStream) => {
    if (stream.getVideoTracks().length === 0) return false

    const video = document.createElement('video')
    video.playsInline = true
    video.muted = true
    video.autoplay = true
    video.setAttribute('playsinline', 'true')
    video.style.position = 'fixed'
    video.style.width = '1px'
    video.style.height = '1px'
    video.style.opacity = '0'
    video.style.pointerEvents = 'none'
    video.style.left = '-10px'
    video.style.top = '-10px'
    video.srcObject = stream
    document.body.appendChild(video)
    videoRef.current = video
    await video.play()
    setVideoActive(true)

    try {
      const vision = await FilesetResolver.forVisionTasks(PARALLAX.wasmBase)
      landmarkerRef.current = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: PARALLAX.modelUrl,
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numFaces: 1,
      })
    } catch {
      try {
        const vision = await FilesetResolver.forVisionTasks(PARALLAX.wasmBase)
        landmarkerRef.current = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: PARALLAX.modelUrl,
            delegate: 'CPU',
          },
          runningMode: 'VIDEO',
          numFaces: 1,
        })
      } catch {
        facePose.active = false
        return true
      }
    }

    facePose.active = true
    return true
  }, [])

  const tickAudio = useCallback(() => {
    const analyser = analyserRef.current
    const freq = freqRef.current
    const time = timeRef.current
    if (!analyser || !freq || !time) return

    analyser.getByteFrequencyData(freq as Uint8Array<ArrayBuffer>)
    analyser.getByteTimeDomainData(time as Uint8Array<ArrayBuffer>)

    let sum = 0
    for (let i = 0; i < time.length; i++) {
      const value = (time[i] - 128) / 128
      sum += value * value
    }
    const rms = Math.sqrt(sum / time.length)

    const binCount = freq.length
    const bassEnd = Math.max(2, Math.floor(binCount * 0.08))
    const midEnd = Math.max(bassEnd + 1, Math.floor(binCount * 0.4))

    let bass = 0
    let mid = 0
    let treble = 0
    for (let i = 0; i < bassEnd; i++) bass += freq[i]
    for (let i = bassEnd; i < midEnd; i++) mid += freq[i]
    for (let i = midEnd; i < binCount; i++) treble += freq[i]

    bass = (bass / (bassEnd * 255)) * AUDIO.sensitivity
    mid = (mid / ((midEnd - bassEnd) * 255)) * AUDIO.sensitivity
    treble = (treble / ((binCount - midEnd) * 255)) * AUDIO.sensitivity
    const level = Math.min(1, rms * AUDIO.sensitivity * 2.2)

    const smooth = AUDIO.smoothing
    audioLevels.level += (Math.min(1, level) - audioLevels.level) * (1 - smooth)
    audioLevels.bass += (Math.min(1, bass) - audioLevels.bass) * (1 - smooth)
    audioLevels.mid += (Math.min(1, mid) - audioLevels.mid) * (1 - smooth)
    audioLevels.treble += (Math.min(1, treble) - audioLevels.treble) * (1 - smooth)
  }, [])

  const tickVideo = useCallback((now: number) => {
    const video = videoRef.current
    const landmarker = landmarkerRef.current
    if (!video || !landmarker || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      return
    }
    if (now - lastDetectRef.current < PARALLAX.detectIntervalMs) return
    lastDetectRef.current = now

    const result = landmarker.detectForVideo(video, now)
    const landmarks = result.faceLandmarks[0] as Landmark[] | undefined
    if (!landmarks || landmarks.length === 0) {
      facePose.present = false
      sx.current += (0 - sx.current) * 0.08
      sy.current += (0 - sy.current) * 0.08
      sz.current += (0.5 - sz.current) * 0.08
      facePose.x = sx.current
      facePose.y = sy.current
      facePose.z = sz.current
      return
    }

    const nose = landmarks[1] ?? landmarks[0]
    const leftEye = landmarks[33]
    const rightEye = landmarks[263]
    const eyeSize =
      leftEye && rightEye
        ? Math.hypot(leftEye.x - rightEye.x, leftEye.y - rightEye.y)
        : estimateFaceWidth(landmarks)
    const rawX = -(nose.x - 0.5) * 2
    const rawY = -(nose.y - 0.5) * 2
    const rawZ = faceSizeToDepth(eyeSize)

    sx.current += (rawX - sx.current) * 0.22
    sy.current += (rawY - sy.current) * 0.22
    sz.current += (rawZ - sz.current) * 0.18
    facePose.active = true
    facePose.present = true
    facePose.x = sx.current
    facePose.y = sy.current
    facePose.z = sz.current
  }, [])

  const loop = useCallback(() => {
    tickAudio()
    tickVideo(performance.now())
    rafRef.current = requestAnimationFrame(loop)
  }, [tickAudio, tickVideo])

  const startAudioOnly = useCallback(async () => {
    const audioStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video: false,
    })
    streamRef.current = audioStream
    await setupAudio(audioStream)
    setError('Camera unavailable - mic only')
    setStarting(false)
    rafRef.current = requestAnimationFrame(loop)
  }, [loop, setupAudio])

  const start = useCallback(async () => {
    if (streamRef.current || starting) return
    setStarting(true)
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      })
      streamRef.current = stream
      await setupAudio(stream)
      try {
        await setupVideo(stream)
      } catch {
        stream.getVideoTracks().forEach((track) => track.stop())
        landmarkerRef.current?.close()
        landmarkerRef.current = null
    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.srcObject = null
      videoRef.current.remove()
      videoRef.current = null
    }
        facePose.active = false
        facePose.present = false
        setVideoActive(false)
        setError('Camera unavailable - mic only')
      }
      setStarting(false)
      rafRef.current = requestAnimationFrame(loop)
    } catch {
      try {
        await startAudioOnly()
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Sensor permission denied'
        setError(message)
        stop()
      }
    }
  }, [loop, setupAudio, setupVideo, startAudioOnly, starting, stop])

  useEffect(() => () => stop(), [stop])

  return { start, stop, audioActive, videoActive, error, starting }
}

function estimateFaceWidth(landmarks: Landmark[]): number {
  let minX = 1
  let maxX = 0
  for (const landmark of landmarks) {
    minX = Math.min(minX, landmark.x)
    maxX = Math.max(maxX, landmark.x)
  }
  return Math.max(0, maxX - minX)
}
