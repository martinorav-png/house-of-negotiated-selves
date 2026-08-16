import { useEffect, useRef } from 'react'
import type { StationOnePhase, StationTwoPhase } from '../lib/mirrorJourney'

const STATION_ONE_PHASE_CLIPS: Partial<Record<StationOnePhase, string>> = {
  'self-check': '/audio/debra/08-do-you-like-what-you-see.mp3',
}

const PHASE_CLIPS: Partial<Record<StationTwoPhase, string>> = {
  'companion-intro':
    '/audio/debra/09-i-will-help-you-describe-the-companion-you-believe-you-want.mp3',
  'debra-brief':
    '/audio/debra/09-i-will-help-you-describe-the-companion-you-believe-you-want.mp3',
  height: '/audio/debra/04-how-tall-is-your-ideal-partner.mp3',
  complete: '/audio/debra/05-youre-good-to-go-now.mp3',
}

const QUESTION_CLIPS = [
  '/audio/debra/01-is-attractiveness-important-to-you.mp3',
  '/audio/debra/02-should-your-companion-challenge-you.mp3',
  '/audio/debra/03-would-you-choose-companionship-over-independence.mp3',
]

export type ThirdStationVoicePhase = 'intro' | 'prompt' | 'recording' | 'loading'

const THIRD_STATION_CLIPS: Partial<Record<ThirdStationVoicePhase, string>> = {
  intro: '/audio/debra/06-now-is-your-chance.mp3',
  prompt: '/audio/debra/07-introduce-yourself-to-your-future-partner.mp3',
}

export function debraVoiceClipFor(phase: StationTwoPhase, questionIndex: number) {
  return phase === 'question' ? (QUESTION_CLIPS[questionIndex] ?? null) : (PHASE_CLIPS[phase] ?? null)
}

export function stationOneDebraClipFor(phase: StationOnePhase) {
  return STATION_ONE_PHASE_CLIPS[phase] ?? null
}

export function thirdStationDebraClipFor(phase: ThirdStationVoicePhase) {
  return THIRD_STATION_CLIPS[phase] ?? null
}

export function DebraVoice({
  phase,
  questionIndex,
}: {
  phase: StationTwoPhase
  questionIndex: number
}) {
  const clip = debraVoiceClipFor(phase, questionIndex)

  return <DebraVoiceClip src={clip} />
}

export function DebraVoiceClip({ src }: { src: string | null }) {
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !src) return
    const activeAudio = audio

    let cancelled = false
    let awaitingGesture = false

    const removeGestureRetry = () => {
      if (!awaitingGesture) return
      window.removeEventListener('pointerdown', retryPlayback)
      window.removeEventListener('keydown', retryPlayback)
      window.removeEventListener('click', retryPlayback)
      awaitingGesture = false
    }

    const addGestureRetry = () => {
      if (awaitingGesture || cancelled) return
      awaitingGesture = true
      window.addEventListener('pointerdown', retryPlayback, { once: true })
      window.addEventListener('keydown', retryPlayback, { once: true })
      window.addEventListener('click', retryPlayback, { once: true })
    }

    function retryPlayback() {
      removeGestureRetry()
      void activeAudio.play().catch(addGestureRetry)
    }

    activeAudio.currentTime = 0
    void activeAudio.play().catch(addGestureRetry)

    return () => {
      cancelled = true
      removeGestureRetry()
      activeAudio.pause()
      activeAudio.currentTime = 0
    }
  }, [src])

  return src ? <audio ref={audioRef} src={src} preload="auto" aria-hidden="true" /> : null
}
