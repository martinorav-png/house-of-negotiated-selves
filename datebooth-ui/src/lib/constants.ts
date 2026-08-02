export type ScreenId = 'about-you' | 'how-you-love' | 'matches' | 'forging' | 'reveal'

export const SCREEN_ORDER: ScreenId[] = [
  'about-you',
  'how-you-love',
  'matches',
  'forging',
  'reveal',
]

export const ASSETS = {
  ambientScene: '/assets/ambient-scene.jpg',
  companionMatches: '/assets/companion-matches.jpg',
  companionForging: '/assets/companion-forging.jpg',
  companionReveal: '/assets/companion-reveal.jpg',
} as const
