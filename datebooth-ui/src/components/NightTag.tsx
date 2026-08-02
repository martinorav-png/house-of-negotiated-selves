import { motion } from 'framer-motion'
import { itemVariants } from '../lib/motion'

type TagState = 'available' | 'reserved' | 'matched'

const copy: Record<TagState, string> = {
  available: 'Available Tonight',
  reserved: 'Reserved For You',
  matched: 'Matched',
}

type Props = {
  state?: TagState
  className?: string
}

export function NightTag({ state = 'available', className = '' }: Props) {
  return (
    <motion.div
      variants={itemVariants}
      className={`inline-block border border-border bg-panel-lowest px-4 py-1.5 ${className}`}
      layout
    >
      {state === 'matched' ? (
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 bg-rose-deep" />
          <span className="font-label text-[10px] font-bold uppercase tracking-wide-caps text-rose-deep">
            {copy[state]}
          </span>
        </div>
      ) : (
        <span className="font-label text-[10px] font-bold uppercase tracking-wide-caps text-text-muted">
          {copy[state]}
        </span>
      )}
    </motion.div>
  )
}
