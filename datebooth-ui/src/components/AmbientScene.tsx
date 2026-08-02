import { motion, useReducedMotion } from 'framer-motion'
import type { ScreenId } from '../lib/constants'
import { ASSETS } from '../lib/constants'

type Props = {
  activeScreen: ScreenId
}

export function AmbientScene({ activeScreen }: Props) {
  const reduce = useReducedMotion()
  const visible = activeScreen === 'about-you'

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      initial={false}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: reduce ? 0 : 0.9, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.img
        src={ASSETS.ambientScene}
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-[0.14] mix-blend-luminosity"
        animate={
          reduce
            ? undefined
            : {
                scale: [1, 1.04, 1],
                x: [0, -8, 0],
              }
        }
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-void/40 via-void/80 to-void" />
    </motion.div>
  )
}
