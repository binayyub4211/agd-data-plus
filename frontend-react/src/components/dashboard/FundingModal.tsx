import { motion, AnimatePresence } from 'framer-motion'
import { X, Banknote, ShieldCheck, Copy, Check } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { Card } from '@/components/ui/Card'

interface FundingModalProps {
  isOpen: boolean
  onClose: () => void
  virtualAccount?: {
    accountNumber?: string
    bankName?: string
    accountName?: string
  }
}

export function FundingModal({ isOpen, onClose, virtualAccount }: FundingModalProps) {
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const handleCopy = () => {
    if (virtualAccount?.accountNumber) {
      navigator.clipboard.writeText(virtualAccount.accountNumber)
      setCopied(true)
      toast.success('Account number copied!')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-brand-midnight/80 backdrop-blur-sm"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md"
        >
          <Card className="p-8 border-brand-royal/20 bg-brand-midnight/90 shadow-2xl relative overflow-hidden">
             {/* Glow Effect */}
             <div className="absolute -top-24 -right-24 w-48 h-48 bg-brand-royal/20 rounded-full blur-3xl" />
             
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-black text-white font-display">Wallet Funding</h3>
                <p className="text-brand-silver/40 text-xs uppercase tracking-widest mt-1">Your dedicated deposit account</p>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-brand-silver/50 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              {virtualAccount?.accountNumber ? (
                <>
                  <div className="space-y-4">
                    <div className="p-6 rounded-2xl bg-white/5 border border-white/5 space-y-4">
                      <div>
                        <p className="text-[10px] font-black text-brand-silver/40 uppercase tracking-widest mb-1">Bank Name</p>
                        <p className="text-lg font-black text-brand-cyan">{virtualAccount.bankName}</p>
                      </div>
                      
                      <div>
                        <p className="text-[10px] font-black text-brand-silver/40 uppercase tracking-widest mb-1">Account Name</p>
                        <p className="text-sm font-bold text-white">{virtualAccount.accountName}</p>
                      </div>

                      <div className="pt-4 border-t border-white/5">
                        <p className="text-[10px] font-black text-brand-silver/40 uppercase tracking-widest mb-2">Account Number</p>
                        <div className="flex items-center justify-between bg-brand-midnight/50 p-4 rounded-xl border border-brand-royal/20">
                          <span className="text-2xl font-black text-white tracking-[0.2em] font-display">
                            {virtualAccount.accountNumber}
                          </span>
                          <button
                            onClick={handleCopy}
                            className="p-2 rounded-lg bg-brand-royal/20 text-brand-cyan hover:scale-110 transition-all"
                          >
                            {copied ? <Check size={18} /> : <Banknote size={18} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-brand-cyan/5 border border-brand-cyan/10 flex items-start gap-3">
                    <ShieldCheck className="text-brand-cyan shrink-0 mt-0.5" size={18} />
                    <p className="text-[10px] text-brand-silver/60 leading-relaxed">
                      Funds sent to this account will be credited to your wallet **automatically** within minutes. 
                      This is a permanent account dedicated only to you.
                    </p>
                  </div>

                  <button
                    onClick={onClose}
                    className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-xs font-black text-brand-silver uppercase tracking-widest hover:bg-white/10 transition-all"
                  >
                    I've made the transfer
                  </button>
                </>
              ) : (
                <div className="py-12 text-center space-y-4">
                  <div className="w-16 h-16 bg-brand-royal/10 rounded-full flex items-center justify-center mx-auto animate-pulse">
                    <Banknote size={32} className="text-brand-silver/20" />
                  </div>
                  <p className="text-brand-silver/40 text-sm">Generating your dedicated account...</p>
                  <p className="text-[10px] text-brand-silver/20 italic">Please refresh in a moment</p>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
