import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { X, Wifi, Smartphone, Zap, Monitor, ShieldCheck, ArrowRight, Check, KeyRound, Lock } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface PurchaseModalProps {
  isOpen: boolean
  onClose: () => void
  serviceType: string
  refreshProfile: () => void
}

const NETWORKS = [
  { id: '1', name: 'MTN',     color: 'bg-yellow-400', text: 'text-black' },
  { id: '2', name: 'Glo',     color: 'bg-green-500',  text: 'text-white' },
  { id: '3', name: 'Airtel',  color: 'bg-red-600',    text: 'text-white' },
  { id: '4', name: '9mobile', color: 'bg-green-800',  text: 'text-white' },
]

const SERVICE_META: Record<string, { icon: React.ElementType; label: string; color: string; placeholder: string }> = {
  DATA:        { icon: Wifi,       label: 'Buy Data',    color: 'text-brand-cyan',  placeholder: 'Select Network & Plan' },
  AIRTIME:     { icon: Smartphone, label: 'Airtime',     color: 'text-green-400',   placeholder: 'Select Network'  },
  ELECTRICITY: { icon: Zap,        label: 'Electricity', color: 'text-brand-gold',  placeholder: 'e.g. PREPAID-5000' },
  CABLE:       { icon: Monitor,    label: 'Cable TV',    color: 'text-purple-400',  placeholder: 'e.g. DSTV-COMPACT' },
}

const DATA_PLANS: Record<string, { id: string; name: string; price: number }[]> = {
  '1': [ // MTN
    { id: '43', name: '110MB (1 Day)', price: 100 },
    { id: '74', name: '230MB (1 Day)', price: 250 },
    { id: '76', name: '500MB (2 Days)', price: 299 },
    { id: '78', name: '1GB (1 Day)', price: 350 },
    { id: '44', name: '500MB (30 Days)', price: 400 },
    { id: '77', name: '1GB (2 Days)', price: 450 },
    { id: '45', name: '1GB (7 Days)', price: 499 },
    { id: '46', name: '1GB (30 Days)', price: 600 },
    { id: '48', name: '2GB (30 Days)', price: 1250 },
    { id: '49', name: '3GB (30 Days)', price: 1500 },
    { id: '50', name: '5GB (30 Days)', price: 2300 },
  ],
  '2': [ // Glo
    { id: '42', name: '200MB (1 Day)', price: 100 },
    { id: '35', name: '500MB (30 Days)', price: 250 },
    { id: '68', name: '1GB (3 Days)', price: 330 },
    { id: '36', name: '1GB (30 Days)', price: 450 },
    { id: '40', name: '2GB (30 Days)', price: 900 },
    { id: '37', name: '3GB (30 Days)', price: 1400 },
    { id: '38', name: '5GB (30 Days)', price: 2250 },
  ],
  '3': [ // Airtel
    { id: '70', name: '1GB Social (3 Days)', price: 350 },
    { id: '13', name: '500MB (7 Days)', price: 500 },
    { id: '15', name: '1GB (7 Days)', price: 800 },
    { id: '17', name: '2GB (30 Days)', price: 1500 },
    { id: '18', name: '3GB (30 Days)', price: 2100 },
    { id: '20', name: '8GB (30 Days)', price: 3200 },
  ],
  '4': [ // 9mobile
    { id: 'default', name: 'Contact Admin for 9mobile', price: 0 },
  ]
}

