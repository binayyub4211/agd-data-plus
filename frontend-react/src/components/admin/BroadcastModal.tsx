import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { X, Send, Mail, Bell, ShieldAlert, CheckCircle2 } from 'lucide-react'

interface BroadcastModalProps {
  isOpen: boolean
  onClose: () => void
}

export function BroadcastModal({ isOpen, onClose }: BroadcastModalProps) {
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [type, setType] = useState('INFO')
  const [sendEmail, setSendEmail] = useState(false)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'form' | 'confirm'>('form')

  const handleSend = async () => {
    setLoading(true)
    try {
      await api.post('/admin/broadcast', {
        title,
        message,
        type,
        sendEmail
      })
      toast.success('Broadcast sent successfully!')
      onClose()
      // Reset
      setTitle('')
      setMessage('')
      setType('INFO')
      setSendEmail(false)
      setStep('form')
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Broadcast failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-brand-midnight/95 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-xl bg-[#0D1323] border border-brand-royal/20 rounded-[2.5rem] overflow-hidden shadow-[0_0_100px_rgba(26,79,219,0.2)]"
          >
            {/* Header */}
            <div className="p-8 border-b border-brand-royal/10 flex items-center justify-between bg-brand-royal/5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-brand-royal/20 flex items-center justify-center text-brand-cyan">
                  <ShieldAlert size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">Global Broadcast</h3>
                  <p className="text-xs text-brand-silver/30 font-medium uppercase tracking-widest">Master Communication Hub</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl text-brand-silver/20 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="p-8 space-y-8">
              {step === 'form' ? (
                <>
                  <div className="space-y-6">
                    <Input 
                      label="Broadcast Title"
                      placeholder="e.g., Scheduled Maintenance"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                    />
                    
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-brand-silver/40 px-2">Message Body</label>
                      <textarea
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        placeholder="Enter the full message to all users..."
                        className="w-full bg-white/5 border border-brand-royal/10 rounded-2xl p-4 text-sm focus:outline-none focus:border-brand-cyan min-h-[150px] transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-brand-silver/40 px-2">Alert Type</label>
                        <select 
                          value={type}
                          onChange={e => setType(e.target.value)}
                          className="w-full bg-white/5 border border-brand-royal/10 rounded-xl p-3 text-xs focus:outline-none focus:border-brand-cyan transition-all appearance-none"
                        >
                          <option value="INFO">Information (Cyan)</option>
                          <option value="SUCCESS">Success (Green)</option>
                          <option value="WARNING">Warning (Gold)</option>
                          <option value="DANGER">Critical (Red)</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-brand-silver/40 px-2">Channels</label>
                        <button 
                          onClick={() => setSendEmail(!sendEmail)}
                          className={`w-full p-3 rounded-xl border flex items-center justify-between transition-all ${
                            sendEmail 
                              ? 'bg-brand-cyan/10 border-brand-cyan text-brand-cyan' 
                              : 'bg-white/5 border-brand-royal/10 text-brand-silver/30'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Mail size={14} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Email Blast</span>
                          </div>
                          <div className={`w-4 h-4 rounded border flex items-center justify-center ${sendEmail ? 'bg-brand-cyan border-brand-cyan' : 'border-white/10'}`}>
                            {sendEmail && <X size={10} className="text-brand-midnight rotate-45" />}
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>

                  <Button 
                    className="w-full h-14 bg-brand-royal hover:bg-brand-royal/80 text-white font-black uppercase tracking-widest rounded-2xl shadow-[0_0_30px_rgba(26,79,219,0.3)]"
                    onClick={() => setStep('confirm')}
                    disabled={!title || !message}
                  >
                    Proceed to Blast
                  </Button>
                </>
              ) : (
                <div className="space-y-8 py-4">
                  <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-[2rem] text-center">
                    <div className="w-16 h-16 rounded-3xl bg-red-500/20 flex items-center justify-center mx-auto mb-4 text-red-500">
                      <ShieldAlert size={32} />
                    </div>
                    <h4 className="text-lg font-black text-white">Critical Confirmation</h4>
                    <p className="text-xs text-brand-silver/40 mt-2 leading-relaxed">
                      You are about to send a notification to <span className="text-white font-bold">ALL</span> registered users. {sendEmail && 'This will also trigger an email blast.'} This action cannot be undone.
                    </p>
                  </div>

                  <div className="bg-white/5 rounded-2xl p-6 border border-brand-royal/10">
                    <p className="text-[10px] font-black uppercase tracking-widest text-brand-silver/30 mb-2">Subject Preview</p>
                    <p className="text-sm font-bold text-white mb-4">{title}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-brand-silver/30 mb-2">Message Snippet</p>
                    <p className="text-xs text-brand-silver/50 leading-relaxed truncate">{message}</p>
                  </div>

                  <div className="flex gap-4">
                    <Button 
                      variant="outline" 
                      className="flex-1 border-white/10 text-brand-silver/50"
                      onClick={() => setStep('form')}
                    >
                      Back to Edit
                    </Button>
                    <Button 
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white font-black shadow-[0_0_40px_rgba(34,197,94,0.2)]"
                      onClick={handleSend}
                      loading={loading}
                    >
                      <Send size={16} className="mr-2" />
                      Final Blast
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-8 py-6 bg-brand-royal/5 flex items-center justify-between">
               <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-brand-silver/20">
                 <CheckCircle2 size={12} className="text-brand-cyan" />
                 Verified Admin Token Active
               </div>
               <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-brand-cyan animate-pulse" />
                 <span className="text-[8px] font-black text-brand-cyan uppercase tracking-tighter">Encrypted Node</span>
               </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
