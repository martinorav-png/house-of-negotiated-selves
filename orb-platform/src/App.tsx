import { lazy, Suspense, useCallback, useEffect, useState, type KeyboardEvent } from 'react'
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
import { typingState } from './lib/typingState'
import { getStationFromHash, getStationHref, type StationRoute } from './lib/stationRoute'
import './index.css'

// Dynamically imported so `leva` (and the panel) is excluded from the
// production bundle entirely — only fetched when import.meta.env.DEV
// actually renders it, never requested otherwise.
const DevPanel = lazy(() => import('./dev/DevPanel').then((m) => ({ default: m.DevPanel })))

function ExperienceShell({
  focused,
  postEnabled,
  parallaxEnabled,
  answerText,
  questionText,
  submitSerial,
  onToggleParallax,
  onInputKey,
}: {
  focused: boolean
  postEnabled: boolean
  parallaxEnabled: boolean
  answerText: string
  questionText: string
  submitSerial: number
  onToggleParallax: () => void
  onInputKey: (event: KeyboardEvent) => boolean
}) {
  const { triggerActivation, locked } = useOrbContext()
  const sensors = useMediaSensors()

  const ensureSensors = useCallback(() => {
    void sensors.start()
  }, [sensors])

  const sensorsActive = sensors.audioActive || sensors.videoActive
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
      if (e.key === 'm' || e.key === 'M') {
        e.preventDefault()
        if (sensorsActive) sensors.stop()
        else void sensors.start()
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
      sensors,
      sensorsActive,
      onToggleParallax,
      onInputKey,
    ],
  )

  return (
    <div
      className={`viewport${focused ? ' is-focused' : ''}`}
      tabIndex={0}
      role="application"
      aria-label="Interactive scan orb. Type to answer the spatial question. Press Enter to submit an answer. Press M to toggle sensors. Press V to toggle camera parallax."
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
  const [focused, setFocused] = useState(false)
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
      event.key === 'm' ||
      event.key === 'M' ||
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
        typingState.active = false
      } else {
        typingState.active = next.value.trim().length > 0
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
      {import.meta.env.DEV ? (
        <Suspense fallback={null}>
          <DevPanel />
        </Suspense>
      ) : null}
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
            <div
              className="experience-inner"
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
            >
              <ExperienceShell
                focused={focused}
                postEnabled={postEnabled}
                parallaxEnabled={parallaxEnabled}
                answerText={answerText}
                questionText={questionText}
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
