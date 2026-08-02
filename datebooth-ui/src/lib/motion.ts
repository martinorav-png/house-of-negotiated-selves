import type { Variants } from 'framer-motion'

export const easeOut = [0.16, 1, 0.3, 1] as const

export const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 28,
    filter: 'blur(6px)',
  },
  animate: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.65,
      ease: easeOut,
      staggerChildren: 0.08,
      delayChildren: 0.06,
    },
  },
  exit: {
    opacity: 0,
    y: -18,
    filter: 'blur(4px)',
    transition: { duration: 0.4, ease: easeOut },
  },
}

export const itemVariants: Variants = {
  initial: { opacity: 0, y: 16 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: easeOut },
  },
}

export const fadeVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.8, ease: easeOut } },
  exit: { opacity: 0, transition: { duration: 0.35 } },
}
