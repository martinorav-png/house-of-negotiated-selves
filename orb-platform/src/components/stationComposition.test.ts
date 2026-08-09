import { describe, expect, it } from 'vitest'
import scene from './Scene.tsx?raw'
import secondStation from './SecondStation.tsx?raw'
import questionCardDeck from './QuestionCardDeck.tsx?raw'
import questionCardDeckStyles from './QuestionCardDeck.css?raw'
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

  it('keeps GridScan and mounts the React Bits question deck', () => {
    expect(secondStation).toContain('GridScan')
    expect(secondStation).toContain('QuestionCardDeck')
    expect(secondStation).not.toContain('AutoCardStack')
  })

  it('passes every existing question to the exact CardSwap component', () => {
    expect(questionCardDeck).toContain("import CardSwap, { Card } from './CardSwap'")
    expect(questionCardDeck).toContain('stationCards.map')
    expect(questionCardDeck).toContain('<CardSwap')
    expect(questionCardDeck).toContain('pauseOnHover={true}')
    expect(questionCardDeck).toContain('easing="linear"')
  })

  it('limits the presentation to three visible depth slots', () => {
    expect(questionCardDeck).toContain('question-deck-viewport')
    expect(questionCardDeckStyles).toContain('overflow: hidden')
    expect(questionCardDeckStyles).toContain('--deck-visible-slots: 3')
  })

  it('hides animated cards outside the three highest live depth slots', () => {
    expect(questionCardDeck).toContain('new MutationObserver(syncVisibleCards)')
    expect(questionCardDeck).toContain('.slice(0, DECK_VISIBLE_SLOTS)')
    expect(questionCardDeck).toContain("toggleAttribute('data-deck-visible'")
    expect(questionCardDeckStyles).toContain(
      '.question-deck-viewport:not(.question-deck-static) .question-swap-card:not([data-deck-visible])',
    )
    expect(questionCardDeckStyles).toContain('visibility: hidden')
  })

  it('uses a stable three-card fallback for reduced motion', () => {
    expect(questionCardDeck).toContain('usePrefersReducedMotion')
    expect(questionCardDeck).toContain('stationCards.slice(0, 3)')
    expect(questionCardDeck).toContain('question-deck-static')
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
