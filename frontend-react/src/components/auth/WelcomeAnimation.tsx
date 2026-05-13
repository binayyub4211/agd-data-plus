import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldCheck, Star } from 'lucide-react'

interface WelcomeAnimationProps {
  name: string
  onComplete: () => void
}

// Particle generator
function Particle({ delay }: { delay: number }) {
  const x = (Math.random() - 0.5) * 500
  const y = (Math.random() - 0.5) * 500
  const color = ['#00D4FF', '#F5A623', '#1A4FDB', '#ffffff'][Math.floor(Math.random() * 4)]
  const size = Math.random() * 6 + 3

  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{ width: size, height: size, background: color, top: '50%', left: '50%' }}
      initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
      animate={{ x, y, opacity: 0, scale: 0 }}
      transition={{ duration: 1.4, delay, ease: 'easeOut' }}
    />
  )
}

export function WelcomeAnimation({ name, onComplete }: WelcomeAnimationProps) {
  const [phase, setPhase] = useState<'burst' | 'text' | 'exit'>('burst')
  const particles = Array.from({ length: 60 })

  useEffect(() => {
    // Phase sequence: burst → text → exit → done
    const t1 = setTimeout(() => setPhase('text'), 600)
    const t2 = setTimeout(() => setPhase('exit'), 2400)
    const t3 = setTimeout(() => onComplete(), 3000)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [onComplete])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[300] flex items-center justify-center bg-brand-midnight overflow-hidden"
    >
      {/* Deep glow */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.4, 1], opacity: [0.15, 0.35, 0.15] }}
          transition={{ duration: 2.5, repeat: Infinity }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-royal rounded-full blur-[120px]"
        />
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.25, 0.1] }}
          transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-brand-cyan rounded-full blur-[100px]"
        />
      </div>

      {/* Burst particles */}
      <div className="absolute top-1/2 left-1/2">
        {phase === 'burst' &&
          particles.map((_, i) => <Particle key={i} delay={i * 0.012} />)}
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-8">
        {/* Logo */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 18 }}
          className="relative mb-8"
        >
          <motion.img
            src="/logo.png"
            alt="AGD"
            className="w-24 h-24 object-contain drop-shadow-[0_0_30px_rgba(0,212,255,0.7)]"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="absolute -top-2 -right-2 w-8 h-8 bg-brand-cyan rounded-full flex items-center justify-center"
          >
            <ShieldCheck size={16} className="text-brand-midnight" />
          </motion.div>
        </motion.div>

        {/* Stars */}
        <AnimatePresence>
          {phase !== 'burst' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex gap-1.5 mb-6"
            >
              {[0, 1, 2, 3, 4].map((i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0, rotate: -30 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.6 + i * 0.08, type: 'spring' }}
                >
                  <Star size={18} className="text-brand-gold fill-brand-gold" />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Welcome Text */}
        <AnimatePresence>
          {phase !== 'burst' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ delay: 0.3 }}
            >
              <p className="text-brand-cyan text-sm font-bold uppercase tracking-[0.3em] mb-3">
                Welcome to
              </p>
              <h1 className="text-5xl md:text-6xl font-black text-white font-display leading-none mb-4">
                AGD DATA PLUS
              </h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-2xl text-brand-gold font-bold mb-2"
              >
                Hello, {name.split(' ')[0]}! 👋
              </motion.p>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.1 }}
                className="text-brand-silver/60 text-base max-w-sm"
              >
                Your secure financial journey begins now.
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading bar */}
        <AnimatePresence>
          {phase === 'text' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.3 }}
              className="mt-10 w-48"
            >
              <div className="h-0.5 w-full bg-brand-royal/20 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 1.5, ease: 'easeInOut', delay: 1.3 }}
                  className="h-full bg-gradient-to-r from-brand-royal to-brand-cyan rounded-full"
                />
              </div>
              <p className="text-brand-silver/30 text-[10px] uppercase tracking-widest mt-3 text-center">
                Setting up your account...
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
