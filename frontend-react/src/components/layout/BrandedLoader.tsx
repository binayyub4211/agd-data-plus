import { motion, AnimatePresence } from 'framer-motion'

interface BrandedLoaderProps {
  isLoading: boolean
}

export function BrandedLoader({ isLoading }: BrandedLoaderProps) {
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.3 } }}
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-brand-midnight/95 backdrop-blur-xl"
        >
          {/* Outer glow ring */}
          <div className="relative flex items-center justify-center mb-8">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              className="absolute w-24 h-24 rounded-full border-2 border-transparent border-t-brand-cyan"
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
              className="absolute w-20 h-20 rounded-full border border-transparent border-t-brand-royal/50"
            />
            <motion.img
              src="/logo.png"
              alt="AGD"
              className="w-12 h-12 object-contain drop-shadow-[0_0_16px_rgba(0,212,255,0.6)]"
              animate={{ scale: [1, 1.08, 1], opacity: [1, 0.85, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center gap-3"
          >
            <span className="text-lg font-black tracking-[0.3em] text-white uppercase font-display">
              AGD DATA PLUS
            </span>
            <div className="flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{ opacity: [0.2, 1, 0.2], y: [0, -4, 0] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                  className="w-1.5 h-1.5 bg-brand-cyan rounded-full"
                />
              ))}
            </div>
            <p className="text-brand-silver/30 text-[10px] uppercase tracking-[0.25em] mt-1">
              Secure Financial Flow
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
