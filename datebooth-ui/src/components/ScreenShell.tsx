import { motion } from 'framer-motion'
import { FooterDiamonds } from './Buttons'
import { itemVariants } from '../lib/motion'

type Props = {
  children: React.ReactNode
  className?: string
}

const containerVariants = {
  animate: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
}

export function ScreenShell({ children, className = '' }: Props) {
  return (
    <motion.main
      className={`relative z-10 flex min-h-full flex-col px-4 py-8 md:px-6 ${className}`}
      variants={containerVariants}
      initial="initial"
      animate="animate"
    >
      {children}
      <motion.div className="mt-auto" variants={itemVariants}>
        <FooterDiamonds />
      </motion.div>
    </motion.main>
  )
}
