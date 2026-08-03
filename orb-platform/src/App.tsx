import { useCallback, useEffect, useState, type KeyboardEvent } from 'react'
import { Canvas } from '@react-three/fiber'
import { CAMERA, RENDERER } from './config'
import { OrbProvider } from './context/OrbProvider'
import { useOrbContext } from './context/OrbContext'
import { Scene } from './components/Scene'
import { usePrefersReducedMotion } from './hooks/usePrefersReducedMotion'
import { useAudioAnalyser } from './hooks/useAudioAnalyser'
import './index.css'

function ExperienceShell({
  focused,
  postEnabled,
}: {
  focused: boolean
  postEnabled: boolean
}) {
  const { triggerActivation, locked } = useOrbContext()
  const audio = useAudioAnalyser()

  const ensureMic = useCallback(() => {
    void audio.start()
  }, [audio])

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        ensureMic()
        if (!locked) triggerActivation()
      }
      if (e.key === 'm' || e.key === 'M') {
        e.preventDefault()
        if (audio.active) audio.stop()
        else void audio.start()
      }
    },
    [locked, triggerActivation, ensureMic, audio],
  )

  return (
    <div
      className={`viewport${focused ? ' is-focused' : ''}`}
      tabIndex={0}
      role="application"
      aria-label="Interactive scan orb. Click or press Enter to activate. Microphone drives orb motion after you allow access. Press M to toggle mic."
      onKeyDown={onKeyDown}
      onPointerDown={ensureMic}
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
        <Scene postEnabled={postEnabled} />
      </Canvas>
      <div className="mic-status" aria-live="polite">
        {audio.error
          ? 'Mic unavailable'
          : audio.active
            ? 'Mic on — speak or play sound'
            : 'Click once to enable mic'}
      </div>
    </div>
  )
}

export default function App() {
  const reducedMotion = usePrefersReducedMotion()
  const [focused, setFocused] = useState(false)
  const [postEnabled, setPostEnabled] = useState(true)

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
      <OrbProvider reducedMotion={reducedMotion}>
        <div
          className="experience-inner"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        >
          <ExperienceShell focused={focused} postEnabled={postEnabled} />
        </div>
      </OrbProvider>
    </main>
  )
}
