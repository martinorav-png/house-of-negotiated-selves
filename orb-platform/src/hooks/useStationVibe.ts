import { useEffect, useState } from 'react'
import {
  applyStationVibe,
  getStationVibe,
  setStationVibe,
  subscribeStationVibe,
  type StationVibe,
} from '../lib/stationVibe'

export function useStationVibe() {
  const [vibe, setVibe] = useState<StationVibe>(() => {
    const next = getStationVibe()
    applyStationVibe(next)
    return next
  })

  useEffect(() => {
    const unsubscribe = subscribeStationVibe(() => setVibe(getStationVibe()))
    return unsubscribe
  }, [])

  return [vibe, setStationVibe] as const
}
