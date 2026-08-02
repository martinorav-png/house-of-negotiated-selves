import { motion } from 'framer-motion'
import { itemVariants } from '../lib/motion'

type Props = {
  title: string
  icon?: 'heart' | 'florist' | 'diamond'
  className?: string
}

const icons = {
  heart: 'favorite',
  florist: 'local_florist',
  diamond: 'diamond',
} as const

export function TopOrnament({ title, icon = 'heart', className = '' }: Props) {
  return (
    <motion.div
      className={`flex flex-col items-center text-center ${className}`}
      variants={itemVariants}
    >
      <span className={`material-symbols-outlined mb-2 text-3xl text-rose ${icon === 'heart' ? 'filled' : ''}`}>
        {icons[icon]}
      </span>
      <h1 className="font-display text-2xl font-semibold uppercase tracking-wide-caps text-rose md:text-3xl">
        {title}
      </h1>
      <div className="mt-6 flex items-center justify-center gap-4">
        <div className="diamond diamond-sm bg-outline" />
        <div className="h-px w-12 bg-outline-variant" />
        <div className="diamond diamond-sm bg-outline" />
      </div>
      <InstallationLabel className="mt-2" />
    </motion.div>
  )
}

export function InstallationLabel({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="material-symbols-outlined filled text-[10px] text-rose">favorite</span>
      <p className="font-label text-[10px] uppercase tracking-caps text-outline md:text-xs">
        House of Negotiated Selves
      </p>
      <span className="material-symbols-outlined filled text-[10px] text-rose">favorite</span>
    </div>
  )
}

export function HairlineHeartOrnament() {
  return (
    <motion.div className="mb-8 flex w-full items-center justify-center opacity-60" variants={itemVariants}>
      <div className="h-px w-16 bg-border" />
      <div className="mx-4 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-panel-lowest">
        <span className="material-symbols-outlined text-sm text-rose">favorite</span>
      </div>
      <div className="h-px w-16 bg-border" />
    </motion.div>
  )
}
