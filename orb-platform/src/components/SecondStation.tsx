import { QuestionCardDeck } from './QuestionCardDeck'
import { CardPointCloudRoom } from './CardPointCloudRoom'
import { GridScan } from './GridScan'
import { SECOND_STATION_POINT_CLOUD_CONFIG } from '../lib/secondStationPointCloud'
import './SecondStation.css'

export function SecondStation() {
  return (
    <section
      className="second-station"
      aria-label="Second station question cards"
    >
      <CardPointCloudRoom />
      <GridScan
        sensitivity={0}
        lineThickness={4}
        linesColor="#171c19"
        gridScale={0.02}
        scanColor="#ffffff"
        scanColorAlt="#ffffff"
        scanColors={['#ffffff']}
        scanOpacity={0.4}
        showBasePattern={false}
        enablePost
        bloomIntensity={0.6}
        chromaticAberration={0.003}
        noiseIntensity={0.1}
        lineJitter={1}
        scanSoftness={1.5}
        scanDuration={SECOND_STATION_POINT_CLOUD_CONFIG.ripple.duration}
        scanDelay={0}
      />
      <QuestionCardDeck />
    </section>
  )
}
