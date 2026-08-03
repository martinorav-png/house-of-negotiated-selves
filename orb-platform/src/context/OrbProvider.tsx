import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import { ORB } from '../config'
import { OrbContext } from './OrbContext'

type Props = {
  children: ReactNode
  reducedMotion: boolean
}

/**
 * Interaction state lives here so meshes can animate via refs/lerps
 * without React re-renders every frame. Hover + lock update React state
 * only when they change.
 */
export function OrbProvider({ children, reducedMotion }: Props) {
  const [hover, setHoverAmount] = useState(0)
  const [activation, setActivation] = useState(0)
  const [locked, setLocked] = useState(false)
  const lockTimer = useRef<number | null>(null)
  const activationRaf = useRef<number | null>(null)

  const setHover = useCallback(
    (hovered: boolean) => {
      setHoverAmount(hovered ? 1 : 0)
    },
    [],
  )

  const triggerActivation = useCallback(() => {
    if (locked) return
    setLocked(true)
    setActivation(1)

    if (activationRaf.current) cancelAnimationFrame(activationRaf.current)
    const start = performance.now()
    const duration = reducedMotion ? 420 : ORB.cooldownMs

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      // Ease out then settle
      const envelope = t < 0.18 ? t / 0.18 : 1 - (t - 0.18) / 0.82
      setActivation(Math.max(0, envelope))
      if (t < 1) {
        activationRaf.current = requestAnimationFrame(tick)
      } else {
        setActivation(0)
        setLocked(false)
        activationRaf.current = null
      }
    }
    activationRaf.current = requestAnimationFrame(tick)

    if (lockTimer.current) window.clearTimeout(lockTimer.current)
    lockTimer.current = window.setTimeout(() => {
      setLocked(false)
    }, duration)
  }, [locked, reducedMotion])

  const value = useMemo(
    () => ({
      hover,
      activation,
      locked,
      reducedMotion,
      triggerActivation,
      setHover,
    }),
    [hover, activation, locked, reducedMotion, triggerActivation, setHover],
  )

  return <OrbContext.Provider value={value}>{children}</OrbContext.Provider>
}
