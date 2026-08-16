export type StationRoute = 'orb' | 'cards' | 'avatars' | 'mirror'

export function getStationFromHash(hash: string): StationRoute {
  if (hash === '#/cards') return 'cards'
  if (hash === '#/avatars') return 'avatars'
  if (hash === '#/mirror') return 'mirror'
  return 'orb'
}

export function getStationHref(station: StationRoute) {
  return `#/${station}`
}
