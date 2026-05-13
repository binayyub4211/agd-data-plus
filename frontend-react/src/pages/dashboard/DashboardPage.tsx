import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
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
  Wifi, Smartphone, Zap, Monitor, LogOut, User, Bell, Clock, ArrowDownLeft
} from 'lucide-react'

const SERVICES = [
  { id: 'DATA',        name: 'Buy Data',    icon: Wifi,        border: 'border-blue-500/30',   glow: 'group-hover:bg-brand-royal/30'  },
  { id: 'AIRTIME',     name: 'Airtime',     icon: Smartphone,  border: 'border-green-500/30',  glow: 'group-hover:bg-green-500/20'    },
  { id: 'ELECTRICITY', name: 'Electricity', icon: Zap,         border: 'border-brand-gold/30', glow: 'group-hover:bg-brand-gold/20'   },
  { id: 'CABLE',       name: 'Cable TV',    icon: Monitor,     border: 'border-purple-500/30', glow: 'group-hover:bg-purple-500/20'   },
  { id: 'SMS',         name: 'Bulk SMS',    icon: Mail,        border: 'border-brand-cyan/30', glow: 'group-hover:bg-brand-cyan/20'   },
]

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.4 },
  }),
}

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

  const fetchProfile = async (silent = false) => {
    try {
      const token = localStorage.getItem('token')
      const res = await axios.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
      setUser(res.data)
      
      // Also fetch transactions
      const txRes = await axios.get('/api/vtu/transactions', {
        headers: { Authorization: `Bearer ${token}` },
      })
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

  const handleFundWallet = () => {
    setIsFundingOpen(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-midnight flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-brand-royal/30 border-t-brand-cyan rounded-full animate-spin" />
      </div>
    )
  }

  const firstName = user?.name?.split(' ')[0] ?? 'User'
  const balance = Number(user?.wallet?.balance ?? 0)

  return (
    <div className="min-h-screen bg-brand-midnight text-white">
      {/* Top Nav */}
      <header className="sticky top-0 z-40 border-b border-brand-royal/10 bg-brand-midnight/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="AGD" className="w-8 h-8 object-contain" />
            <span className="font-black text-white text-sm tracking-tight font-display hidden sm:block">AGD DATA PLUS</span>
            {user?.role === 'ADMIN' && (
              <button 
                onClick={() => navigate('/admin')}
                className="ml-4 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-red-500 hover:text-white transition-all flex items-center gap-2"
              >
                <ShieldAlert size={12} />
                Master Console
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <button className="w-9 h-9 rounded-xl bg-brand-royal/10 border border-brand-royal/20 flex items-center justify-center text-brand-silver/50 hover:text-brand-cyan transition-colors">
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
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-brand-silver/40 text-sm uppercase tracking-widest mb-1">Good day</p>
          <h1 className="text-3xl md:text-4xl font-black font-display">
            Hello, <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-cyan to-brand-gold">{firstName}!</span>
          </h1>
        </motion.div>

        {/* Balance + Virtual Account */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Balance Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-2">
            <Card className="p-8 bg-gradient-to-br from-brand-royal/30 via-brand-midnight/60 to-brand-midnight/80 border-brand-royal/20 relative overflow-hidden group h-full">
              <div className="absolute top-0 right-0 w-64 h-64 opacity-5 group-hover:opacity-10 transition-opacity">
                <Wallet size={256} />
              </div>
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
                <div className="flex gap-3 mt-10">
                  <Button
                    size="lg"
                    onClick={handleFundWallet}
                    className="flex-1 bg-white text-brand-midnight hover:bg-brand-silver font-black shadow-[0_0_30px_rgba(255,255,255,0.15)] transition-all"
                  >
                    Fund Wallet
                  </Button>
                  <Button size="lg" variant="outline" className="flex-1 border-white/10">
                    Transfer
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Virtual Account */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="p-7 border-dashed border-brand-royal/30 h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="px-3 py-1 bg-brand-cyan/10 text-brand-cyan text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-brand-cyan/20">
                    Auto-Funding
                  </span>
                  <Banknote size={18} className="text-brand-silver/20" />
                </div>
                <p className="text-brand-silver/40 text-[10px] font-black uppercase tracking-widest mb-3">
                  Your Dedicated Account
                </p>
                {user?.virtualAccountNumber ? (
                  <>
                    <h3 className="text-3xl font-black text-white tracking-widest mb-1 font-display">
                      {user.virtualAccountNumber}
                    </h3>
                    <p className="text-brand-cyan font-bold text-sm uppercase tracking-wider">
                      {user.virtualAccountBank ?? 'Bank'}
                    </p>
                    <p className="text-brand-silver/40 text-xs mt-1">{user.virtualAccountName}</p>
                    <button
                      onClick={copyAccount}
                      className="mt-5 flex items-center gap-2 text-xs text-brand-silver/30 hover:text-brand-cyan transition-colors group"
                    >
                      {accountCopied ? <Check size={13} className="text-green-500" /> : <Copy size={13} className="group-hover:scale-110 transition-transform" />}
                      {accountCopied ? 'Copied!' : 'Copy Account Number'}
                    </button>
                  </>
                ) : (
                  <div className="space-y-3 mt-3">
                    <div className="h-8 w-40 bg-brand-silver/5 rounded-xl animate-pulse" />
                    <div className="h-4 w-24 bg-brand-silver/5 rounded-xl animate-pulse" />
                    <p className="text-brand-silver/30 text-xs italic">Assigning your account...</p>
                  </div>
                )}
              </div>
              <p className="text-[10px] text-brand-silver/20 mt-6 leading-relaxed">
                Transfer directly to this account to fund your wallet instantly and automatically.
              </p>
            </Card>
          </motion.div>
        </div>

        {/* Service Cards */}
        <div>
          <h2 className="text-xl font-black text-white mb-6 font-display">Digital Services</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {SERVICES.map((svc, i) => (
              <motion.button
                key={svc.id}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                animate="show"
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
        </div>

        {/* Recent Transactions */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black text-white font-display">Recent Activity</h2>
            <button className="text-brand-cyan text-xs font-black uppercase tracking-widest hover:underline">View All</button>
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
        virtualAccount={{
          accountNumber: user?.virtualAccountNumber,
          bankName: user?.virtualAccountBank,
          accountName: user?.virtualAccountName
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
