export type AvatarPortrait = {
  image: string
  caption: string
  id: string
}

/**
 * Station 3 portraits — served from `orb-platform/public/assets/personas`.
 * Keep captions short; MorphSlider shows them over the morph stage.
 */
export const avatarPortraits: AvatarPortrait[] = [
  {
    id: 'persona-1',
    image: '/assets/personas/persona-1.png',
    caption: 'Persona 01',
  },
  {
    id: 'persona-2',
    image: '/assets/personas/persona-2.png',
    caption: 'Persona 02',
  },
  {
    id: 'persona-3',
    image: '/assets/personas/persona-3.png',
    caption: 'Persona 03',
  },
  {
    id: 'persona-4',
    image: '/assets/personas/persona-4.png',
    caption: 'Persona 04',
  },
  {
    id: 'persona-5',
    image: '/assets/personas/persona-5.png',
    caption: 'Persona 05',
  },
]
