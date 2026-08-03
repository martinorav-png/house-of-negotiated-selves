import { createContext, useContext } from 'react'

export type OrbVisualState = {
  /** 0 idle → 1 hover */
  hover: number
  /** transient activation energy 0→1→0 */
  activation: number
  /** whether click lock is active */
  locked: boolean
  reducedMotion: boolean
}

export type OrbActions = {
  triggerActivation: () => void
  setHover: (hovered: boolean) => void
}

type OrbContextValue = OrbVisualState & OrbActions

const OrbContext = createContext<OrbContextValue | null>(null)

export function useOrbContext() {
  const ctx = useContext(OrbContext)
  if (!ctx) throw new Error('useOrbContext must be used within OrbProvider')
  return ctx
}

export { OrbContext }
