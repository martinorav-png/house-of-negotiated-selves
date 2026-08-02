import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useState } from 'react'
import { AmbientScene } from './components/AmbientScene'
import type { ScreenId } from './lib/constants'
import { SCREEN_ORDER } from './lib/constants'
import { pageVariants } from './lib/motion'
import { AboutYouScreen } from './screens/AboutYouScreen'
import { ForgingScreen } from './screens/ForgingScreen'
import { HowYouLoveScreen } from './screens/HowYouLoveScreen'
import { MatchesScreen } from './screens/MatchesScreen'
import { RevealScreen } from './screens/RevealScreen'

export default function App() {
  const [screen, setScreen] = useState<ScreenId>('about-you')
  const [lockedPersonaId, setLockedPersonaId] = useState('ren')

  const goNext = useCallback(() => {
    setScreen((current) => {
      const index = SCREEN_ORDER.indexOf(current)
      return SCREEN_ORDER[Math.min(index + 1, SCREEN_ORDER.length - 1)]
    })
  }, [])

  const goBack = useCallback(() => {
    setScreen((current) => {
      const index = SCREEN_ORDER.indexOf(current)
      return SCREEN_ORDER[Math.max(index - 1, 0)]
    })
  }, [])

  const handleMatchesComplete = useCallback(
    (personaId: string) => {
      setLockedPersonaId(personaId)
      goNext()
    },
    [goNext],
  )

  return (
    <div className="relative min-h-dvh bg-void">
      <AmbientScene activeScreen={screen} />

      <div className="relative z-10 mx-auto mirror-frame overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={screen}
            className="min-h-full"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {screen === 'about-you' && <AboutYouScreen onContinue={goNext} />}
            {screen === 'how-you-love' && (
              <HowYouLoveScreen onContinue={goNext} onBack={goBack} />
            )}
            {screen === 'matches' && (
              <MatchesScreen onContinue={handleMatchesComplete} onBack={goBack} />
            )}
            {screen === 'forging' && <ForgingScreen onComplete={goNext} />}
            {screen === 'reveal' && (
              <RevealScreen lockedPersonaId={lockedPersonaId} onBack={goBack} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
