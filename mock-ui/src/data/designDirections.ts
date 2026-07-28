export interface DesignDirection {
  id: string
  name: string
  tagline: string
  mood: string
  fonts: string
  status: 'active' | 'draft' | 'archive'
  swatches: [string, string, string, string]
  builtin?: boolean
}

export const BUILTIN_DIRECTIONS: DesignDirection[] = [
  {
    id: 'institutional',
    name: 'Institutional Mirror Terminal',
    tagline: 'Clinical capture UI. Phosphor instrumentation. Amber orb as bait.',
    mood: 'Hauntological clinical, Boards of Canada dread, intake terminal',
    fonts: 'Syne · Archivo · Fragment Mono',
    status: 'active',
    swatches: ['#08080a', '#3dff8a', '#ffb347', '#141418'],
    builtin: true,
  },
  {
    id: 'night-companion',
    name: 'Night Companion',
    tagline: 'Ink-navy interview. Copper for Debra only. Soft asides, not SYS.LOG.',
    mood: 'Intimate late-night extraction, lavender UI, warm bait',
    fonts: 'Sora · Source Sans 3 · IBM Plex Mono',
    status: 'draft',
    swatches: ['#0a0d14', '#c4b5fd', '#d4a574', '#161b27'],
    builtin: true,
  },
  {
    id: 'porcelain-confessional',
    name: 'Porcelain Confessional',
    tagline: 'Cool museum porcelain. Deep wine actions. No blush, no pills.',
    mood: 'Quiet questionnaire, iron type, one soft shadow plane',
    fonts: 'Outfit · Libre Franklin · IBM Plex Mono',
    status: 'draft',
    swatches: ['#f4f2ef', '#5c1f2a', '#8b4518', '#ebe8e3'],
    builtin: true,
  },
  {
    id: 'liquid-mirror',
    name: 'Liquid Mirror',
    tagline: 'Iridescent charcoal. Warmth from material motion, not coral.',
    mood: 'Oil-slick accent, morphing focus, cinematic screen entry',
    fonts: 'Unbounded · Nunito Sans · JetBrains Mono',
    status: 'draft',
    swatches: ['#07080c', '#7dd3fc', '#f0abfc', '#12151e'],
    builtin: true,
  },
  {
    id: 'factory-clinical',
    name: 'Factory Clinical',
    tagline: 'Physical room fidelity. Matte latex, sodium light, no digital romance.',
    mood: 'Muted, matte, industrial. Matches physical install',
    fonts: 'Archivo · Fragment Mono',
    status: 'draft',
    swatches: ['#1a1a18', '#c8c4bc', '#8a8a82', '#2e2e2a'],
    builtin: true,
  },
  {
    id: 'soft-future',
    name: 'Soft Future Companion (archived)',
    tagline: 'Archived blush/coral recolor. Replaced by Night / Porcelain / Liquid.',
    mood: 'Slop baseline kept for comparison only',
    fonts: 'Instrument Serif · Bricolage · Space Mono',
    status: 'archive',
    swatches: ['#fef8f4', '#a43a3d', '#ff7f7f', '#1d1b19'],
    builtin: true,
  },
]

const STORAGE_KEY = 'hons-design-directions'

export function loadCustomDirections(): DesignDirection[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as DesignDirection[]
    return Array.isArray(parsed) ? parsed.filter((d) => d.id && d.name) : []
  } catch {
    return []
  }
}

export function saveCustomDirections(directions: DesignDirection[]) {
  const custom = directions.filter((d) => !d.builtin)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(custom))
}

export function getAllDirections(): DesignDirection[] {
  const custom = loadCustomDirections()
  const builtinIds = new Set(BUILTIN_DIRECTIONS.map((d) => d.id))
  const merged = [
    ...BUILTIN_DIRECTIONS,
    ...custom.filter((d) => !builtinIds.has(d.id)),
  ]
  return merged.filter((d) => d.status !== 'archive')
}

export function getDirection(id: string): DesignDirection | undefined {
  const fromBuiltin = BUILTIN_DIRECTIONS.find((d) => d.id === id && d.status !== 'archive')
  if (fromBuiltin) return fromBuiltin
  return getAllDirections().find((d) => d.id === id)
}

export function slugifyId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48)
}
