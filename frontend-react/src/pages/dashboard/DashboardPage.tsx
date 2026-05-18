import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { PurchaseModal } from '@/components/dashboard/PurchaseModal'
import { FundingModal } from '@/components/dashboard/FundingModal'
import { ReceiptModal } from '@/components/dashboard/ReceiptModal'
import { TransactionProcessing } from '@/components/dashboard/TransactionProcessing'
import { NotificationBell } from '@/components/dashboard/NotificationBell'
import {
  Wallet, Copy, Banknote, ShieldCheck, Check, ShieldAlert, Mail,
  Wifi, Smartphone, Zap, Monitor, LogOut, User, Bell, Clock, ArrowDownLeft, Settings
} from 'lucide-react'

const PRIMARY_SERVICES = [
  { id: 'DATA',        name: 'Buy Data',    icon: Wifi,        border: 'border-blue-500/30',   glow: 'group-hover:bg-brand-royal/30'  },
  { id: 'AIRTIME',     name: 'Airtime',     icon: Smartphone,  border: 'border-green-500/30',  glow: 'group-hover:bg-green-500/20'    },
  { id: 'ELECTRICITY', name: 'Electricity', icon: Zap,         border: 'border-brand-gold/30', glow: 'group-hover:bg-brand-gold/20'   },
  { id: 'CABLE',       name: 'Cable TV',    icon: Monitor,     border: 'border-purple-500/30', glow: 'group-hover:bg-purple-500/20'   },
]

const SECONDARY_SERVICES = [
  { id: 'SMS',         name: 'Bulk SMS',    icon: Mail,        border: 'border-brand-cyan/30', glow: 'group-hover:bg-brand-cyan/20'   },
  { id: 'EXAM',        name: 'Exam PINs',   icon: ShieldCheck, border: 'border-red-500/30',    glow: 'group-hover:bg-red-500/20'      },
  { id: 'SPECTRANET',  name: 'Spectranet',  icon: Wifi,        border: 'border-orange-500/30', glow: 'group-hover:bg-orange-500/20'  },
  { id: 'SMILE',       name: 'Smile 4G',    icon: Wifi,        border: 'border-yellow-500/30', glow: 'group-hover:bg-yellow-500/20'  },
]

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.4 },
  }),
}

const PROMOS = [
  {
    title: 'Refer & Earn Unlimited Cash',
    desc: 'Get ₦100 instantly credited to your wallet when your invitee completes their first transaction!',
    btnText: 'Invite Friends Now',
    route: '/referrals',
  },
  {
    title: 'Secure Your Wallet Balance',
    desc: 'Enable a secure 4-digit transaction PIN inside your settings to prevent unauthorized purchases.',
    btnText: 'Setup Security PIN',
    route: '/dashboard/settings',
  },
  {
    title: 'Claim Elite Wholesale Ranks',
    desc: 'Accumulate purchases to unlock Silver, Gold, and Platinum agent tiers for premium discounts.',
    btnText: 'Check Loyalty Level',
    route: '/dashboard/profile',
  }
]

