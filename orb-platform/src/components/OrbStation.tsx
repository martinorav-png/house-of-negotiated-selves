import { useCallback, useEffect, useState, type KeyboardEvent } from 'react'
import { Canvas } from '@react-three/fiber'
import { CAMERA, RENDERER } from '../config'
import { OrbProvider } from '../context/OrbProvider'
import { useOrbContext } from '../context/OrbContext'
import { Scene } from './Scene'
import { useMediaSensors } from '../hooks/useMediaSensors'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'
import { getDeviceQuality, webGlMaxDpr } from '../lib/deviceQuality'
import { QUESTIONS } from '../lib/questions'
import { applySpatialInput } from '../lib/spatialInput'
import { typingState } from '../lib/typingState'

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
  const kiosk = getDeviceQuality() === 'kiosk'

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
        shadows={!kiosk}
        dpr={[1, webGlMaxDpr()]}
        camera={{
          fov: CAMERA.fov,
          near: CAMERA.near,
          far: CAMERA.far,
          position: CAMERA.position,
        }}
        gl={{
          antialias: !kiosk,
          powerPreference: kiosk ? 'low-power' : 'high-performance',
          toneMappingExposure: RENDERER.exposure,
        }}
        onCreated={({ camera }) => {
          camera.lookAt(...CAMERA.lookAt)
        }}
      >
        <Scene
          postEnabled={postEnabled && !kiosk}
          parallaxEnabled={parallaxEnabled && !kiosk}
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

export function OrbStation() {
  const reducedMotion = usePrefersReducedMotion()
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
  )
}
