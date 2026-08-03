import { useCallback, useEffect, useRef, useState } from 'react'
import { audioLevels } from '../lib/audioLevels'
import { AUDIO } from '../config'

type AudioAnalyserHandle = {
  /** Request mic permission and start analysing (needs a user gesture). */
  start: () => Promise<void>
  stop: () => void
  active: boolean
  error: string | null
}

/**
 * Microphone → Web Audio AnalyserNode → smoothed bass/mid/treble into `audioLevels`.
 * Call `start()` from a click / key handler (browser autoplay policy).
 */
export function useAudioAnalyser(): AudioAnalyserHandle {
  const [active, setActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const ctxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number | null>(null)
  const freqRef = useRef<Uint8Array | null>(null)
  const timeRef = useRef<Uint8Array | null>(null)

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = null
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    void ctxRef.current?.close()
    ctxRef.current = null
    analyserRef.current = null
    audioLevels.active = false
    audioLevels.level = 0
    audioLevels.bass = 0
    audioLevels.mid = 0
    audioLevels.treble = 0
    setActive(false)
  }, [])

  const tick = useCallback(() => {
    const analyser = analyserRef.current
    const freq = freqRef.current
    const time = timeRef.current
    if (!analyser || !freq || !time) return

    analyser.getByteFrequencyData(freq as Uint8Array<ArrayBuffer>)
    analyser.getByteTimeDomainData(time as Uint8Array<ArrayBuffer>)

    // RMS from time domain
    let sum = 0
    for (let i = 0; i < time.length; i++) {
      const v = (time[i] - 128) / 128
      sum += v * v
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

    rafRef.current = requestAnimationFrame(tick)
  }, [])

  const start = useCallback(async () => {
    if (audioLevels.active || ctxRef.current) return
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      })
      streamRef.current = stream
      const ctx = new AudioContext()
      ctxRef.current = ctx
      const source = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = AUDIO.fftSize
      analyser.smoothingTimeConstant = 0.75
      source.connect(analyser)
      analyserRef.current = analyser
      freqRef.current = new Uint8Array(analyser.frequencyBinCount)
      timeRef.current = new Uint8Array(analyser.fftSize)
      audioLevels.active = true
      setActive(true)
      if (ctx.state === 'suspended') await ctx.resume()
      rafRef.current = requestAnimationFrame(tick)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Microphone permission denied'
      setError(message)
      stop()
    }
  }, [stop, tick])

  useEffect(() => () => stop(), [stop])

  return { start, stop, active, error }
}
