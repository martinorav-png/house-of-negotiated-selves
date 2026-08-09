import type {
  ForwardRefExoticComponent,
  HTMLAttributes,
  ReactNode,
  RefAttributes,
  ReactElement,
} from 'react'

type CardProps = HTMLAttributes<HTMLDivElement> & {
  customClass?: string
}

type CardSwapProps = {
  width?: number | string
  height?: number | string
  cardDistance?: number
  verticalDistance?: number
  delay?: number
  pauseOnHover?: boolean
  onCardClick?: (index: number) => void
  skewAmount?: number
  easing?: 'elastic' | 'linear'
  children?: ReactNode
}

export const Card: ForwardRefExoticComponent<
  CardProps & RefAttributes<HTMLDivElement>
>

export default function CardSwap(props: CardSwapProps): ReactElement
