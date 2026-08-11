import { useCallback, useEffect, useState, type KeyboardEvent } from 'react'
import { Canvas } from '@react-three/fiber'
import { CAMERA, RENDERER } from './config'
import { OrbProvider } from './context/OrbProvider'
import { useOrbContext } from './context/OrbContext'
import { Scene } from './components/Scene'
import { AvatarStation } from './components/AvatarStation'
import { SecondStation } from './components/SecondStation'
import { useMediaSensors } from './hooks/useMediaSensors'
import { usePrefersReducedMotion } from './hooks/usePrefersReducedMotion'
import { QUESTIONS } from './lib/questions'
import { applySpatialInput } from './lib/spatialInput'
import { getStationFromHash, getStationHref, type StationRoute } from './lib/stationRoute'
import './index.css'

function ExperienceShell({
  postEnabled,
  parallaxEnabled,
  answerText,
  questionText,
  questionIndex,
  submitSerial,
  onToggleParallax,
  onInputKey,
}: {
  postEnabled: boolean
  parallaxEnabled: boolean
  answerText: string
  questionText: string
  questionIndex: number
  submitSerial: number
  onToggleParallax: () => void
  onInputKey: (event: KeyboardEvent) => boolean
}) {
  const { triggerActivation, locked } = useOrbContext()
  const sensors = useMediaSensors()

  const ensureSensors = useCallback(() => {
    void sensors.start()
  }, [sensors])

  const sensorStatus = sensors.error
    ? sensors.error
    : sensors.starting
      ? 'Starting mic & camera...'
      : sensors.audioActive && sensors.videoActive
        ? 'Mic + camera on - lean to look around'
        : sensors.audioActive
          ? 'Mic on (camera unavailable)'
          : 'Click once to enable mic & camera'

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (onInputKey(e)) {
        e.preventDefault()
        return
      }

      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        ensureSensors()
        if (!locked) triggerActivation()
      }
      if (e.key === 'v' || e.key === 'V') {
        e.preventDefault()
        onToggleParallax()
      }
    },
    [
      locked,
      triggerActivation,
      ensureSensors,
      onToggleParallax,
      onInputKey,
    ],
  )

  return (
    <div
      className="viewport"
      tabIndex={0}
      role="application"
      aria-label="Interactive scan orb. Type to answer the spatial question. Press Enter to submit an answer. Press V to toggle camera parallax."
      onKeyDown={onKeyDown}
      onPointerDown={ensureSensors}
    >
      <Canvas
        shadows
        dpr={[1, RENDERER.maxDpr]}
        camera={{
          fov: CAMERA.fov,
          near: CAMERA.near,
          far: CAMERA.far,
          position: CAMERA.position,
        }}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          toneMappingExposure: RENDERER.exposure,
        }}
        onCreated={({ camera }) => {
          camera.lookAt(...CAMERA.lookAt)
        }}
      >
        <Scene
          postEnabled={postEnabled}
          parallaxEnabled={parallaxEnabled}
          answerText={answerText}
          questionText={questionText}
          questionIndex={questionIndex}
          submitSerial={submitSerial}
        />
      </Canvas>
      <div className="mic-status" aria-live="polite">
        {sensorStatus}
      </div>
    </div>
  )
}

export default function App() {
  const reducedMotion = usePrefersReducedMotion()
  const [station, setStation] = useState<StationRoute>(() =>
    getStationFromHash(window.location.hash),
  )
  const [postEnabled, setPostEnabled] = useState(true)
  const [parallaxEnabled, setParallaxEnabled] = useState(true)
  const [answerText, setAnswerText] = useState('')
  const [questionIndex, setQuestionIndex] = useState(0)
  const [submitSerial, setSubmitSerial] = useState(0)
  const questionText = QUESTIONS[questionIndex]
  const toggleParallax = useCallback(() => {
    setParallaxEnabled((enabled) => !enabled)
  }, [])
  const onInputKey = useCallback((event: KeyboardEvent) => {
    if (
      event.ctrlKey ||
      event.metaKey ||
      event.altKey ||
      event.key === 'v' ||
      event.key === 'V'
    ) {
      return false
    }

    const handlesInput =
      event.key === 'Backspace' ||
      event.key === 'Enter' ||
      event.key === ' ' ||
      event.key.length === 1

    if (!handlesInput) return false
    if (event.key === 'Enter' && answerText.trim().length === 0) return false

    setAnswerText((current) => {
      const next = applySpatialInput(current, event, 72)
      if (next.submitted) {
        setSubmitSerial((serial) => serial + 1)
        setQuestionIndex((index) => (index + 1) % QUESTIONS.length)
      }
      return next.value
    })
    return true
  }, [answerText])

  useEffect(() => {
    const onHashChange = () => setStation(getStationFromHash(window.location.hash))
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  useEffect(() => {
    if (!window.location.hash) {
      window.history.replaceState(null, '', getStationHref('orb'))
    }
  }, [])

  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      if (
        typeof event.message === 'string' &&
        /postprocessing|EffectComposer/i.test(event.message)
      ) {
        setPostEnabled(false)
      }
    }
    window.addEventListener('error', onError)
    return () => window.removeEventListener('error', onError)
  }, [])

  return (
    <main className="experience">
      <nav className={`station-switcher station-switcher-${station}`} aria-label="Station switcher">
        <a aria-current={station === 'orb' ? 'page' : undefined} href={getStationHref('orb')}>
          Orb
        </a>
        <a
          aria-current={station === 'cards' ? 'page' : undefined}
          href={getStationHref('cards')}
        >
          Cards
        </a>
        <a
          aria-current={station === 'avatars' ? 'page' : undefined}
          href={getStationHref('avatars')}
        >
          Avatars
        </a>
      </nav>

      {station === 'orb' ? (
        <section className="orb-station" aria-label="Orb station">
          <OrbProvider reducedMotion={reducedMotion}>
            <div className="experience-inner">
              <ExperienceShell
                postEnabled={postEnabled}
                parallaxEnabled={parallaxEnabled}
                answerText={answerText}
                questionText={questionText}
                questionIndex={questionIndex}
                submitSerial={submitSerial}
                onToggleParallax={toggleParallax}
                onInputKey={onInputKey}
              />
            </div>
          </OrbProvider>
        </section>
      ) : station === 'cards' ? (
        <SecondStation />
      ) : (
        <AvatarStation />
      )}
    </main>
  )
}
