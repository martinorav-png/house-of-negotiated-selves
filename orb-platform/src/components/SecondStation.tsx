import { AutoCardStack } from './AutoCardStack'
import { GridScan } from './GridScan'
import { CARD_PALETTE } from '../lib/cardPalette'
import './SecondStation.css'

export function SecondStation() {
  return (
    <section
      className="second-station"
      aria-label="Second station question cards"
    >
      <GridScan
        sensitivity={0}
        lineThickness={4}
        linesColor="#171c19"
        gridScale={0.02}
        scanColor="#ffffff"
        scanColorAlt="#ffffff"
        scanColors={[...CARD_PALETTE]}
        scanOpacity={0.4}
        enablePost
        bloomIntensity={0.6}
        chromaticAberration={0.003}
        noiseIntensity={0.1}
        lineJitter={1}
        scanSoftness={1.5}
      />
      <AutoCardStack />
    </section>
  )
}
