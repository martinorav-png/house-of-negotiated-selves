export type StationRoute =
  | 'orb'
  | 'cards'
  | 'avatars'
  | 'mirror'
  | 'station-1'
  | 'station-2'

export function getStationFromHash(hash: string): StationRoute {
  if (hash === '#/cards') return 'cards'
  if (hash === '#/avatars') return 'avatars'
  if (hash === '#/mirror') return 'mirror'
  if (hash === '#/station-1') return 'station-1'
  if (hash === '#/station-2') return 'station-2'
  return 'orb'
}

export function getStationHref(station: StationRoute) {
  return `#/${station}`
}
