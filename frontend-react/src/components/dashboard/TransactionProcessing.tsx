import { motion, AnimatePresence } from 'framer-motion'
import { ShieldCheck, Cpu, Database, Zap } from 'lucide-react'

interface ProcessingOverlayProps {
  isOpen: boolean
  status: 'processing' | 'success' | 'failed'
}

export function TransactionProcessing({ isOpen, status }: ProcessingOverlayProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] bg-brand-midnight flex flex-col items-center justify-center overflow-hidden"
        >
          {/* Animated Pixel Background */}
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            {[...Array(50)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  x: Math.random() * window.innerWidth, 
                  y: Math.random() * window.innerHeight,
                  opacity: 0 
                }}
                animate={{ 
                  y: [null, Math.random() * -200],
                  opacity: [0, 1, 0],
                  scale: [0, 1.5, 0]
                }}
                transition={{ 
                  duration: Math.random() * 2 + 1, 
                  repeat: Infinity,
                  delay: Math.random() * 2 
                }}
                className="absolute w-1 h-1 bg-brand-cyan shadow-[0_0_8px_#00D4FF]"
              />
            ))}
          </div>

          {/* Central Pulse Symbol */}
          <div className="relative">
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="w-32 h-32 rounded-[2.5rem] bg-gradient-to-br from-brand-royal to-brand-midnight border-2 border-brand-cyan/30 flex items-center justify-center relative z-10 shadow-[0_0_50px_rgba(0,212,255,0.2)]"
            >
              <ShieldCheck size={48} className="text-brand-cyan drop-shadow-[0_0_10px_#00D4FF]" />
              
              {/* Spinning Rings */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                className="absolute inset-[-10px] border border-dashed border-brand-cyan/20 rounded-full"
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                className="absolute inset-[-25px] border border-brand-royal/20 rounded-full"
              />
            </motion.div>

            {/* Scanning Line */}
            <motion.div
              animate={{ y: [-100, 200] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="absolute inset-x-[-100px] h-[2px] bg-gradient-to-r from-transparent via-brand-cyan/50 to-transparent blur-sm z-20"
            />
          </div>

          {/* Status Text */}
          <div className="mt-12 text-center relative z-10">
            <motion.h2
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-xl font-black text-white uppercase tracking-[0.4em] font-display mb-4"
            >
              {status === 'processing' ? 'Encrypting Stream' : 'Access Granted'}
            </motion.h2>
            
            <div className="flex gap-8">
              <StatusIcon icon={Cpu} label="Core" active={true} />
              <StatusIcon icon={Database} label="Vault" active={true} />
              <StatusIcon icon={Zap} label="Engine" active={status === 'success'} />
            </div>
          </div>

          {/* Progress Bar */}
          <div className="absolute bottom-12 w-64 h-1 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 3, ease: "easeInOut" }}
              className="h-full bg-gradient-to-r from-brand-royal to-brand-cyan"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function StatusIcon({ icon: Icon, label, active }: any) {
  return (
    <div className={`flex flex-col items-center gap-2 transition-all duration-500 ${active ? 'opacity-100 scale-110' : 'opacity-20 scale-90'}`}>
      <div className={`p-3 rounded-xl ${active ? 'bg-brand-cyan/10 text-brand-cyan' : 'bg-white/5 text-white'}`}>
        <Icon size={16} />
      </div>
      <span className="text-[8px] font-black uppercase tracking-widest">{label}</span>
    </div>
  )
}