export function DashboardPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState<any>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modalService, setModalService] = useState<string | null>(null)
  const [isFundingOpen, setIsFundingOpen] = useState(false)
  const [accountCopied, setAccountCopied] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null)
  const [isReceiptOpen, setIsReceiptOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [procStatus, setProcStatus] = useState<'processing' | 'success'>('processing')
  const [showMoreServices, setShowMoreServices] = useState(false)
  
  // Promo slider index
  const [currentPromo, setCurrentPromo] = useState(0)

  useEffect(() => {
    const promoTimer = setInterval(() => {
      setCurrentPromo(prev => (prev + 1) % PROMOS.length)
    }, 6000)
    return () => clearInterval(promoTimer)
  }, [])

  const fetchProfile = async (silent = false) => {
    try {
      const res = await api.get('/auth/me')
      setUser(res.data)
      
      // Also fetch transactions
      const txRes = await api.get('/vtu/transactions')
      setTransactions(txRes.data)
      
    } catch {
      if (!silent) {
        toast.error('Session expired. Please login again.')
        navigate('/auth/login')
      }
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => { 
    fetchProfile() 
    
    const handleStart = () => {
      setIsProcessing(true)
      setProcStatus('processing')
    }

    const handleSuccess = (e: any) => {
      setProcStatus('success')
      setSelectedTransaction(e.detail)
      setTimeout(() => {
        setIsProcessing(false)
        setIsReceiptOpen(true)
      }, 3000) // Hold for the cool animation
    }

    window.addEventListener('purchase-start', handleStart)
    window.addEventListener('purchase-success', handleSuccess)
    
    const interval = setInterval(() => fetchProfile(true), 15000)
    return () => {
      clearInterval(interval)
      window.removeEventListener('purchase-start', handleStart)
      window.removeEventListener('purchase-success', handleSuccess)
    }
  }, [])

  const copyAccount = () => {
    if (user?.virtualAccountNumber) {
      navigator.clipboard.writeText(user.virtualAccountNumber)
      setAccountCopied(true)
      toast.success('Account number copied!')
      setTimeout(() => setAccountCopied(false), 2000)
    }
  }

  const handleLogout = () => {
    localStorage.clear()
    navigate('/auth/login')
  }

  const handleFundWallet = () => setIsFundingOpen(true)

  const handleRegenerateProvider = async (provider: 'PAYSTACK' | 'PAYMENTPOINT') => {
    setLoading(true);
    try {
      await api.post('/user/generate-accounts', { provider });
      toast.success(`${provider === 'PAYSTACK' ? 'Paystack' : 'PaymentPoint'} A/C updated!`);
      fetchProfile(true);
    } catch (err: any) {
      toast.error(err.response?.data?.error || `Failed to update ${provider} A/C`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-midnight flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-brand-royal/30 border-t-brand-cyan rounded-full animate-spin" />
      </div>
    )
  }

  const firstName = user?.name?.split(' ')[0] ?? 'User'
  const balance = Number(user?.wallet?.balance ?? 0)

  // Dynamic Loyalty Tier system
  const totalSpent = transactions
    .filter((tx: any) => tx.status === 'SUCCESS')
    .reduce((sum: number, tx: any) => sum + tx.amount, 0)

  let loyaltyTier = 'Silver Client'
  let nextTier = 'Gold VIP'
  let nextThreshold = 10000
  let badgeColor = 'text-brand-silver border-brand-silver/20 bg-brand-silver/5'

  if (totalSpent >= 50000) {
    loyaltyTier = 'Platinum VIP'
    nextTier = 'Ultimate Status'
    nextThreshold = 50000
    badgeColor = 'text-brand-gold border-brand-gold/30 bg-brand-gold/5 shadow-[0_0_15px_rgba(251,191,36,0.15)] animate-pulse'
  } else if (totalSpent >= 10000) {
    loyaltyTier = 'Gold VIP'
    nextTier = 'Platinum VIP'
    nextThreshold = 50000
    badgeColor = 'text-brand-cyan border-brand-cyan/30 bg-brand-cyan/5 shadow-[0_0_15px_rgba(0,212,255,0.15)] animate-pulse'
  }

  return (
    <div className="min-h-screen bg-brand-midnight text-white">
      {/* Top Nav */}
      <header className="sticky top-0 z-40 border-b border-brand-royal/10 bg-brand-midnight/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            {user?.profilePicture ? (
              <div className="w-10 h-10 rounded-xl overflow-hidden border border-brand-royal/20">
                <img src={user.profilePicture} alt="Profile" className="w-full h-full object-cover" />
              </div>
            ) : (
              <img src="/logo.png" alt="AGD" className="w-8 h-8 object-contain" />
            )}
            <span className="font-black text-white text-sm tracking-tight font-display hidden sm:block">AGD DATA PLUS</span>
            {user?.role === 'ADMIN' && (
              <button 
                onClick={(e) => { e.stopPropagation(); navigate('/admin'); }}
                className="ml-4 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-red-500 hover:text-white transition-all flex items-center gap-2"
              >
                <ShieldAlert size={12} />
                Master Console
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <button 
              onClick={() => navigate('/dashboard/settings')}
              title="Settings"
              className="w-9 h-9 rounded-xl bg-brand-royal/10 border border-brand-royal/20 flex items-center justify-center text-brand-silver/50 hover:text-brand-cyan transition-colors"
            >
              <Settings size={16} />
            </button>
            <button 
              onClick={() => navigate('/dashboard/profile')}
              title="View Profile"
              className="w-9 h-9 rounded-xl bg-brand-royal/10 border border-brand-royal/20 flex items-center justify-center text-brand-silver/50 hover:text-brand-cyan transition-colors"
            >
              <User size={16} />
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all text-xs font-bold uppercase tracking-widest flex items-center gap-2"
            >
              <LogOut size={14} />
              <span className="hidden sm:block">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 space-y-10">
        {/* Greeting */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-brand-royal/10 pb-6">
          <div>
            <p className="text-brand-silver/40 text-sm uppercase tracking-widest mb-1">Good day</p>
            <h1 className="text-3xl md:text-4xl font-black font-display flex items-center flex-wrap gap-2">
              Hello, <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-cyan to-brand-gold">{firstName}!</span>
              <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${badgeColor}`}>
                {loyaltyTier}
              </span>
            </h1>
          </div>
          {totalSpent < 50000 && (
            <div className="shrink-0 bg-white/5 border border-brand-royal/10 rounded-2xl p-4 min-w-[260px]">
              <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-brand-silver mb-1.5">
                <span>Loyalty Spending: ₦{totalSpent.toLocaleString()}</span>
                <span className="text-brand-cyan">Goal: ₦{nextThreshold.toLocaleString()}</span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-brand-cyan to-brand-gold rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, (totalSpent / nextThreshold) * 100)}%` }} 
                />
              </div>
              <p className="text-[8px] font-bold text-brand-silver/30 mt-1.5 uppercase tracking-wider">
                Spend ₦{(nextThreshold - totalSpent).toLocaleString()} more to claim {nextTier}!
              </p>
            </div>
          )}
        </motion.div>

        {/* Balance + Virtual Account */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Balance Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-2">
            <Card className="p-8 bg-gradient-to-br from-brand-royal/30 via-brand-midnight/60 to-brand-midnight/80 border-brand-royal/20 relative overflow-hidden group h-full">
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                  <div className="flex items-center gap-2 text-brand-silver/50 text-xs font-bold uppercase tracking-widest mb-4">
                    <ShieldCheck size={14} className="text-brand-cyan" />
                    Secured Wallet Balance
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-brand-silver/40 text-2xl font-bold">₦</span>
                    <span className="text-6xl md:text-7xl font-black tracking-tighter text-white">
                      {balance.toLocaleString()}
                    </span>
                    <span className="text-brand-silver/30 text-xl">.00</span>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <span className="w-2 h-2 rounded-full bg-brand-cyan animate-pulse" />
                    <span className="text-brand-cyan text-xs font-bold uppercase tracking-widest">Wallet Active</span>
                  </div>
                </div>
                <div className="mt-10">
                  <Button
                    size="lg"
                    onClick={handleFundWallet}
                    className="w-full sm:w-64 bg-white text-brand-midnight hover:bg-brand-silver font-black shadow-[0_0_30px_rgba(255,255,255,0.15)] transition-all"
                  >
                    Fund Wallet
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Virtual Accounts */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="p-7 border-dashed border-brand-royal/30 h-full flex flex-col justify-between">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 bg-brand-cyan/10 text-brand-cyan text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-brand-cyan/20">
                    Auto-Funding
                  </span>
                  <button 
                    onClick={async () => {
                      setLoading(true);
                      try {
                        await api.post('/user/generate-accounts');
                        toast.success('Accounts regenerated!');
                        fetchProfile(true);
                      } catch (e) {
                        toast.error('Failed to regenerate accounts');
                      } finally {
                        setLoading(false);
                      }
                    }}
                    title="Refresh Accounts"
                    className="p-2 hover:bg-white/5 rounded-lg text-brand-silver/30 hover:text-brand-cyan transition-colors"
                  >
                    <Clock size={16} />
                  </button>
                </div>

                {/* Paystack Account */}
                <div className="p-4 rounded-2xl bg-brand-royal/10 border border-brand-royal/20 relative">
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-brand-silver/40 text-[8px] font-black uppercase tracking-widest">Method 1: Paystack (Wema Bank)</p>
                    {user?.psAccountNumber && (
                      <button 
                        onClick={() => handleRegenerateProvider('PAYSTACK')}
                        className="p-1 hover:bg-white/10 rounded-md text-brand-cyan/40 hover:text-brand-cyan transition-colors"
                        title="Refresh Paystack A/C"
                      >
                        <Clock size={12} />
                      </button>
                    )}
                  </div>
                  {user?.psAccountNumber ? (
                    <>
                      <h3 className="text-xl font-black text-white tracking-widest font-display">{user.psAccountNumber}</h3>
                      <p className="text-brand-cyan font-bold text-[10px] uppercase tracking-wider">{user.psBankName}</p>
                      <button onClick={() => { navigator.clipboard.writeText(user.psAccountNumber!); toast.success('Paystack A/C Copied!'); }} className="mt-2 text-[10px] text-brand-silver/30 hover:text-brand-cyan flex items-center gap-1">
                        <Copy size={10} /> Copy Account
                      </button>
                    </>
                  ) : (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="w-full mt-2 text-[8px] h-8 border-brand-royal/30 text-brand-cyan"
                      onClick={() => handleRegenerateProvider('PAYSTACK')}
                      loading={loading}
                    >
                      Generate Paystack A/C
                    </Button>
                  )}
                </div>

                {/* PaymentPoint Account */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 relative">
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-brand-silver/40 text-[8px] font-black uppercase tracking-widest">Method 2: PaymentPoint</p>
                    {user?.ppAccountNumber && (
                      <button 
                        onClick={() => handleRegenerateProvider('PAYMENTPOINT')}
                        className="p-1 hover:bg-white/10 rounded-md text-brand-silver/20 hover:text-brand-cyan transition-colors"
                        title="Refresh PaymentPoint A/C"
                      >
                        <Clock size={12} />
                      </button>
                    )}
                  </div>
                  {user?.ppAccountNumber ? (
                    <>
                      <h3 className="text-xl font-black text-white tracking-widest font-display">{user.ppAccountNumber}</h3>
                      <p className="text-brand-cyan font-bold text-[10px] uppercase tracking-wider">{user.ppBankName}</p>
                      <button onClick={() => { navigator.clipboard.writeText(user.ppAccountNumber!); toast.success('PaymentPoint A/C Copied!'); }} className="mt-2 text-[10px] text-brand-silver/30 hover:text-brand-cyan flex items-center gap-1">
                        <Copy size={10} /> Copy Account
                      </button>
                    </>
                  ) : (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="w-full mt-2 text-[8px] h-8 border-white/10 text-brand-silver/50"
                      onClick={() => handleRegenerateProvider('PAYMENTPOINT')}
                      loading={loading}
                    >
                      Generate PaymentPoint A/C
                    </Button>
                  )}
                </div>
              </div>
              <p className="text-[9px] text-brand-silver/20 mt-6 leading-relaxed">
                If an account is missing, click "Generate" to create it.
              </p>
            </Card>
          </motion.div>
        </div>

        {/* Sliding Promotional Banners */}
        <div className="relative overflow-hidden rounded-3xl border border-brand-royal/20 bg-brand-royal/5 p-8 backdrop-blur-xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-brand-cyan/5 rounded-full blur-3xl pointer-events-none" />
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPromo}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10"
            >
              <div className="space-y-2">
                <span className="px-3 py-1 bg-brand-cyan/10 text-brand-cyan text-[9px] font-black uppercase tracking-[0.2em] rounded-full border border-brand-cyan/20">
                  EXCLUSIVE CAMPAIGN
                </span>
                <h3 className="text-2xl font-black font-display text-white tracking-tight mt-2">
                  {PROMOS[currentPromo].title}
                </h3>
                <p className="text-brand-silver/50 text-xs md:text-sm max-w-xl leading-relaxed">
                  {PROMOS[currentPromo].desc}
                </p>
              </div>
              <Button
                onClick={() => navigate(PROMOS[currentPromo].route)}
                className="shrink-0 bg-white text-brand-midnight hover:bg-brand-silver font-black text-xs uppercase tracking-widest px-6 h-12 shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all"
              >
                {PROMOS[currentPromo].btnText}
              </Button>
            </motion.div>
          </AnimatePresence>
          {/* Indicators */}
          <div className="flex gap-1.5 mt-6 justify-start">
            {PROMOS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentPromo(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  currentPromo === idx ? 'w-6 bg-brand-cyan' : 'w-1.5 bg-white/10'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Service Cards */}
        <div>
          <h2 className="text-xl font-black text-white mb-6 font-display">Digital Services</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {PRIMARY_SERVICES.map((svc, i) => (
              <motion.button
                key={svc.id}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                animate="show"
                onClick={() => {
                  setModalService(svc.id)
                }}
                className={`group flex flex-col items-center justify-center p-8 rounded-3xl border ${svc.border} bg-brand-midnight/60 backdrop-blur-xl transition-all active:scale-95 hover:-translate-y-2 hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)]`}
              >
                <div className={`w-14 h-14 rounded-2xl bg-white/5 ${svc.glow} mb-4 transition-all flex items-center justify-center`}>
                  <svc.icon className="text-brand-silver/40 group-hover:text-white transition-colors" size={24} />
                </div>
                <span className="text-xs font-black text-brand-silver/60 group-hover:text-white uppercase tracking-widest transition-colors">
                  {svc.name}
                </span>
              </motion.button>
            ))}
          </div>

          <AnimatePresence>
            {showMoreServices && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden mt-4"
              >
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                  {SECONDARY_SERVICES.map((svc, i) => (
                    <motion.button
                      key={svc.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => {
                        if (svc.id === 'SMS') {
                          navigate('/bulksms')
                        } else {
                          setModalService(svc.id)
                        }
                      }}
                      className={`group flex flex-col items-center justify-center p-8 rounded-3xl border ${svc.border} bg-brand-midnight/60 backdrop-blur-xl transition-all active:scale-95 hover:-translate-y-2 hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)]`}
                    >
                      <div className={`w-14 h-14 rounded-2xl bg-white/5 ${svc.glow} mb-4 transition-all flex items-center justify-center`}>
                        <svc.icon className="text-brand-silver/40 group-hover:text-white transition-colors" size={24} />
                      </div>
                      <span className="text-xs font-black text-brand-silver/60 group-hover:text-white uppercase tracking-widest transition-colors">
                        {svc.name}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-6 flex justify-center">
            <Button
              variant="outline"
              onClick={() => setShowMoreServices(!showMoreServices)}
              className="border-brand-royal/20 text-brand-silver/50 text-[10px] font-black uppercase tracking-widest px-6"
            >
              {showMoreServices ? 'Hide Secondary Services' : 'View More Services'}
            </Button>
          </div>
        </div>

        {/* Recent Transactions */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black text-white font-display">Recent Activity</h2>
            <button onClick={() => navigate('/dashboard/transactions')} className="text-brand-cyan text-xs font-black uppercase tracking-widest hover:underline">View All</button>
          </div>
          
          {transactions.length > 0 ? (
            <div className="space-y-3">
              {transactions.slice(0, 5).map((tx, i) => (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => {
                    setSelectedTransaction(tx)
                    setIsReceiptOpen(true)
                  }}
                  className="flex items-center justify-between p-5 rounded-2xl bg-brand-royal/5 border border-brand-royal/10 hover:bg-brand-royal/10 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      tx.serviceType === 'WALLET_TOPUP' ? 'bg-green-500/10 text-green-500' : 'bg-brand-cyan/10 text-brand-cyan'
                    }`}>
                      {tx.serviceType === 'WALLET_TOPUP' ? <ArrowDownLeft size={18} /> : <Smartphone size={18} />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{tx.description}</p>
                      <div className="flex items-center gap-2 text-[10px] text-brand-silver/40 uppercase tracking-widest mt-0.5">
                        <Clock size={10} />
                        {new Date(tx.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-black ${
                      tx.serviceType === 'WALLET_TOPUP' ? 'text-green-500' : 'text-white'
                    }`}>
                      {tx.serviceType === 'WALLET_TOPUP' ? '+' : '-'} ₦{tx.amount.toLocaleString()}
                    </p>
                    <p className="text-[10px] font-bold text-brand-silver/20 uppercase tracking-[0.2em]">{tx.status}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <Card className="border-brand-royal/10">
              <div className="p-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-brand-royal/10 flex items-center justify-center mx-auto mb-4">
                  <Wallet size={28} className="text-brand-silver/20" />
                </div>
                <p className="text-brand-silver/30 font-bold text-sm">No transactions yet</p>
                <p className="text-brand-silver/20 text-xs mt-1">Your activity will appear here</p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Funding Modal */}
      <FundingModal
        isOpen={isFundingOpen}
        onClose={() => setIsFundingOpen(false)}
        ppAccount={{
          accountNumber: user?.ppAccountNumber,
          bankName: user?.ppBankName,
          accountName: user?.ppAccountName
        }}
        psAccount={{
          accountNumber: user?.psAccountNumber,
          bankName: user?.psBankName,
          accountName: user?.psAccountName
        }}
      />

      {/* Purchase Modal */}
      {modalService && (
        <PurchaseModal
          serviceType={modalService}
          isOpen={!!modalService}
          onClose={() => setModalService(null)}
          refreshProfile={fetchProfile}
        />
      )}

      {/* Receipt Modal */}
      <ReceiptModal 
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        transaction={selectedTransaction}
      />

      {/* High-Tech Processing Overlay */}
      <TransactionProcessing 
        isOpen={isProcessing}
        status={procStatus}
      />
    </div>
  )
}
