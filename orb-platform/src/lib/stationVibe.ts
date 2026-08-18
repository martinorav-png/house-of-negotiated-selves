import { mirrorSettings } from '../dev/mirrorSettingsStore'

export type StationVibe = 'warm' | 'original'

const STORAGE_KEY = 'station-vibe'
const listeners = new Set<() => void>()

const PALETTES = {
  original: {
    orb: { colorCore: '#f2fbf8', colorMid: '#bcffd0', colorRim: '#3fa8c9' },
    background: { top: '#000000', bottom: '#141616' },
    text: { color: '#f4f6f5', smudgeColor: '#ebebeb' },
    accent: { color: '#ffffff' },
  },
  warm: {
    orb: { colorCore: '#fff6e8', colorMid: '#f0c48a', colorRim: '#c47848' },
    background: { top: '#1a1410', bottom: '#0c0907' },
    text: { color: '#fff4e8', smudgeColor: '#f0d4b8' },
    accent: { color: '#e8b88c' },
  },
} as const

export const TRACKING_RGB: Record<StationVibe, string> = {
  original: '185, 220, 235',
  warm: '232, 184, 140',
}

let current: StationVibe | null = null

export function readStationVibe(
  storage: Pick<Storage, 'getItem'> | undefined = defaultStorage(),
): StationVibe {
  try {
    return storage?.getItem(STORAGE_KEY) === 'original' ? 'original' : 'warm'
  } catch {
    return 'warm'
  }
}

export function writeStationVibe(
  vibe: StationVibe,
  storage: Pick<Storage, 'setItem'> | undefined = defaultStorage(),
) {
  try {
    storage?.setItem(STORAGE_KEY, vibe)
  } catch {
    // Storage can be unavailable in privacy-restricted kiosk browsers.
  }
}

export function getStationVibe() {
  if (current === null) current = readStationVibe()
  return current
}

export function subscribeStationVibe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function applyStationVibe(vibe: StationVibe) {
  current = vibe
  const palette = PALETTES[vibe]
  Object.assign(mirrorSettings.orb, palette.orb)
  Object.assign(mirrorSettings.background, palette.background)
  Object.assign(mirrorSettings.text, palette.text)
  Object.assign(mirrorSettings.accent, palette.accent)
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.stationVibe = vibe
  }
  listeners.forEach((listener) => listener())
}

export function setStationVibe(vibe: StationVibe) {
  writeStationVibe(vibe)
  applyStationVibe(vibe)
}

function defaultStorage() {
  return typeof window === 'undefined' ? undefined : window.localStorage
}
