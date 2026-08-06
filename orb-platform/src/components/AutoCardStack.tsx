import TiltedCard from './TiltedCard'
import { stationCards } from '../lib/cardStation'
import './AutoCardStack.css'

const CARD_ART = [
  ['#e8f4ea', '#d2b57f', '#242d28'],
  ['#314035', '#a8cdb7', '#e8f4ea'],
  ['#d2b57f', '#738078', '#101411'],
  ['#c8dccd', '#a8cdb7', '#314035'],
  ['#3d4741', '#c8dccd', '#d2b57f'],
  ['#e8f4ea', '#738078', '#242d28'],
  ['#c8dccd', '#3d4741', '#101411'],
] as const

function makeCardImage(card: (typeof stationCards)[number]) {
  const index = stationCards.indexOf(card)
  const [start, middle, end] = CARD_ART[index % CARD_ART.length]
  const words = card.title.split(' ')
  const lines: string[] = []
  let line = ''

  for (const word of words) {
    const next = line ? `${line} ${word}` : word
    if (next.length > 18 && line) {
      lines.push(line)
      line = word
    } else {
      line = next
    }
  }

  if (line) lines.push(line)

  const title = lines
    .slice(0, 5)
    .map((text, lineIndex) => `<tspan x="300" dy="${lineIndex === 0 ? 0 : 40}">${text}</tspan>`)
    .join('')

  const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 860">
        <defs>
          <linearGradient id="cardGradient" x1="0" y1="0" x2="1" y2="1">
            <stop stop-color="${start}"/>
            <stop offset=".48" stop-color="${middle}"/>
            <stop offset="1" stop-color="${end}"/>
          </linearGradient>
        </defs>
        <rect width="600" height="860" rx="0" fill="url(#cardGradient)" fill-opacity=".62"/>
        <text x="300" y="350" text-anchor="middle" fill="#ffffff" fill-opacity=".95" stroke="#ffffff" stroke-opacity=".16" stroke-width="3" paint-order="stroke" font-family="Georgia, serif" font-size="32" font-weight="600">${title}</text>
    </svg>
  `

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

const CARD_IMAGES = stationCards.map((card) => makeCardImage(card))

export function AutoCardStack() {
  return (
    <div className="auto-stack" aria-label="Question cards">
      {stationCards.map((card, index) => (
        <TiltedCard
          key={card.kicker}
          imageSrc={CARD_IMAGES[index]}
          altText={card.title}
          captionText={card.title}
          containerHeight="100%"
          containerWidth="100%"
          imageHeight="100%"
          imageWidth="100%"
          rotateAmplitude={0}
          scaleOnHover={1}
          showMobileWarning={false}
          showTooltip={false}
          displayOverlayContent={false}
          overlayContent={null}
        />
      ))}
    </div>
  )
}
