import { motion } from 'framer-motion'

type Props = {
  src: string
  alt?: string
  className?: string
  showPedestal?: boolean
  showTag?: string
}

export function CompanionVitrine({
  src,
  alt = 'Companion silhouette',
  className = '',
  showPedestal = true,
  showTag,
}: Props) {
  return (
    <motion.div
      className={`relative overflow-hidden bureau-border bg-panel-lowest ${className}`}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-rose/10 to-transparent" />
      <img
        src={src}
        alt={alt}
        className="h-full w-full object-cover opacity-80 mix-blend-screen"
        loading="lazy"
        decoding="async"
      />
      {showTag && (
        <div className="absolute bottom-0 left-0 right-0 z-20 border-t border-border bg-panel-lowest/90 px-4 py-2 backdrop-blur-sm">
          <span className="font-label text-[10px] uppercase tracking-wide-caps text-rose">
            {showTag}
          </span>
        </div>
      )}
      {showPedestal && (
        <div className="pointer-events-none absolute bottom-0 left-1/2 z-20 w-3/4 -translate-x-1/2">
          <div className="h-0.5 w-full bg-rose/40 blur-sm" />
        </div>
      )}
    </motion.div>
  )
}

export function SilhouetteFrame() {
  return (
    <motion.div
      className="relative mb-12 flex h-32 w-24 items-center justify-center overflow-hidden bureau-border bg-panel-lowest"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.5 }}
    >
      <div className="absolute top-0 bottom-0 left-1/2 w-px bg-border opacity-50" />
      <div className="absolute left-0 right-0 top-1/2 h-px bg-border opacity-50" />
      <div className="absolute top-1 left-1 h-2 w-2 border-l border-t border-outline" />
      <div className="absolute top-1 right-1 h-2 w-2 border-r border-t border-outline" />
      <div className="absolute bottom-1 left-1 h-2 w-2 border-b border-l border-outline" />
      <div className="absolute bottom-1 right-1 h-2 w-2 border-b border-r border-outline" />
      <div className="h-16 w-10 rounded-t-full border border-rose/30 bg-rose/5 shadow-[0_0_24px_rgba(245,184,196,0.15)]" />
    </motion.div>
  )
}
