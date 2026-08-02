import { motion } from 'framer-motion'
import { itemVariants } from '../lib/motion'

type Props = {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  className?: string
}

export function HeartKeyButton({ children, onClick, disabled, className = '' }: Props) {
  return (
    <motion.button
      type="button"
      variants={itemVariants}
      whileHover={disabled ? undefined : { scale: 1.01 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 420, damping: 28 }}
      disabled={disabled}
      onClick={onClick}
      className={`group relative flex w-full items-center justify-center gap-3 overflow-hidden bg-rose px-8 py-4 font-label text-xs font-bold uppercase tracking-caps text-ink-on-rose transition-colors hover:bg-rose-bright disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      <span className="material-symbols-outlined filled relative z-10 text-lg">key</span>
      <span className="relative z-10">{children}</span>
      <motion.span
        className="absolute inset-0 bg-black/10"
        initial={{ y: '100%' }}
        whileHover={{ y: 0 }}
        transition={{ duration: 0.3 }}
      />
    </motion.button>
  )
}

export function FooterDiamonds() {
  return (
    <motion.footer
      className="flex items-center justify-center gap-4 pb-8 pt-6 opacity-60"
      variants={itemVariants}
    >
      <div className="diamond diamond-sm scale-75 opacity-40" />
      <div className="diamond diamond-sm opacity-80" />
      <div className="diamond diamond-sm scale-75 opacity-40" />
    </motion.footer>
  )
}
