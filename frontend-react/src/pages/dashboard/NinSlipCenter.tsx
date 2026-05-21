import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { 
  ShieldCheck, Download, CreditCard, ArrowRight, Lock, Check, 
  Info, AlertCircle, Printer, User, Calendar, MapPin, Phone, RefreshCw 
} from 'lucide-react'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

interface NinData {
  nin: string
  firstName: string
  middleName?: string
  lastName: string
  fullName: string
  gender: string
  dateOfBirth: string
  phone: string
  trackingId: string
  address: string
  photo: string
  stateOfOrigin: string
  lga: string
  issueDate: string
  signature?: string
}

export function NinSlipCenter() {
  const [loading, setLoading] = useState(false)
  const [balance, setBalance] = useState<number>(0)
  const [role, setRole] = useState<string>('USER')
  
  // PIN verification state
  const [hasPin, setHasPin] = useState(false)
  const [step, setStep] = useState<1 | 2 | 3>(1) // 1: Form & Select type, 2: PIN verification, 3: Configure/Create PIN
  const [pinCode, setPinCode] = useState('')
  const [setupPin, setSetupPin] = useState('')
  
  // Main form fields
  const [ninInput, setNinInput] = useState('')
  const [slipType, setSlipType] = useState<'NIN_BASIC' | 'NIN_STANDARD' | 'NIN_PREMIUM'>('NIN_PREMIUM')
  const [consent, setConsent] = useState(false)
  
  // Verification result
  const [verifiedData, setVerifiedData] = useState<NinData | null>(null)
  
  // PDF download loading
  const [downloading, setDownloading] = useState(false)

  // Fetch balance and check PIN config on mount
  const fetchInitialData = async () => {
    try {
      const [userRes, pinRes] = await Promise.all([
        api.get('/auth/me'),
        api.get('/user/pin/configured')
      ])
      setBalance(userRes.data.wallet?.balance || 0)
      setRole(userRes.data.role || 'USER')
      setHasPin(pinRes.data.configured)
    } catch (err) {
      console.error('Failed to load initial verification data', err)
    }
  }

  useEffect(() => {
    fetchInitialData()
  }, [])

  // Calculate price based on user tier and slip type
  const getPrice = (type: 'NIN_BASIC' | 'NIN_STANDARD' | 'NIN_PREMIUM') => {
    const isReseller = role === 'RESELLER' || role === 'ADMIN'
    if (type === 'NIN_BASIC') return isReseller ? 80 : 100
    if (type === 'NIN_STANDARD') return isReseller ? 120 : 150
    return isReseller ? 200 : 250
  }

  const currentPrice = getPrice(slipType)

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (ninInput.length !== 11) {
      return toast.error('NIN must be exactly 11 digits')
    }
    if (!consent) {
      return toast.error('You must check the consent box to proceed')
    }
    if (balance < currentPrice) {
      return toast.error('Insufficient wallet balance to perform this print')
    }

    if (!hasPin) {
      setStep(3) // Head to setup PIN
    } else {
      setStep(2) // Move to enter PIN
    }
  }

  const handleCreatePin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (setupPin.length !== 4) return toast.error('PIN must be 4 digits')
    setLoading(true)
    try {
      await api.post('/user/pin/set', { pin: setupPin })
      toast.success('Transaction PIN configured successfully!')
      setHasPin(true)
      setStep(2) // Move to confirmation step
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Failed to setup PIN.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pinCode.length !== 4) return toast.error('Enter a 4-digit PIN')

    setLoading(true)
    try {
      const response = await api.post('/vtu/nin/verify', {
        nin: ninInput,
        slipType,
        pin: pinCode,
        consent: true
      })
      toast.success('NIN Verified successfully!')
      setVerifiedData(response.data.data)
      fetchInitialData() // refresh balance
    } catch (err: any) {
      if (err.response?.data?.error === 'INCORRECT_PIN') {
        toast.error('Incorrect Transaction PIN. Access Denied.')
      } else {
        toast.error(err.response?.data?.error ?? 'Verification failed.')
      }
    } finally {
      setLoading(false)
    }
  }

  // High-DPI PDF generation & download
  const handlePdfDownload = async () => {
    if (!verifiedData) return
    setDownloading(true)
    
    try {
      if (slipType === 'NIN_PREMIUM') {
        const frontEl = document.getElementById('premium-front')
        const backEl = document.getElementById('premium-back')
        if (!frontEl || !backEl) return

        const canvasFront = await html2canvas(frontEl, { scale: 3, useCORS: true, allowTaint: true })
        const canvasBack = await html2canvas(backEl, { scale: 3, useCORS: true, allowTaint: true })

        const pdf = new jsPDF('p', 'mm', 'a4')
        
        // Premium Header & Branding
        pdf.setFillColor(10, 15, 30) // Midnight background color
        pdf.rect(0, 0, 210, 45, 'F')
        
        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(22)
        pdf.setTextColor(255, 255, 255)
        pdf.text('AGD DATA PLUS', 15, 20)
        
        pdf.setFont('helvetica', 'normal')
        pdf.setFontSize(10)
        pdf.setTextColor(0, 212, 255) // Cyan
        pdf.text('PREMIUM VERIFIED IDENTITY CARD', 15, 27)
        
        pdf.setFontSize(8)
        pdf.setTextColor(140, 140, 140)
        pdf.text(`Printed: ${new Date().toLocaleString()} | Reference: ${verifiedData.trackingId}`, 15, 33)

        // Draw line separator
        pdf.setDrawColor(26, 79, 219)
        pdf.setLineWidth(1)
        pdf.line(0, 45, 210, 45)

        // ID card sizes in mm (85.6 width x 54 height)
        const imgW = 85.6
        const imgH = 54
        
        // Card Front placement
        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(12)
        pdf.setTextColor(10, 15, 30)
        pdf.text('CARD FRONT (WALLET SIZE)', 15, 60)
        pdf.addImage(canvasFront.toDataURL('image/png'), 'PNG', 15, 65, imgW, imgH)

        // Card Back placement
        pdf.text('CARD BACK (WALLET SIZE)', 15, 138)
        pdf.addImage(canvasBack.toDataURL('image/png'), 'PNG', 15, 143, imgW, imgH)

        // Guidelines box
        pdf.setFillColor(245, 247, 250)
        pdf.rect(15, 215, 180, 45, 'F')
        pdf.setDrawColor(220, 225, 230)
        pdf.rect(15, 215, 180, 45, 'D')

        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(10)
        pdf.setTextColor(10, 15, 30)
        pdf.text('Instructions for use:', 20, 223)
        pdf.setFont('helvetica', 'normal')
        pdf.setFontSize(8)
        pdf.setTextColor(80, 80, 80)
        pdf.text('1. Print this A4 sheet in color on standard paper or 250gsm card stock.', 20, 230)
        pdf.text('2. Carefully cut out the front and back cards along the green card borders.', 20, 235)
        pdf.text('3. Glue them back-to-back and insert into a standard plastic pouch, or laminate securely.', 20, 240)
        pdf.text('4. Scan the secure QR code on the back using any smartphone to verify credentials.', 20, 245)

        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(8)
        pdf.setTextColor(26, 79, 219)
        pdf.text('NIMC Official Verification Partner. Powered by AGD Data Plus Core Engine.', 15, 280)

        pdf.save(`NIN_Premium_Card_${verifiedData.nin}.pdf`)
        toast.success('Premium card downloaded successfully!')
      } else {
        // Standard (A4) or Basic (A4 Cutout)
        const idToCapture = slipType === 'NIN_STANDARD' ? 'standard-slip' : 'basic-slip'
        const element = document.getElementById(idToCapture)
        if (!element) return

        const canvas = await html2canvas(element, { scale: 3, useCORS: true, allowTaint: true })
        const pdf = new jsPDF('p', 'mm', 'a4')
        const pdfWidth = pdf.internal.pageSize.getWidth()
        const pdfHeight = pdf.internal.pageSize.getHeight()

        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pdfWidth, pdfHeight)
        pdf.save(`NIN_Verification_Slip_${verifiedData.nin}.pdf`)
        toast.success('NIN Slip downloaded successfully!')
      }
    } catch (err) {
      console.error(err)
      toast.error('Failed to render high-fidelity PDF document.')
    } finally {
      setDownloading(false)
    }
  }

  const handleReset = () => {
    setVerifiedData(null)
    setNinInput('')
    setPinCode('')
    setConsent(false)
    setStep(1)
  }

  // Format 11-digit NIN: "1234 5678 901"
  const formatNin = (num: string) => {
    if (!num) return ''
    return num.replace(/(\d{4})(\d{4})(\d{3})/, '$1 $2 $3')
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black font-display tracking-tight text-white">
            NIN <span className="text-brand-cyan">Verification Center</span>
          </h1>
          <p className="text-brand-silver/40 text-sm mt-1">
            Verify identities in real-time, print A4 standard, premium plastic PVC, or pocket slips.
          </p>
        </div>

        <div className="bg-brand-royal/10 border border-brand-royal/20 px-4 py-2 rounded-2xl flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-brand-royal/20 flex items-center justify-center">
            <CreditCard size={16} className="text-brand-cyan" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-brand-silver/40">Wallet Balance</p>
            <p className="text-lg font-black text-white">₦{balance.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Forms / Interactive controls */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="p-8 bg-gradient-to-br from-brand-royal/15 to-transparent border-brand-royal/20 relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-brand-cyan/5 rounded-full blur-3xl" />
            
            <AnimatePresence mode="wait">
              {verifiedData ? (
                // SUCCESS STATE VIEW DETAILS SCREEN
                <motion.div
                  key="verified-status"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  <div className="w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center shadow-[0_0_30px_rgba(34,197,94,0.15)]">
                    <ShieldCheck className="text-green-500" size={32} />
                  </div>
                  
                  <div>
                    <h3 className="text-2xl font-black text-white font-display uppercase tracking-widest">Verification Complete</h3>
                    <p className="text-brand-silver/50 text-xs mt-1">Identity successfully verified through NIMC Core database.</p>
                  </div>

                  <div className="divide-y divide-brand-royal/10 text-xs space-y-3 pt-3">
                    <div className="flex justify-between py-1">
                      <span className="text-brand-silver/40">Full Name</span>
                      <span className="text-white font-bold text-right">{verifiedData.fullName}</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-brand-silver/40">Verified NIN</span>
                      <span className="text-brand-cyan font-mono font-bold">{formatNin(verifiedData.nin)}</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-brand-silver/40">Tracking ID</span>
                      <span className="text-white font-mono">{verifiedData.trackingId}</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-brand-silver/40">State of Origin</span>
                      <span className="text-white font-medium">{verifiedData.stateOfOrigin}</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-brand-silver/40">LGA of Origin</span>
                      <span className="text-white font-medium">{verifiedData.lga}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 pt-4">
                    <Button 
                      onClick={handlePdfDownload} 
                      disabled={downloading}
                      className="h-14 gap-3 bg-brand-cyan hover:bg-brand-cyan/90 text-brand-midnight font-black shadow-[0_0_30px_rgba(0,212,255,0.2)]"
                    >
                      {downloading ? (
                        <>
                          <RefreshCw size={16} className="animate-spin" />
                          <span>Generating PDF...</span>
                        </>
                      ) : (
                        <>
                          <Download size={16} />
                          <span>Download High-DPI PDF</span>
                        </>
                      )}
                    </Button>
                    
                    <button 
                      onClick={handleReset} 
                      className="py-3.5 border border-brand-royal/20 hover:border-brand-royal/60 text-brand-silver/50 hover:text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all"
                    >
                      Verify Another Identity
                    </button>
                  </div>
                </motion.div>
              ) : (
                // INPUT STEPS
                <div className="relative">
                  {step === 1 && (
                    <motion.form 
                      onSubmit={handleFormSubmit}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-6"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-brand-cyan/10 border border-brand-cyan/20 flex items-center justify-center">
                          <ShieldCheck size={20} className="text-brand-cyan" />
                        </div>
                        <div>
                          <h3 className="text-lg font-black text-white font-display uppercase tracking-widest">NIMC Gateway</h3>
                          <p className="text-brand-silver/30 text-[10px]">Secure Identity Verification API</p>
                        </div>
                      </div>

                      {/* Slip Type Select */}
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-brand-silver/40 px-1">
                          Select Output Format
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {(['NIN_BASIC', 'NIN_STANDARD', 'NIN_PREMIUM'] as const).map((type) => {
                            const name = type === 'NIN_BASIC' ? 'Basic Pocket' : type === 'NIN_STANDARD' ? 'Standard A4' : 'Premium Card'
                            const desc = type === 'NIN_BASIC' ? 'Cutout lamin' : type === 'NIN_STANDARD' ? 'Full A4 print' : 'Wallet card'
                            return (
                              <button
                                key={type}
                                type="button"
                                onClick={() => setSlipType(type)}
                                className={`relative p-3 rounded-xl flex flex-col items-center justify-center transition-all border text-center ${
                                  slipType === type 
                                    ? 'border-brand-cyan bg-brand-cyan/5 shadow-[0_0_15px_rgba(0,212,255,0.05)]' 
                                    : 'border-brand-royal/10 bg-white/5 hover:border-brand-royal/40'
                                }`}
                              >
                                <span className={`text-xs font-black uppercase tracking-wider ${slipType === type ? 'text-brand-cyan' : 'text-white'}`}>
                                  {name}
                                </span>
                                <span className="text-[9px] text-brand-silver/30 mt-1">{desc}</span>
                                <span className="text-[10px] font-mono font-black text-brand-gold mt-1.5">
                                  ₦{getPrice(type)}
                                </span>
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      {/* NIN Input */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-brand-silver/40 px-1">
                          NIN (National Identification Number)
                        </label>
                        <input
                          type="text"
                          maxLength={11}
                          placeholder="Enter 11-digit NIN / vNIN"
                          required
                          value={ninInput}
                          onChange={(e) => setNinInput(e.target.value.replace(/\D/g, ''))}
                          className="w-full bg-white/5 border border-brand-royal/10 rounded-xl py-4 px-4 text-sm text-white focus:outline-none focus:border-brand-cyan transition-all"
                        />
                      </div>

                      {/* Consent Checkbox */}
                      <div className="flex items-start gap-3 bg-brand-royal/5 border border-brand-royal/10 rounded-xl p-4">
                        <input
                          type="checkbox"
                          id="consent"
                          checked={consent}
                          onChange={(e) => setConsent(e.target.checked)}
                          className="mt-0.5 w-4 h-4 rounded text-brand-cyan focus:ring-brand-cyan bg-brand-midnight border-brand-royal/20"
                        />
                        <label htmlFor="consent" className="text-[10px] leading-relaxed text-brand-silver/50 cursor-pointer select-none">
                          I explicitly authorize AGD Data Plus to query official identity registries (NIMC) and retrieve my details. I verify that this data will be handled securely.
                        </label>
                      </div>

                      <Button type="submit" className="h-14 gap-3 bg-brand-cyan hover:bg-brand-cyan/90 text-brand-midnight font-black shadow-[0_0_30px_rgba(0,212,255,0.2)]">
                        <span>Proceed to Verify</span>
                        <ArrowRight size={16} />
                      </Button>
                    </motion.form>
                  )}

                  {step === 2 && (
                    <motion.form 
                      onSubmit={handleVerifySubmit}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-6 text-center"
                    >
                      <div className="w-16 h-16 rounded-2xl bg-brand-cyan/10 border border-brand-cyan/20 flex items-center justify-center mx-auto mb-2 shadow-[0_0_20px_rgba(0,212,255,0.1)]">
                        <Lock className="text-brand-cyan" size={28} />
                      </div>

                      <h4 className="text-lg font-black text-white uppercase tracking-widest font-display">Enter Transaction PIN</h4>
                      <p className="text-brand-silver/50 text-xs px-4">
                        Type your secure 4-digit PIN to confirm the verification charge of ₦{currentPrice}.
                      </p>

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
                        <Button type="submit" loading={loading} className="bg-brand-cyan hover:bg-brand-cyan/90 text-brand-midnight">
                          Verify & Debit
                        </Button>
                      </div>
                    </motion.form>
                  )}

                  {step === 3 && (
                    <motion.form 
                      onSubmit={handleCreatePin}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-6 text-center"
                    >
                      <div className="w-16 h-16 rounded-2xl bg-brand-gold/10 border border-brand-gold/20 flex items-center justify-center mx-auto mb-2">
                        <AlertCircle className="text-brand-gold" size={28} />
                      </div>

                      <h4 className="text-lg font-black text-white uppercase tracking-widest font-display">Configure Security PIN</h4>
                      <p className="text-brand-silver/50 text-xs px-4">
                        You have not configured a transaction PIN yet. Please set a secure 4-digit PIN to secure future purchases.
                      </p>

                      <div className="max-w-[200px] mx-auto mt-6">
                        <input
                          type="password"
                          maxLength={4}
                          pattern="\d*"
                          inputMode="numeric"
                          placeholder="Set PIN"
                          required
                          value={setupPin}
                          onChange={(e) => setSetupPin(e.target.value.replace(/\D/g, ''))}
                          className="w-full text-center bg-white/5 border border-brand-royal/10 rounded-2xl py-5 text-2xl font-black text-brand-cyan tracking-[0.5em] focus:outline-none focus:border-brand-cyan transition-all"
                        />
                      </div>

                      <div className="flex gap-3 mt-8">
                        <Button type="button" variant="outline" onClick={() => setStep(1)} className="border-brand-royal/20 text-brand-silver/50 hover:text-white">
                          Back
                        </Button>
                        <Button type="submit" loading={loading} className="bg-brand-cyan hover:bg-brand-cyan/90 text-brand-midnight">
                          Setup PIN
                        </Button>
                      </div>
                    </motion.form>
                  )}
                </div>
              )}
            </AnimatePresence>
          </Card>

          <Card className="p-6 border-brand-royal/10 bg-white/[0.01]">
            <div className="flex items-center gap-3 text-brand-silver/30 mb-4">
              <Info size={16} />
              <p className="text-[10px] uppercase tracking-widest font-black">NIM-Slip Guidelines</p>
            </div>
            <ul className="space-y-3 text-xs text-brand-silver/50 leading-relaxed">
              <li className="flex gap-2">
                <span className="text-brand-cyan font-bold">•</span>
                <span><strong>Premium PVC Card</strong>: Generates standard wallet front/back dimensions suitable for plastic PVC cards.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-brand-cyan font-bold">•</span>
                <span><strong>Standard NINS Document</strong>: Full A4 layout containing all verified registry fields, Coat of Arms watermark, and tracking barcode.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-brand-cyan font-bold">•</span>
                <span><strong>Pocket Cutout Card</strong>: Designed as a compact cutout size to carry inside your wallet or billfold.</span>
              </li>
            </ul>
          </Card>
        </div>

        {/* Right Side: LIVE PREVIEWS (rendered dynamically to be captured by html2canvas) */}
        <div className="lg:col-span-7 flex flex-col justify-start space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black font-display uppercase tracking-widest text-white">Live Document Preview</h2>
            <span className="text-brand-silver/40 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
              <Printer size={12} className="text-brand-cyan" />
              High DPI 300 Engine
            </span>
          </div>

          <div className="w-full bg-[#0D1323] border border-brand-royal/10 rounded-3xl p-6 min-h-[500px] flex items-center justify-center overflow-x-auto relative">
            <div className="absolute top-4 right-4 bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full text-brand-silver/30 select-none">
              Client Rendering Sandbox
            </div>

            {verifiedData ? (
              <div className="w-full flex flex-col items-center gap-8 py-4">
                
                {/* 1. PREMIUM DOUBLE-SIDED CARD */}
                {slipType === 'NIN_PREMIUM' && (
                  <div className="flex flex-col gap-6 w-[342px]">
                    
                    {/* CARD FRONT (Exact 85.6mm x 54mm equivalent ratio) */}
                    <div 
                      id="premium-front" 
                      className="w-[342px] h-[216px] rounded-2xl bg-white text-slate-800 flex flex-col justify-between overflow-hidden shadow-2xl relative border border-slate-300"
                      style={{ 
                        fontFamily: 'Inter, sans-serif',
                        backgroundImage: `radial-gradient(circle at 50% 50%, rgba(34,197,94,0.04) 0%, rgba(255,255,255,1) 70%)` 
                      }}
                    >
                      {/* Nigeria Green Top Header */}
                      <div className="bg-[#008751] text-white px-3 py-1.5 flex items-center justify-between relative">
                        <div className="flex items-center gap-1.5">
                          {/* Nigeria Flag Emblem */}
                          <div className="w-4 h-3 flex shrink-0">
                            <div className="w-1/3 bg-[#008751] h-full" />
                            <div className="w-1/3 bg-white h-full" />
                            <div className="w-1/3 bg-[#008751] h-full" />
                          </div>
                          <div>
                            <h4 className="text-[7.5px] font-black tracking-wider uppercase leading-none text-white">Federal Republic of Nigeria</h4>
                            <p className="text-[5.5px] font-medium tracking-normal text-green-100 leading-none mt-0.5">National Identity Management Commission</p>
                          </div>
                        </div>
                        {/* Coat of arms simple graphic */}
                        <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[7px] font-black border border-white/20 select-none">
                          🇳🇬
                        </div>
                      </div>

                      {/* Card Content body */}
                      <div className="flex-1 p-3 flex gap-3 relative">
                        
                        {/* Faded background watermark seal */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-[0.06] select-none pointer-events-none">
                          <span className="text-[120px]">🇳🇬</span>
                        </div>

                        {/* Profile Photo (Left column) */}
                        <div className="w-20 flex flex-col items-center gap-1.5 z-10 shrink-0">
                          <div className="w-20 h-24 rounded-lg overflow-hidden border border-[#008751] bg-slate-100 flex items-center justify-center">
                            <img 
                              src={verifiedData.photo} 
                              alt="Profile" 
                              className="w-full h-full object-cover" 
                              crossOrigin="anonymous"
                            />
                          </div>
                          <div className="text-[5.5px] font-black uppercase text-slate-400 font-mono leading-none tracking-tight">
                            ID: {verifiedData.trackingId}
                          </div>
                        </div>

                        {/* Details (Right column) */}
                        <div className="flex-1 flex flex-col justify-between z-10 text-[7px] text-slate-700">
                          <div className="space-y-1">
                            <div>
                              <span className="text-[5.5px] uppercase text-slate-400 font-bold block leading-none">Surname</span>
                              <span className="text-[8px] font-black text-slate-900 leading-none uppercase">{verifiedData.lastName}</span>
                            </div>
                            <div>
                              <span className="text-[5.5px] uppercase text-slate-400 font-bold block leading-none">Given Names</span>
                              <span className="text-[8px] font-black text-slate-900 leading-none uppercase">{verifiedData.firstName} {verifiedData.middleName}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-1 pt-0.5">
                              <div>
                                <span className="text-[5.5px] uppercase text-slate-400 font-bold block leading-none">Date of Birth</span>
                                <span className="font-bold text-slate-800 leading-none">{verifiedData.dateOfBirth}</span>
                              </div>
                              <div>
                                <span className="text-[5.5px] uppercase text-slate-400 font-bold block leading-none">Gender</span>
                                <span className="font-bold text-slate-800 leading-none">{verifiedData.gender}</span>
                              </div>
                            </div>
                          </div>

                          {/* Bold NIN Display Container */}
                          <div className="bg-[#008751]/5 border border-[#008751]/20 rounded px-2 py-1 text-center mt-1">
                            <span className="text-[5px] uppercase text-[#008751] tracking-widest font-black block leading-none">National Identification Number (NIN)</span>
                            <span className="text-xs font-black text-[#008751] font-mono leading-none mt-0.5 block">{formatNin(verifiedData.nin)}</span>
                          </div>
                        </div>

                      </div>

                      {/* Golden security bottom stripe */}
                      <div className="h-1 bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500 w-full" />
                    </div>

                    {/* CARD BACK (Exact 85.6mm x 54mm equivalent ratio) */}
                    <div 
                      id="premium-back" 
                      className="w-[342px] h-[216px] rounded-2xl bg-white text-slate-800 flex flex-col justify-between overflow-hidden shadow-2xl relative border border-slate-300"
                      style={{ 
                        fontFamily: 'Inter, sans-serif',
                        backgroundImage: `radial-gradient(circle at 10% 90%, rgba(0,135,81,0.03) 0%, rgba(255,255,255,1) 80%)` 
                      }}
                    >
                      <div className="h-1.5 bg-[#008751] w-full" />
                      
                      <div className="flex-1 p-3 flex gap-3 relative">
                        
                        {/* Legal Wording (Left Side) */}
                        <div className="flex-1 flex flex-col justify-between text-slate-500 pr-1">
                          <div className="space-y-1.5">
                            <h5 className="text-[6.5px] font-black text-[#008751] uppercase tracking-wider leading-none">National Identity Card</h5>
                            <p className="text-[5px] leading-tight font-medium text-slate-400">
                              This card is the property of the Federal Government of Nigeria. It must be produced upon request by any authorized authority. If found, please return to the nearest NIMC Office or police station.
                            </p>
                          </div>

                          <div className="space-y-1 pt-1.5 border-t border-slate-100">
                            <div className="flex justify-between text-[5.5px]">
                              <span className="font-bold">Date of Issue:</span>
                              <span className="text-slate-700 font-mono font-medium">{verifiedData.issueDate}</span>
                            </div>
                            <div className="flex justify-between text-[5.5px]">
                              <span className="font-bold">Authority:</span>
                              <span className="text-[#008751] font-black">NIMC DIRECTOR GENERAL</span>
                            </div>
                          </div>
                        </div>

                        {/* Signature, QR code, and Barcode (Right Side) */}
                        <div className="w-[100px] flex flex-col items-center justify-between shrink-0 pl-2 border-l border-slate-100">
                          
                          {/* Mini QR code mock */}
                          <div className="w-14 h-14 bg-white border border-slate-200 p-1 flex items-center justify-center relative shadow-sm">
                            {/* Realistic SVG pattern representing QR */}
                            <svg viewBox="0 0 100 100" className="w-full h-full text-slate-800">
                              <rect x="0" y="0" width="25" height="25" fill="currentColor"/>
                              <rect x="5" y="5" width="15" height="15" fill="white"/>
                              <rect x="9" y="9" width="7" height="7" fill="currentColor"/>
                              
                              <rect x="75" y="0" width="25" height="25" fill="currentColor"/>
                              <rect x="80" y="5" width="15" height="15" fill="white"/>
                              <rect x="84" y="9" width="7" height="7" fill="currentColor"/>

                              <rect x="0" y="75" width="25" height="25" fill="currentColor"/>
                              <rect x="5" y="80" width="15" height="15" fill="white"/>
                              <rect x="84" y="84" width="7" height="7" fill="currentColor"/>

                              {/* Random blocks representing data */}
                              <rect x="35" y="10" width="10" height="5" fill="currentColor"/>
                              <rect x="50" y="5" width="5" height="15" fill="currentColor"/>
                              <rect x="60" y="15" width="10" height="10" fill="currentColor"/>
                              <rect x="30" y="30" width="15" height="15" fill="currentColor"/>
                              <rect x="50" y="35" width="15" height="5" fill="currentColor"/>
                              <rect x="70" y="30" width="5" height="15" fill="currentColor"/>
                              <rect x="10" y="50" width="20" height="10" fill="currentColor"/>
                              <rect x="35" y="55" width="10" height="15" fill="currentColor"/>
                              <rect x="55" y="50" width="15" height="20" fill="currentColor"/>
                              <rect x="80" y="55" width="10" height="10" fill="currentColor"/>
                              <rect x="30" y="75" width="15" height="10" fill="currentColor"/>
                              <rect x="50" y="80" width="20" height="10" fill="currentColor"/>
                            </svg>
                          </div>

                          {/* Signature mock */}
                          <div className="w-16 h-5 border-b border-dashed border-slate-300 relative flex items-center justify-center">
                            <span className="text-[5.5px] absolute -top-1.5 text-slate-300 select-none">Signature</span>
                            <span className="font-serif italic text-[9px] text-[#1A4FDB] leading-none select-none tracking-wider">A. Dangote</span>
                          </div>

                          {/* Barcode mock */}
                          <div className="w-20 h-5 flex flex-col justify-end items-center">
                            <svg className="w-full h-3 text-slate-800" viewBox="0 0 100 10">
                              <rect x="0" y="0" width="2" height="10" fill="currentColor"/>
                              <rect x="3" y="0" width="1" height="10" fill="currentColor"/>
                              <rect x="5" y="0" width="4" height="10" fill="currentColor"/>
                              <rect x="10" y="0" width="1" height="10" fill="currentColor"/>
                              <rect x="12" y="0" width="2" height="10" fill="currentColor"/>
                              <rect x="16" y="0" width="3" height="10" fill="currentColor"/>
                              <rect x="21" y="0" width="1" height="10" fill="currentColor"/>
                              <rect x="23" y="0" width="4" height="10" fill="currentColor"/>
                              <rect x="29" y="0" width="2" height="10" fill="currentColor"/>
                              <rect x="32" y="0" width="1" height="10" fill="currentColor"/>
                              <rect x="35" y="0" width="3" height="10" fill="currentColor"/>
                              <rect x="39" y="0" width="1" height="10" fill="currentColor"/>
                              <rect x="42" y="0" width="4" height="10" fill="currentColor"/>
                              <rect x="48" y="0" width="2" height="10" fill="currentColor"/>
                              <rect x="51" y="0" width="1" height="10" fill="currentColor"/>
                              <rect x="53" y="0" width="3" height="10" fill="currentColor"/>
                              <rect x="57" y="0" width="1" height="10" fill="currentColor"/>
                              <rect x="60" y="0" width="2" height="10" fill="currentColor"/>
                              <rect x="64" y="0" width="4" height="10" fill="currentColor"/>
                              <rect x="70" y="0" width="1" height="10" fill="currentColor"/>
                              <rect x="73" y="0" width="3" height="10" fill="currentColor"/>
                              <rect x="78" y="0" width="2" height="10" fill="currentColor"/>
                              <rect x="81" y="0" width="1" height="10" fill="currentColor"/>
                              <rect x="83" y="0" width="4" height="10" fill="currentColor"/>
                              <rect x="89" y="0" width="2" height="10" fill="currentColor"/>
                              <rect x="92" y="0" width="1" height="10" fill="currentColor"/>
                              <rect x="95" y="0" width="5" height="10" fill="currentColor"/>
                            </svg>
                            <span className="text-[4px] font-mono text-slate-400 mt-0.5">*{verifiedData.trackingId}*</span>
                          </div>
                        </div>

                      </div>

                      {/* Golden security bottom stripe */}
                      <div className="h-1 bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500 w-full" />
                    </div>

                  </div>
                )}

                {/* 2. STANDARD FULL A4 SLIP DOCUMENT */}
                {slipType === 'NIN_STANDARD' && (
                  <div 
                    id="standard-slip"
                    className="w-[595px] h-[842px] bg-white text-slate-800 p-12 flex flex-col justify-between shadow-2xl relative border border-slate-200 shrink-0"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    {/* Background watermark seal */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] select-none pointer-events-none">
                      <span className="text-[350px]">🇳🇬</span>
                    </div>

                    <div className="space-y-6 relative z-10">
                      
                      {/* Top Header Section */}
                      <div className="flex items-center justify-between border-b-2 border-[#008751] pb-4">
                        <div className="flex items-center gap-3">
                          <span className="text-4xl">🇳🇬</span>
                          <div>
                            <h3 className="text-base font-black uppercase text-[#008751] tracking-wider leading-none">Federal Republic of Nigeria</h3>
                            <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">National Identity Management Commission</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="px-3 py-1 bg-[#008751]/10 text-[#008751] text-[9px] font-black rounded-full uppercase tracking-wider">
                            OFFICIAL SLIP
                          </span>
                        </div>
                      </div>

                      {/* Title banner */}
                      <div className="bg-[#008751] text-white p-3 rounded-lg text-center shadow-sm">
                        <h4 className="text-sm font-black uppercase tracking-widest leading-none">National Identification Number Slip (NINS)</h4>
                      </div>

                      {/* Info Note */}
                      <p className="text-[10px] text-slate-500 leading-relaxed italic border-l-2 border-amber-500 pl-3">
                        Note: This slip is an official document of the Federal Republic of Nigeria. Keep it secure. The 11-digit NIN displayed below is your permanent identifier.
                      </p>

                      {/* Grid structure details */}
                      <div className="grid grid-cols-12 gap-6 pt-4">
                        
                        {/* Profile photo block */}
                        <div className="col-span-3 flex flex-col items-center gap-2">
                          <div className="w-28 h-36 border border-slate-300 rounded overflow-hidden p-1 bg-slate-50">
                            <img 
                              src={verifiedData.photo} 
                              alt="Profile Photo" 
                              className="w-full h-full object-cover rounded-sm"
                              crossOrigin="anonymous"
                            />
                          </div>
                          <span className="text-[9px] font-black text-slate-400 font-mono">ID: {verifiedData.trackingId}</span>
                        </div>

                        {/* Profile Details Block */}
                        <div className="col-span-9 space-y-4">
                          <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-xs border-b border-slate-100 pb-4">
                            <div>
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Surname</span>
                              <span className="font-extrabold text-slate-900 uppercase text-sm mt-0.5 block">{verifiedData.lastName}</span>
                            </div>
                            <div>
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Given Names</span>
                              <span className="font-extrabold text-slate-900 uppercase text-sm mt-0.5 block">{verifiedData.firstName} {verifiedData.middleName}</span>
                            </div>
                            <div>
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Date of Birth</span>
                              <span className="font-bold text-slate-800 mt-0.5 block">{verifiedData.dateOfBirth}</span>
                            </div>
                            <div>
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Gender</span>
                              <span className="font-bold text-slate-800 mt-0.5 block">{verifiedData.gender}</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-xs pt-1">
                            <div>
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">State of Origin</span>
                              <span className="font-semibold text-slate-700 mt-0.5 block">{verifiedData.stateOfOrigin}</span>
                            </div>
                            <div>
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">LGA of Origin</span>
                              <span className="font-semibold text-slate-700 mt-0.5 block">{verifiedData.lga}</span>
                            </div>
                            <div className="col-span-2">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Residential Address</span>
                              <span className="font-semibold text-slate-600 mt-0.5 block leading-relaxed">{verifiedData.address}</span>
                            </div>
                          </div>
                        </div>

                      </div>

                      {/* Official Card Callout Container */}
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mt-6 flex flex-col items-center justify-center text-center shadow-inner relative">
                        <div className="absolute top-2 left-4 text-[8px] font-black text-[#008751] tracking-widest uppercase">Permanent Identification Identifier</div>
                        
                        <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest leading-none mt-2">National Identification Number (NIN)</div>
                        <div className="text-3xl font-black text-[#008751] font-mono tracking-wider mt-3 bg-white border border-slate-200 rounded-xl px-8 py-3.5 shadow-sm">
                          {formatNin(verifiedData.nin)}
                        </div>
                      </div>

                    </div>

                    {/* Bottom Footer block */}
                    <div className="border-t border-slate-200 pt-6 flex items-end justify-between relative z-10">
                      <div className="space-y-1.5 text-[9px] text-slate-400">
                        <p className="font-bold text-slate-500">NIMC SECURITY STAMP</p>
                        <p>Date of Issue: {verifiedData.issueDate}</p>
                        <p>© NIMC Federal Government of Nigeria 2026</p>
                      </div>

                      {/* Signature Mock */}
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-24 h-6 relative flex items-center justify-center">
                          <span className="font-serif italic text-xs text-[#1A4FDB] leading-none select-none">A. Dangote</span>
                        </div>
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest border-t border-slate-200 pt-1 px-4">Authorized Signature</span>
                      </div>

                      {/* Large Barcode Footer */}
                      <div className="flex flex-col items-center gap-1 shrink-0">
                        <svg className="w-28 h-5 text-slate-800" viewBox="0 0 100 10">
                          <rect x="0" y="0" width="2" height="10" fill="currentColor"/>
                          <rect x="3" y="0" width="1" height="10" fill="currentColor"/>
                          <rect x="5" y="0" width="4" height="10" fill="currentColor"/>
                          <rect x="10" y="0" width="1" height="10" fill="currentColor"/>
                          <rect x="12" y="0" width="2" height="10" fill="currentColor"/>
                          <rect x="16" y="0" width="3" height="10" fill="currentColor"/>
                          <rect x="21" y="0" width="1" height="10" fill="currentColor"/>
                          <rect x="23" y="0" width="4" height="10" fill="currentColor"/>
                          <rect x="29" y="0" width="2" height="10" fill="currentColor"/>
                          <rect x="32" y="0" width="1" height="10" fill="currentColor"/>
                          <rect x="35" y="0" width="3" height="10" fill="currentColor"/>
                          <rect x="39" y="0" width="1" height="10" fill="currentColor"/>
                          <rect x="42" y="0" width="4" height="10" fill="currentColor"/>
                          <rect x="48" y="0" width="2" height="10" fill="currentColor"/>
                          <rect x="51" y="0" width="1" height="10" fill="currentColor"/>
                          <rect x="53" y="0" width="3" height="10" fill="currentColor"/>
                          <rect x="57" y="0" width="1" height="10" fill="currentColor"/>
                          <rect x="60" y="0" width="2" height="10" fill="currentColor"/>
                          <rect x="64" y="0" width="4" height="10" fill="currentColor"/>
                          <rect x="70" y="0" width="1" height="10" fill="currentColor"/>
                          <rect x="73" y="0" width="3" height="10" fill="currentColor"/>
                          <rect x="78" y="0" width="2" height="10" fill="currentColor"/>
                          <rect x="81" y="0" width="1" height="10" fill="currentColor"/>
                          <rect x="83" y="0" width="4" height="10" fill="currentColor"/>
                          <rect x="89" y="0" width="2" height="10" fill="currentColor"/>
                          <rect x="92" y="0" width="1" height="10" fill="currentColor"/>
                          <rect x="95" y="0" width="5" height="10" fill="currentColor"/>
                        </svg>
                        <span className="text-[7px] font-mono text-slate-400">*{verifiedData.trackingId}*</span>
                      </div>
                    </div>

                  </div>
                )}

                {/* 3. BASIC POCKET SIZE CUTOUT */}
                {slipType === 'NIN_BASIC' && (
                  <div 
                    id="basic-slip"
                    className="w-[280px] h-[160px] rounded-xl bg-white text-slate-800 p-3 flex flex-col justify-between shadow-xl border-2 border-double border-[#008751] relative shrink-0"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    <div className="flex justify-between items-center pb-1 border-b border-slate-200">
                      <div className="flex items-center gap-1">
                        <span className="text-xs leading-none">🇳🇬</span>
                        <span className="text-[6.5px] font-black uppercase text-[#008751] leading-none">NIMC POCKET ID</span>
                      </div>
                      <span className="text-[5px] font-mono text-slate-400">Ref: {verifiedData.trackingId}</span>
                    </div>

                    <div className="flex-1 py-1.5 flex gap-2">
                      <div className="w-14 h-16 rounded border border-slate-300 overflow-hidden bg-slate-50 shrink-0">
                        <img 
                          src={verifiedData.photo} 
                          alt="Profile" 
                          className="w-full h-full object-cover" 
                          crossOrigin="anonymous"
                        />
                      </div>
                      <div className="flex-1 flex flex-col justify-between text-[6.5px] text-slate-600">
                        <div className="space-y-0.5">
                          <p><strong className="text-slate-400 font-bold uppercase text-[5px]">Surname:</strong> <span className="font-extrabold text-slate-800 uppercase">{verifiedData.lastName}</span></p>
                          <p><strong className="text-slate-400 font-bold uppercase text-[5px]">Given Name:</strong> <span className="font-extrabold text-slate-800 uppercase">{verifiedData.firstName}</span></p>
                          <p><strong className="text-slate-400 font-bold uppercase text-[5px]">DOB:</strong> <span className="font-bold text-slate-700">{verifiedData.dateOfBirth}</span> | <strong className="text-slate-400 font-bold uppercase text-[5px]">Gen:</strong> <span className="font-bold text-slate-700">{verifiedData.gender}</span></p>
                        </div>
                        <div className="bg-[#008751]/5 border border-[#008751]/20 rounded py-0.5 px-1.5 text-center mt-1">
                          <span className="text-[4px] uppercase text-[#008751] font-black block leading-none">National Identity Number</span>
                          <span className="text-[10px] font-black text-[#008751] font-mono leading-none tracking-tight block mt-0.5">{formatNin(verifiedData.nin)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-1 border-t border-slate-100 text-[5px] text-slate-400">
                      <span>Printed via AGD Data Plus Gateway</span>
                      <span className="font-bold text-[#008751] uppercase">BASIC IDENTIFIER</span>
                    </div>
                  </div>
                )}

              </div>
            ) : (
              // IDLE MOCK PREVIEW PLACEHOLDER
              <div className="text-center max-w-[280px] space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-brand-royal/10 border border-brand-royal/20 flex items-center justify-center mx-auto text-brand-silver/30 animate-pulse">
                  <ShieldCheck size={28} />
                </div>
                <div>
                  <h4 className="text-sm font-black uppercase text-white tracking-widest">Awaiting Verification</h4>
                  <p className="text-xs text-brand-silver/40 mt-1 leading-relaxed">
                    Verify an 11-digit NIN using the secure sidebar form to render high-fidelity document previews.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
