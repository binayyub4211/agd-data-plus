"use client";

import { motion, AnimatePresence } from "framer-motion";

interface BrandedLoaderProps {
  isLoading: boolean;
}

export function BrandedLoader({ isLoading }: BrandedLoaderProps) {
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-brand-midnight/90 backdrop-blur-xl"
        >
          {/* Pulsing Logo */}
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              opacity: [1, 0.8, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="mb-8 relative"
          >
            <img src="/logo.png" alt="AGD Logo" className="w-24 h-24 md:w-32 md:h-32 object-contain drop-shadow-[0_0_20px_rgba(26,79,219,0.5)]" />
            
            {/* Spinning Ring */}
            <div className="absolute -inset-4 border-2 border-brand-cyan/20 border-t-brand-cyan rounded-full animate-spin" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col items-center gap-2"
          >
            <span className="text-xl font-bold tracking-[0.2em] text-white">AGD DATA PLUS</span>
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                  className="w-1.5 h-1.5 bg-brand-cyan rounded-full"
                />
              ))}
            </div>
            <p className="text-brand-silver/40 text-xs mt-4 uppercase tracking-widest">Secure Financial Flow</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
