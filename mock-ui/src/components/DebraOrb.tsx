import './DebraOrb.css'

type Props = {
  size?: 'sm' | 'md' | 'lg'
  warm?: number
}

const ORB_SRC = '/stitch/debra-orb.jpg'

export function DebraOrb({ size = 'md' }: Props) {
  return (
    <div className={`debra-orb debra-orb--${size}`} aria-hidden>
      <img src={ORB_SRC} alt="" className="debra-orb__img" />
    </div>
  )
}
