import { describe, expect, it } from 'vitest'
import scene from './Scene.tsx?raw'
import secondStation from './SecondStation.tsx?raw'
import autoCardStack from './AutoCardStack.tsx?raw'
import cardStyles from './AutoCardStack.css?raw'
import postProcessing from './PostProcessing.tsx?raw'
import pointCloudShaders from '../shaders/pointCloudShaders.ts?raw'
import cardSwapSource from './CardSwap.jsx?raw'
import cardSwapStyles from './CardSwap.css?raw'

describe('station composition', () => {
  it('uses the registry CardSwap implementation and stylesheet', () => {
    expect(cardSwapSource).toContain("import gsap from 'gsap'")
    expect(cardSwapSource).toContain('const makeSlot =')
    expect(cardSwapSource).toContain("ease: 'elastic.out(0.6,0.9)'")
    expect(cardSwapSource).toContain('export default CardSwap')
    expect(cardSwapStyles).toContain('.card-swap-container')
    expect(cardSwapStyles).toContain('perspective: 900px')
  })

  it('keeps question cards out of the orb scene', () => {
    expect(scene).not.toContain('RoomQuestionCards')
  })

  it('puts the scan field behind a static card row', () => {
    expect(secondStation).toContain('GridScan')
    expect(secondStation).toContain('AutoCardStack')
  })

  it('uses the supplied TiltedCard component for the station cards', () => {
    expect(autoCardStack).toContain("import TiltedCard from './TiltedCard'")
    expect(autoCardStack).toContain('rotateAmplitude={0}')
    expect(autoCardStack).toContain('scaleOnHover={1}')
    expect(autoCardStack).not.toContain('HOUSE OF NEGOTIATED SELVES')
    expect(autoCardStack).not.toContain('card.kicker.toUpperCase()')
    expect(autoCardStack).toContain('captionText={card.title}')
  })

  it('does not keep automatic card cycling on the second station', () => {
    expect(secondStation).not.toContain('setInterval')
  })

  it('keeps the card row visually static without hover motion', () => {
    expect(cardStyles).not.toContain('.auto-stack-card:hover')
    expect(cardStyles).not.toContain('transition:')
  })

  it('keeps VHS-style post effects out of the orb', () => {
    expect(postProcessing).not.toContain('ChromaticAberration')
    expect(postProcessing).not.toContain('<Noise')
    expect(postProcessing).not.toContain('<Vignette')
  })

  it('keeps moving scan bands out of the orb point cloud', () => {
    expect(pointCloudShaders).not.toContain('vScan')
    expect(pointCloudShaders).not.toContain('scanLocal')
  })
})
