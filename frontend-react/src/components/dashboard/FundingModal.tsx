import { motion, AnimatePresence } from 'framer-motion'
import { X, Banknote, ShieldCheck, Copy, Check, CreditCard, ArrowRight } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import api from '@/lib/api'

import { Clock } from 'lucide-react'

interface FundingModalProps {
  isOpen: boolean
  onClose: () => void
  ppAccount?: {
    accountNumber?: string
    bankName?: string
    accountName?: string
  }
  psAccount?: {
    accountNumber?: string
    bankName?: string
    accountName?: string
  }
  onRegenerateProvider?: (provider: 'PAYSTACK' | 'PAYMENTPOINT') => Promise<void>
  isRegenerating?: boolean
}

export function FundingModal({ isOpen, onClose, ppAccount, psAccount, onRegenerateProvider, isRegenerating }: FundingModalProps) {
  const [copied, setCopied] = useState<'PP' | 'PS' | null>(null)
  const [method, setMethod] = useState<'TRANSFER' | 'ONLINE'>('TRANSFER')
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleCopy = (num: string, type: 'PP' | 'PS') => {
    navigator.clipboard.writeText(num)
    setCopied(type)
    toast.success(`${type === 'PP' ? 'PaymentPoint' : 'Paystack'} A/C Copied!`)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleOnlinePayment = async () => {
    if (!amount || Number(amount) < 100) return toast.error('Minimum amount is ₦100')
    setLoading(true)
    try {
      const res = await api.post('/payments/initialize', { amount: Number(amount) })
      // Redirect to Paystack
      window.location.href = res.data.data.authorization_url
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to initialize payment')
    } finally {
      setLoading(false)
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
          <Card className="p-8 border-brand-royal/20 bg-brand-midnight/90 shadow-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto">
             {/* Glow Effect */}
             <div className="absolute -top-24 -right-24 w-48 h-48 bg-brand-royal/20 rounded-full blur-3xl" />
             
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-black text-white font-display uppercase tracking-tight">Fund Wallet</h3>
                <p className="text-brand-silver/40 text-[10px] uppercase tracking-widest mt-1 font-bold">Automatic Funding Guaranteed</p>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-brand-silver/50 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Method Toggle */}
            <div className="flex gap-2 p-1.5 bg-white/5 rounded-2xl mb-8">
              <button 
                onClick={() => setMethod('TRANSFER')}
                className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  method === 'TRANSFER' ? 'bg-brand-royal text-white shadow-lg' : 'text-brand-silver/30 hover:text-white'
                }`}
              >
                Bank Transfer
              </button>
              <button 
                onClick={() => setMethod('ONLINE')}
                className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  method === 'ONLINE' ? 'bg-brand-royal text-white shadow-lg' : 'text-brand-silver/30 hover:text-white'
                }`}
              >
                Online (Paystack)
              </button>
            </div>

            <div className="space-y-6">
              {method === 'TRANSFER' ? (
                <div className="space-y-4">
                  {/* Paystack Virtual Account */}
                  <div className="p-5 rounded-2xl bg-brand-royal/10 border border-brand-royal/20 space-y-3 relative">
                    <div className="flex justify-between items-center">
                      <p className="text-[9px] font-black text-brand-cyan uppercase tracking-[0.2em]">Method 1: Paystack (Wema Bank)</p>
                      <div className="flex items-center gap-2">
                        {onRegenerateProvider && psAccount?.accountNumber && (
                          <button 
                            onClick={() => onRegenerateProvider('PAYSTACK')}
                            disabled={isRegenerating}
                            className="p-1 hover:bg-white/10 rounded-md text-brand-cyan/60 hover:text-brand-cyan transition-colors"
                            title="Refresh Paystack A/C"
                          >
                            <Clock size={12} className={isRegenerating ? 'animate-spin' : ''} />
                          </button>
                        )}
                        <ShieldCheck size={14} className="text-brand-cyan" />
                      </div>
                    </div>
                    
                    {psAccount?.accountNumber ? (
                      <>
                        <div className="flex items-center justify-between bg-brand-midnight/50 p-4 rounded-xl border border-brand-royal/20">
                          <div>
                            <p className="text-[8px] font-black text-brand-silver/30 uppercase tracking-widest mb-1">Account Number</p>
                            <span className="text-xl font-black text-white tracking-[0.1em] font-display">
                              {psAccount.accountNumber}
                            </span>
                          </div>
                          <button
                            onClick={() => handleCopy(psAccount.accountNumber!, 'PS')}
                            className="p-3 rounded-xl bg-brand-royal/20 text-brand-cyan hover:scale-110 transition-all"
                          >
                            {copied === 'PS' ? <Check size={18} /> : <Copy size={18} />}
                          </button>
                        </div>
                        <div className="flex justify-between text-[10px] text-brand-silver/40 font-bold uppercase">
                          <span>A/C: {psAccount.accountName}</span>
                        </div>
                      </>
                    ) : (
                      <div className="py-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="w-full text-[9px] h-9 border-brand-royal/30 text-brand-cyan"
                          onClick={() => onRegenerateProvider?.('PAYSTACK')}
                          loading={isRegenerating}
                        >
                          Generate Paystack A/C
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* PaymentPoint Virtual Account */}
                  <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3 relative">
                    <div className="flex justify-between items-center">
                      <p className="text-[9px] font-black text-brand-silver/40 uppercase tracking-[0.2em]">Method 2: PaymentPoint</p>
                      {onRegenerateProvider && ppAccount?.accountNumber && (
                        <button 
                          onClick={() => onRegenerateProvider('PAYMENTPOINT')}
                          disabled={isRegenerating}
                          className="p-1 hover:bg-white/10 rounded-md text-brand-silver/30 hover:text-brand-cyan transition-colors"
                          title="Refresh PaymentPoint A/C"
                        >
                          <Clock size={12} className={isRegenerating ? 'animate-spin' : ''} />
                        </button>
                      )}
                    </div>

                    {ppAccount?.accountNumber ? (
                      <>
                        <div className="flex items-center justify-between bg-brand-midnight/50 p-4 rounded-xl border border-white/5">
                          <div>
                            <p className="text-[8px] font-black text-brand-silver/30 uppercase tracking-widest mb-1">Account Number</p>
                            <span className="text-xl font-black text-white tracking-[0.1em] font-display">
                              {ppAccount.accountNumber}
                            </span>
                          </div>
                          <button
                            onClick={() => handleCopy(ppAccount.accountNumber!, 'PP')}
                            className="p-3 rounded-xl bg-white/10 text-brand-silver/50 hover:scale-110 transition-all"
                          >
                            {copied === 'PP' ? <Check size={18} /> : <Copy size={18} />}
                          </button>
                        </div>
                        <div className="flex justify-between text-[10px] text-brand-silver/40 font-bold uppercase">
                          <span>A/C: {ppAccount.accountName} (PaymentPoint)</span>
                        </div>
                      </>
                    ) : (
                      <div className="py-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="w-full text-[9px] h-9 border-white/10 text-brand-silver/50"
                          onClick={() => onRegenerateProvider?.('PAYMENTPOINT')}
                          loading={isRegenerating}
                        >
                          Generate PaymentPoint A/C
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="p-4 rounded-2xl bg-brand-cyan/5 border border-brand-cyan/10 flex items-start gap-3 mt-4">
                    <ShieldCheck className="text-brand-cyan shrink-0 mt-0.5" size={16} />
                    <p className="text-[9px] text-brand-silver/60 leading-relaxed font-medium">
                      Funds sent to any of these accounts will be credited to your wallet **instantly**. These are permanent accounts dedicated only to you.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-brand-silver/40 px-2">Amount to Fund (₦)</label>
                    <div className="relative">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 font-bold text-brand-silver/30">₦</span>
                      <input 
                        type="number" 
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        placeholder="Min 100"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-10 pr-4 text-white font-black focus:outline-none focus:border-brand-cyan transition-all"
                      />
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-brand-royal/5 border border-brand-royal/10 flex items-start gap-3">
                    <CreditCard className="text-brand-cyan shrink-0 mt-0.5" size={18} />
                    <p className="text-[10px] text-brand-silver/60 leading-relaxed">
                      Pay instantly with **Card, USSD, or Bank Transfer** via Paystack. Your wallet will be credited immediately.
                    </p>
                  </div>

                  <Button 
                    className="w-full h-14 bg-brand-cyan hover:bg-brand-cyan/80 text-brand-midnight font-black"
                    onClick={handleOnlinePayment}
                    loading={loading}
                    disabled={!amount || Number(amount) < 100}
                  >
                    Pay Now <ArrowRight size={16} className="ml-2" />
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