export function PurchaseModal({ isOpen, onClose, serviceType, refreshProfile }: PurchaseModalProps) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ phone: '', planCode: '', amount: '' })
  const [selectedNetwork, setSelectedNetwork] = useState<string | null>(null)
  
  // Security Wizard Step Flow
  const [step, setStep] = useState<1 | 2 | 3>(1) // 1: Select Plan, 2: Enter PIN, 3: Configure/Create PIN
  const [hasPin, setHasPin] = useState(false)
  const [pinCode, setPinCode] = useState('')
  
  // Create PIN form fields
  const [setupPassword, setSetupPassword] = useState('')
  const [setupPin, setSetupPin] = useState('')

  const meta = SERVICE_META[serviceType] ?? SERVICE_META['DATA']
  const Icon = meta.icon

  useEffect(() => {
    if (isOpen) {
      // Check if user has a PIN configured
      api.get('/user/pin/configured')
        .then(res => {
          setHasPin(res.data.configured)
        })
        .catch(err => console.error('Failed checking PIN status', err))
    }
  }, [isOpen])

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleNetworkSelect = (id: string) => {
    setSelectedNetwork(id)
    setForm(prev => ({ 
      ...prev, 
      planCode: serviceType === 'AIRTIME' ? id : '', 
      amount: serviceType === 'AIRTIME' ? prev.amount : '' 
    }))
  }

  const handleFirstStepSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedNetwork && (serviceType === 'DATA' || serviceType === 'AIRTIME')) {
      return toast.error('Please select a network provider')
    }

    if (!hasPin) {
      setStep(3) // Head to setup PIN first
    } else {
      setStep(2) // Proceeed to PIN entry
    }
  }

  const handleCreatePin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/user/pin/set', {
        pin: setupPin
      })
      toast.success('Transaction PIN configured successfully!')
      setHasPin(true)
      setStep(2) // Move to confirmation
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Failed to setup PIN.')
    } finally {
      setLoading(false)
    }
  }

  const handlePurchaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pinCode.length !== 4) {
      return toast.error('Please enter a 4-digit PIN')
    }

    setLoading(true)
    window.dispatchEvent(new CustomEvent('purchase-start'))
    
    try {
      const response = await api.post(
        '/vtu/purchase',
        {
          serviceType,
          phone: form.phone,
          planCode: form.planCode || 'default',
          amount: Number(form.amount),
          pin: pinCode
        }
      )
      toast.success(`${meta.label} purchase successful!`)
      refreshProfile()
      onClose()
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('purchase-success', { detail: response.data.transaction }))
      }, 500)
    } catch (err: any) {
      // If incorrect PIN
      if (err.response?.data?.error === 'INCORRECT_PIN') {
        toast.error('Incorrect Transaction PIN. Access Denied.')
      } else {
        toast.error(err.response?.data?.error ?? 'Purchase failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-brand-midnight/80 backdrop-blur-md"
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 24 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed inset-0 z-[101] flex items-end sm:items-center justify-center p-4"
          >
            <div className="w-full max-w-md bg-[#0D1323] border border-brand-royal/20 rounded-3xl overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.6)]">
              {/* Coloured top accent */}
              <div className="h-1 w-full bg-gradient-to-r from-brand-royal via-brand-cyan to-brand-royal" />

              <div className="p-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-brand-royal/10 border border-brand-royal/20 flex items-center justify-center">
                      <Icon size={22} className={meta.color} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white uppercase tracking-widest font-display">
                        {meta.label}
                      </h3>
                      <p className="text-brand-silver/30 text-xs mt-0.5">Premium Secure Purchase</p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-brand-silver/40 hover:text-white hover:bg-white/10 transition-all"
                  >
                    <X size={18} />
                  </button>
                </div>

                {step === 1 && (
                  <form onSubmit={handleFirstStepSubmit} className="space-y-6">
                    {/* Network Selector */}
                    {(serviceType === 'DATA' || serviceType === 'AIRTIME') && (
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-brand-silver/40 px-1">
                          Select Network Provider
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                          {NETWORKS.map((net) => (
                            <button
                              key={net.id}
                              type="button"
                              onClick={() => handleNetworkSelect(net.id)}
                              className={`relative h-12 rounded-xl flex flex-col items-center justify-center transition-all border-2 overflow-hidden ${
                                selectedNetwork === net.id 
                                  ? 'border-brand-cyan bg-brand-cyan/5' 
                                  : 'border-brand-royal/10 bg-white/5 grayscale hover:grayscale-0'
                              }`}
                            >
                              <span className={`text-[10px] font-black ${selectedNetwork === net.id ? 'text-brand-cyan' : 'text-brand-silver/40'}`}>
                                {net.name}
                              </span>
                              {selectedNetwork === net.id && (
                                <div className="absolute top-1 right-1">
                                  <Check size={10} className="text-brand-cyan" />
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <Input
                      id="phone"
                      label="Recipient Phone Number"
                      type="tel"
                      placeholder="08012345678"
                      required
                      value={form.phone}
                      onChange={update('phone')}
                    />

                    {serviceType === 'DATA' ? (
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-brand-silver/40 px-1">
                          Select Data Plan
                        </label>
                        <select 
                          disabled={!selectedNetwork}
                          value={form.planCode}
                          onChange={(e) => {
                            const plan = DATA_PLANS[selectedNetwork!]?.find(p => p.id === e.target.value);
                            setForm(prev => ({ 
                              ...prev, 
                              planCode: e.target.value,
                              amount: plan ? String(plan.price) : prev.amount 
                            }));
                          }}
                          className="w-full bg-white/5 border border-brand-royal/10 rounded-xl py-4 px-4 text-sm text-white focus:outline-none focus:border-brand-cyan transition-all appearance-none cursor-pointer"
                        >
                          <option value="" className="bg-brand-midnight">Choose a plan...</option>
                          {selectedNetwork && DATA_PLANS[selectedNetwork]?.map(plan => (
                            <option key={plan.id} value={plan.id} className="bg-brand-midnight">
                              {plan.name} - ₦{plan.price}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : serviceType === 'AIRTIME' ? null : (
                      <Input
                        id="planCode"
                        label="Product / Meter Code"
                        placeholder={meta.placeholder}
                        value={form.planCode}
                        onChange={update('planCode')}
                      />
                    )}

                    <div className="relative">
                      <span className="absolute left-4 top-1/2 translate-y-3 text-brand-silver/40 text-sm font-bold">₦</span>
                      <Input
                        id="amount"
                        label="Amount (₦)"
                        type="number"
                        placeholder="0.00"
                        required
                        min={serviceType === 'AIRTIME' ? 50 : 100}
                        value={form.amount}
                        onChange={update('amount')}
                        className="pl-8"
                      />
                    </div>

                    {/* Amount presets for Airtime */}
                    {serviceType === 'AIRTIME' && (
                      <div className="flex gap-2 flex-wrap">
                        {['100', '200', '500', '1000'].map((amt) => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => setForm((p) => ({ ...p, amount: amt }))}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                              form.amount === amt
                                ? 'bg-brand-cyan text-brand-midnight border-brand-cyan'
                                : 'border-brand-royal/20 text-brand-silver/50 hover:border-brand-royal/50'
                            }`}
                          >
                            ₦{amt}
                          </button>
                        ))}
                      </div>
                    )}

                    <Button type="submit" disabled={loading} className="mt-4 h-14 gap-3 bg-brand-cyan hover:bg-brand-cyan/90 text-brand-midnight font-black shadow-[0_0_30px_rgba(0,212,255,0.2)]">
                      <span>Proceed to Verify</span>
                      <ArrowRight size={16} />
                    </Button>
                  </form>
                )}

                {step === 2 && (
                  <form onSubmit={handlePurchaseSubmit} className="space-y-6 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-brand-cyan/10 border border-brand-cyan/20 flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(0,212,255,0.1)]">
                      <Lock className="text-brand-cyan" size={28} />
                    </div>

                    <h4 className="text-lg font-black text-white uppercase tracking-widest font-display">Enter Transaction PIN</h4>
                    <p className="text-brand-silver/50 text-xs px-4">Type your secure 4-digit PIN to confirm purchase of ₦{Number(form.amount).toLocaleString()} for {form.phone}.</p>

                    <div className="max-w-[200px] mx-auto mt-6">
                      <input
                        type="password"
                        maxLength={4}
                        pattern="\d*"
                        inputMode="numeric"
                        placeholder="••••"
                        required
                        value={pinCode}
                        onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))}
                        className="w-full text-center bg-white/5 border border-brand-royal/10 rounded-2xl py-5 text-4xl font-black text-brand-cyan tracking-[0.5em] focus:outline-none focus:border-brand-cyan transition-all"
                      />
                    </div>

                    <div className="flex gap-3 mt-8">
                      <Button type="button" variant="outline" onClick={() => setStep(1)} className="border-brand-royal/20 text-brand-silver/50 hover:text-white">
                        Back
                      </Button>
                      <Button type="submit" disabled={loading || pinCode.length !== 4} className="bg-brand-cyan hover:bg-brand-cyan/90 text-brand-midnight font-black shadow-[0_0_30px_rgba(0,212,255,0.2)]">
                        {loading
                          ? <div className="w-5 h-5 border-2 border-brand-midnight/30 border-t-brand-midnight rounded-full animate-spin mx-auto" />
                          : 'Unlock & Pay'
                        }
                      </Button>
                    </div>
                  </form>
                )}

                {step === 3 && (
                  <form onSubmit={handleCreatePin} className="space-y-6">
                    <div className="w-16 h-16 rounded-2xl bg-brand-gold/10 border border-brand-gold/20 flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(251,191,36,0.1)]">
                      <KeyRound className="text-brand-gold" size={28} />
                    </div>

                    <div className="text-center mb-6">
                      <h4 className="text-lg font-black text-white uppercase tracking-widest font-display">Configure Transaction PIN</h4>
                      <p className="text-brand-silver/50 text-xs px-4 mt-1">To protect your wallet, create a secure 4-digit PIN used to authorize all VTU payments.</p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-brand-silver/40 px-1">
                        Choose 4-Digit PIN
                      </label>
                      <input
                        type="password"
                        maxLength={4}
                        pattern="\d*"
                        inputMode="numeric"
                        placeholder="••••"
                        required
                        value={setupPin}
                        onChange={(e) => setSetupPin(e.target.value.replace(/\D/g, ''))}
                        className="w-full text-center bg-white/5 border border-brand-royal/10 rounded-2xl py-4 text-3xl font-black text-brand-gold tracking-[0.5em] focus:outline-none focus:border-brand-gold transition-all"
                      />
                    </div>

                    <div className="flex gap-3 mt-8">
                      <Button type="button" variant="outline" onClick={() => setStep(1)} className="border-brand-royal/20 text-brand-silver/50 hover:text-white">
                        Cancel
                      </Button>
                      <Button type="submit" disabled={loading || setupPin.length !== 4} className="bg-brand-gold hover:bg-brand-gold/90 text-brand-midnight font-black shadow-[0_0_30px_rgba(251,191,36,0.2)]">
                        {loading
                          ? <div className="w-5 h-5 border-2 border-brand-midnight/30 border-t-brand-midnight rounded-full animate-spin mx-auto" />
                          : 'Configure PIN'
                        }
                      </Button>
                    </div>
                  </form>
                )}

                {/* Security badge */}
                <div className="flex items-center justify-center gap-2 mt-8 text-brand-silver/20">
                  <ShieldCheck size={13} />
                  <span className="text-[10px] uppercase tracking-widest font-black">Secured by AGD Core Engine</span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
