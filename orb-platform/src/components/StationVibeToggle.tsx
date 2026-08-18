import { useStationVibe } from '../hooks/useStationVibe'

export function StationVibeToggle() {
  const [vibe, setVibe] = useStationVibe()
  const nextVibe = vibe === 'warm' ? 'original' : 'warm'
  const label = nextVibe === 'original' ? 'Original look' : 'Warm look'

  return (
    <button
      className="station-vibe-toggle"
      type="button"
      onClick={() => setVibe(nextVibe)}
      aria-pressed={vibe === 'warm'}
      aria-label={`Switch stations to ${label}`}
    >
      {label}
    </button>
  )
}
