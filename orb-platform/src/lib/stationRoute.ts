export type StationRoute = 'orb' | 'cards' | 'avatars'

export function getStationFromHash(hash: string): StationRoute {
  if (hash === '#/cards') return 'cards'
  if (hash === '#/avatars') return 'avatars'
  return 'orb'
}

export function getStationHref(station: StationRoute) {
  if (station === 'orb') return '/'
  return `#/${station}`
}
