export type DeviceQuality = 'full' | 'kiosk'

const STORAGE_KEY = 'station-quality'

export type DeviceQualityEnv = {
  userAgent?: string
  platform?: string
  hardwareConcurrency?: number
  deviceMemory?: number
  search?: string
  storage?: Pick<Storage, 'getItem'> | undefined
}

let current: DeviceQuality | null = null

export function detectDeviceQuality(env: DeviceQualityEnv = defaultEnv()): DeviceQuality {
  const override = readOverride(env)
  if (override) return override

  const userAgent = env.userAgent ?? ''
  const platform = env.platform ?? ''
  const cores = env.hardwareConcurrency ?? 8
  const memory = env.deviceMemory
  const haystack = `${userAgent} ${platform}`

  if (/Raspberry|Pi-400|RaspberryPi/i.test(haystack)) return 'kiosk'

  const armLinux =
    /Linux/i.test(haystack) && /(aarch64|arm64|armv7|armv8|\barm\b)/i.test(haystack)
  if (armLinux && cores <= 4 && (memory === undefined || memory <= 4)) return 'kiosk'

  if (typeof memory === 'number' && memory <= 2 && cores <= 4) return 'kiosk'

  return 'full'
}

export function getDeviceQuality() {
  if (current === null) current = detectDeviceQuality()
  return current
}

export function isKioskQuality() {
  return getDeviceQuality() === 'kiosk'
}

export function applyDeviceQuality(quality: DeviceQuality = getDeviceQuality()) {
  current = quality
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.stationQuality = quality
  }
  return quality
}

export function mirrorCameraConstraints(quality: DeviceQuality = getDeviceQuality()) {
  if (quality === 'kiosk') {
    return {
      facingMode: 'user' as const,
      width: { ideal: 480, max: 720 },
      height: { ideal: 640, max: 960 },
      frameRate: { ideal: 15, max: 20 },
    }
  }
  return {
    facingMode: 'user' as const,
    width: { ideal: 1080 },
    height: { ideal: 1920 },
    frameRate: { ideal: 24, max: 30 },
  }
}

export function detectIntervalMs(quality: DeviceQuality = getDeviceQuality()) {
  return quality === 'kiosk' ? 120 : 66
}

export function canvasPixelRatio(quality: DeviceQuality = getDeviceQuality()) {
  const ratio = typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1
  return Math.min(ratio, quality === 'kiosk' ? 1 : 2)
}

export function webGlMaxDpr(quality: DeviceQuality = getDeviceQuality()) {
  return quality === 'kiosk' ? 1 : 1.5
}

export function kioskOrbCounts(
  counts: {
    shell: number
    volume: number
    halo: number
  },
  quality: DeviceQuality = getDeviceQuality(),
) {
  if (quality !== 'kiosk') return counts
  return {
    shell: Math.max(360, Math.round(counts.shell * 0.28)),
    volume: Math.max(240, Math.round(counts.volume * 0.28)),
    halo: Math.max(100, Math.round(counts.halo * 0.28)),
  }
}

function readOverride(env: DeviceQualityEnv): DeviceQuality | null {
  try {
    const params = new URLSearchParams(env.search ?? '')
    const query = params.get('quality') ?? params.get('lowpower')
    if (query === 'low' || query === 'kiosk' || query === '1') return 'kiosk'
    if (query === 'full' || query === 'high') return 'full'
    const stored = env.storage?.getItem(STORAGE_KEY)
    if (stored === 'low' || stored === 'kiosk') return 'kiosk'
    if (stored === 'full') return 'full'
  } catch {
    // Privacy-restricted kiosk browsers can block storage and search parsing.
  }
  return null
}

function defaultEnv(): DeviceQualityEnv {
  if (typeof navigator === 'undefined') return {}
  const nav = navigator as Navigator & { deviceMemory?: number }
  return {
    userAgent: nav.userAgent,
    platform: nav.platform,
    hardwareConcurrency: nav.hardwareConcurrency,
    deviceMemory: nav.deviceMemory,
    search: typeof location === 'undefined' ? '' : location.search,
    storage: typeof window === 'undefined' ? undefined : window.localStorage,
  }
}
