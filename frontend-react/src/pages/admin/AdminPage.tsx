import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { 
  Users, Wallet, TrendingUp, ShieldAlert, ArrowUpRight, 
  Search, Check, X, Server, Megaphone, DollarSign, Activity,
  Award, Coins, Percent, Clock, ArrowDownLeft, Smartphone
} from 'lucide-react'
import { BroadcastModal } from '@/components/admin/BroadcastModal'

export function AdminPage() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<any>(null)
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Tab controller: 'users' | 'transactions' | 'market'
  const [activeTab, setActiveTab] = useState<'users' | 'transactions' | 'market'>('users')

  // Wallet adjustment state
  const [creditModal, setCreditModal] = useState<{ isOpen: boolean, userId: string, name: string }>({ isOpen: false, userId: '', name: '' })
  const [adjustmentAmount, setAdjustmentAmount] = useState('')
  const [adjustmentAction, setAdjustmentAction] = useState<'CREDIT' | 'DEBIT'>('CREDIT')
  const [adjustmentDescription, setAdjustmentDescription] = useState('')
  
  // Transaction logs lookup state
  const [adminTxList, setAdminTxList] = useState<any[]>([])
  const [txSearch, setTxSearch] = useState('')
  const [txPage, setTxPage] = useState(1)
  const [txTotalPages, setTxTotalPages] = useState(1)

  // Market & Pricing settings state
  const [marketAnalysis, setMarketAnalysis] = useState<any>(null)
  const [editingPlanCode, setEditingPlanCode] = useState<string | null>(null)
  const [priceForm, setPriceForm] = useState({ providerPrice: '', sellingPrice: '', resellerPrice: '' })

  const [isRegenerating, setIsRegenerating] = useState(false)
  const [broadcastState, setBroadcastState] = useState<{ isOpen: boolean, targetUserId?: string, targetUserName?: string }>({ isOpen: false })
  const [activeAlert, setActiveAlert] = useState<string>('')

  const fetchData = async () => {
    try {
      const [statsRes, usersRes, alertRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
        api.get('/notifications/alert/active')
      ])
      setStats(statsRes.data)
      setUsers(usersRes.data)
      setActiveAlert(alertRes.data.alert?.message || '')
    } catch (err: any) {
      toast.error('Admin access denied or session expired')
      navigate('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const fetchTransactions = async () => {
    try {
      const res = await api.get(`/admin/transactions?search=${txSearch}&page=${txPage}&limit=10`)
      setAdminTxList(res.data.transactions)
      setTxTotalPages(res.data.meta.totalPages)
    } catch (err) {
      console.error('Failed to load transaction history')
    }
  }

  const fetchMarketData = async () => {
    try {
      const res = await api.get('/admin/market')
      setMarketAnalysis(res.data)
    } catch (err) {
      console.error('Failed to load market settings')
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (activeTab === 'transactions') {
      fetchTransactions()
    } else if (activeTab === 'market') {
      fetchMarketData()
    }
  }, [activeTab, txSearch, txPage])

  const handleWalletAdjustment = async () => {
    if (!adjustmentAmount || isNaN(Number(adjustmentAmount)) || Number(adjustmentAmount) <= 0) {
      return toast.error('Enter a valid positive number')
    }
    
    try {
      await api.post('/admin/users/adjust', {
        userId: creditModal.userId,
        amount: Number(adjustmentAmount),
        action: adjustmentAction,
        description: adjustmentDescription || `Manual ${adjustmentAction.toLowerCase()} by Admin`
      })
      
      toast.success(`Successfully adjusted ${creditModal.name}'s wallet!`)
      setCreditModal({ isOpen: false, userId: '', name: '' })
      setAdjustmentAmount('')
      setAdjustmentDescription('')
      fetchData()
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Wallet adjustment failed')
    }
  }

  const handleDeleteUser = async (userId: string, name: string) => {
    if (!window.confirm(`Are you sure you want to completely delete ${name}? This action cannot be undone.`)) return
    
    try {
      await api.delete(`/admin/users/${userId}`)
      toast.success('User deleted successfully')
      fetchData()
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Failed to delete user')
    }
  }

  const handleRegenerateAccounts = async () => {
    if (!window.confirm('This will attempt to generate bank accounts for all users missing them. Continue?')) return
    
    setIsRegenerating(true)
    try {
      await api.post('/admin/accounts/regenerate') 
      toast.success('Account generation process started!')
      fetchData()
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Process failed')
    } finally {
      setIsRegenerating(false)
    }
  }

  const handleGenerateSingleAccount = async (userId: string, provider: 'PAYSTACK' | 'PAYMENTPOINT') => {
    try {
      await api.post(`/admin/accounts/generate/${userId}`, { provider })
      toast.success(`${provider} Account generated successfully!`)
      fetchData()
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Failed to generate account')
    }
  }

  const handleUpdatePrice = async (rule: any) => {
    try {
      await api.post('/admin/pricing', {
        provider: rule.provider,
        planCode: rule.planCode,
        providerPrice: Number(priceForm.providerPrice),
        sellingPrice: Number(priceForm.sellingPrice),
        resellerPrice: Number(priceForm.resellerPrice)
      })
      toast.success('Pricing margin updated successfully!')
      setEditingPlanCode(null)
      fetchMarketData()
    } catch (err) {
      toast.error('Failed to update pricing settings')
    }
  }

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.phone.includes(searchQuery)
  )

  if (loading) return (
    <div className="min-h-screen bg-brand-midnight flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-brand-royal/30 border-t-brand-cyan rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-brand-midnight text-white pb-20">
      {/* Admin Nav */}
      <header className="sticky top-0 z-40 border-b border-red-500/10 bg-brand-midnight/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-500 flex items-center justify-center shadow-[0_0_15px_rgba(239,68,68,0.3)]">
              <ShieldAlert size={18} className="text-white" />
            </div>
            <span className="font-black text-xs uppercase tracking-widest text-red-500 font-display">Master Console</span>
          </div>
          <div className="flex items-center gap-3">
            <Button size="sm" variant="outline" onClick={() => { setLoading(true); fetchData(); }} className="text-xs uppercase tracking-widest border-brand-royal/20">
              Refresh Data
            </Button>
            <Button 
              size="sm" 
              onClick={handleRegenerateAccounts} 
              loading={isRegenerating}
              className="text-xs uppercase tracking-widest bg-brand-gold hover:bg-brand-gold/80 text-brand-midnight font-black"
            >
              Regenerate Accounts
            </Button>
            <Button 
              size="sm" 
              onClick={() => setBroadcastState({ isOpen: true })} 
              className="text-xs uppercase tracking-widest bg-brand-royal hover:bg-brand-royal/80 text-white font-black flex items-center gap-2"
            >
              <Megaphone size={14} />
              Send Broadcast
            </Button>
            <Button size="sm" variant="outline" onClick={() => navigate('/dashboard')} className="text-xs uppercase tracking-widest border-brand-royal/20">
              Exit Console
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 pt-10 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black font-display tracking-tight">Business <span className="text-red-500">Analytics</span></h1>
            <p className="text-brand-silver/30 text-sm mt-1">Real-time overview of your VTU empire.</p>
          </div>
          <div className="flex items-center gap-2 text-green-400 text-xs font-bold uppercase tracking-widest bg-green-400/5 px-3 py-1 rounded-full border border-green-400/10 self-start">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Live System Pulse
          </div>
        </div>

        {/* Analytics Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Total Registered Agents" 
            value={stats?.totalUsers} 
            icon={Users} 
            color="text-brand-cyan" 
          />
          <StatCard 
            title="Total Wallet Liability" 
            value={`₦${(stats?.totalUserBalance || 0).toLocaleString()}`} 
            icon={Wallet} 
            color="text-brand-royal" 
          />
          <StatCard 
            title="Total Platform Profit" 
            value={`₦${(stats?.totalSystemProfit || 0).toLocaleString()}`} 
            icon={DollarSign} 
            color="text-brand-gold" 
          />
          <StatCard 
            title="Daily Sales Volume" 
            value={`₦${(stats?.dailySales?.amount || 0).toLocaleString()} (${stats?.dailySales?.count || 0} sales)`} 
            icon={Activity} 
            color="text-green-400" 
          />
        </div>

        {/* Global Alert Management */}
        <div className="bg-[#111111] border border-red-500/20 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-center gap-3 mb-4">
            <ShieldAlert size={20} className="text-red-500" />
            <h2 className="text-lg font-black font-display uppercase tracking-widest text-red-500">Global Urgent Alert</h2>
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-4">
              <Input 
                placeholder="Enter critical message for all users..." 
                id="alertMessage"
                className="flex-1 bg-white/5 border-white/10 text-white"
              />
              <div className="flex gap-2">
                <Button 
                  onClick={async () => {
                    const el = document.getElementById('alertMessage') as HTMLInputElement;
                    if (!el.value) return toast.error('Message is empty');
                    try {
                      await api.post('/admin/alert', { message: el.value });
                      toast.success('Global alert broadcasted to all users!');
                      setActiveAlert(el.value);
                      el.value = '';
                    } catch (e: any) {
                      toast.error(e.response?.data?.error || 'Failed to set alert');
                    }
                  }}
                  className="bg-red-500 hover:bg-red-600 text-white uppercase tracking-widest text-xs font-black px-6 animate-pulse"
                >
                  Set Alert
                </Button>
                <Button 
                  onClick={async () => {
                    try {
                      await api.delete('/admin/alert');
                      toast.success('Global alert deactivated');
                      setActiveAlert('');
                    } catch (e: any) {
                      toast.error(e.response?.data?.error || 'Failed to remove alert');
                    }
                  }}
                  variant="outline"
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10 uppercase tracking-widest text-xs font-black px-6"
                >
                  Disable
                </Button>
              </div>
            </div>

            {activeAlert ? (
              <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl relative">
                <div className="absolute top-3 right-3 text-[9px] font-black uppercase tracking-widest text-red-500 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20 animate-pulse">
                  Active Now
                </div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-red-500/80 mb-1">Current Live Alert:</h4>
                <p className="text-xs text-brand-silver font-medium leading-relaxed whitespace-pre-wrap">{activeAlert}</p>
              </div>
            ) : (
              <div className="p-4 bg-white/[0.01] border border-white/5 rounded-xl text-center">
                <p className="text-xs text-brand-silver/30 font-bold uppercase tracking-widest italic">No System-wide Alerts Active</p>
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigator */}
        <div className="flex border-b border-brand-royal/10">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-6 py-4 font-black uppercase tracking-wider text-xs font-display transition-all relative ${
              activeTab === 'users' ? 'text-brand-cyan border-b-2 border-brand-cyan' : 'text-brand-silver/40 hover:text-white'
            }`}
          >
            User Management & Loyalty
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-6 py-4 font-black uppercase tracking-wider text-xs font-display transition-all relative ${
              activeTab === 'transactions' ? 'text-brand-cyan border-b-2 border-brand-cyan' : 'text-brand-silver/40 hover:text-white'
            }`}
          >
            All Transactions Log
          </button>
          <button
            onClick={() => setActiveTab('market')}
            className={`px-6 py-4 font-black uppercase tracking-wider text-xs font-display transition-all relative ${
              activeTab === 'market' ? 'text-brand-cyan border-b-2 border-brand-cyan' : 'text-brand-silver/40 hover:text-white'
            }`}
          >
            Market & Plan Pricing Margins
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content tab */}
          <div className="lg:col-span-2 space-y-4">
            
            {activeTab === 'users' && (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-black font-display uppercase tracking-widest">User Directory</h2>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-silver/20" size={14} />
                    <input 
                      type="text" 
                      placeholder="Search name, email..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-white/5 border border-brand-royal/10 rounded-xl py-2 pl-9 pr-4 text-xs focus:outline-none focus:border-brand-cyan transition-all"
                    />
                  </div>
                </div>

                <Card className="overflow-hidden border-brand-royal/10 bg-white/[0.02]">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white/5 text-[10px] uppercase tracking-widest text-brand-silver/40 font-black border-b border-brand-royal/10">
                        <th className="px-6 py-4">User</th>
                        <th className="px-6 py-4">Balance</th>
                        <th className="px-6 py-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-royal/10">
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="px-6 py-12 text-center text-brand-silver/20 text-xs font-bold uppercase tracking-widest italic">
                            No users found in directory
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map(user => (
                          <tr key={user.id} className="hover:bg-white/[0.03] transition-colors group">
                            <td className="px-6 py-4">
                              <div className="flex flex-col">
                                <span className="text-sm font-bold text-white flex items-center gap-2">
                                  {user.name}
                                </span>
                                <span className="text-[10px] text-brand-silver/30 font-medium">{user.email}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm font-black text-brand-silver/80">₦{(user.wallet?.balance ?? 0).toLocaleString()}</span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-2">
                                {!user.psAccountNumber && (
                                  <button 
                                    onClick={() => handleGenerateSingleAccount(user.id, 'PAYSTACK')}
                                    className="px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-500 text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all"
                                  >
                                    Gen PS
                                  </button>
                                )}
                                {!user.ppAccountNumber && (
                                  <button 
                                    onClick={() => handleGenerateSingleAccount(user.id, 'PAYMENTPOINT')}
                                    className="px-3 py-1.5 rounded-lg bg-brand-gold/10 border border-brand-gold/20 text-brand-gold text-[10px] font-black uppercase tracking-widest hover:bg-brand-gold hover:text-brand-midnight transition-all"
                                  >
                                    Gen PP
                                  </button>
                                )}
                                <button 
                                  onClick={() => setBroadcastState({ isOpen: true, targetUserId: user.id, targetUserName: user.name })}
                                  className="px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-500 text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all"
                                >
                                  Message
                                </button>
                                <button 
                                  onClick={() => {
                                    setCreditModal({ isOpen: true, userId: user.id, name: user.name })
                                    setAdjustmentAction('CREDIT')
                                  }}
                                  className="px-3 py-1.5 rounded-lg bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan text-[10px] font-black uppercase tracking-widest hover:bg-brand-cyan hover:text-brand-midnight transition-all"
                                >
                                  Adjust A/C
                                </button>
                                {user.role !== 'ADMIN' && (
                                  <button 
                                    onClick={() => handleDeleteUser(user.id, user.name)}
                                    className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all"
                                  >
                                    Delete
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </Card>
              </>
            )}

            {activeTab === 'transactions' && (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-black font-display uppercase tracking-widest">Global Transactions</h2>
                  <div className="relative w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-silver/20" size={14} />
                    <input 
                      type="text" 
                      placeholder="Search Reference, Email, Phone..." 
                      value={txSearch}
                      onChange={(e) => { setTxSearch(e.target.value); setTxPage(1); }}
                      className="w-full bg-white/5 border border-brand-royal/10 rounded-xl py-2.5 pl-9 pr-4 text-xs focus:outline-none focus:border-brand-cyan transition-all"
                    />
                  </div>
                </div>

                <Card className="overflow-hidden border-brand-royal/10 bg-white/[0.02]">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white/5 text-[10px] uppercase tracking-widest text-brand-silver/40 font-black border-b border-brand-royal/10">
                        <th className="px-6 py-4">Transaction ID / User</th>
                        <th className="px-6 py-4">Description</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-royal/10">
                      {adminTxList.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-12 text-center text-brand-silver/20 text-xs font-bold uppercase tracking-widest italic">
                            No matching transaction logs found
                          </td>
                        </tr>
                      ) : (
                        adminTxList.map(tx => (
                          <tr key={tx.id} className="hover:bg-white/[0.03] transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex flex-col">
                                <span className="text-xs font-black text-brand-cyan font-mono">{tx.reference}</span>
                                <span className="text-[10px] text-brand-silver/40">{tx.user?.email || 'N/A'}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col">
                                <span className="text-xs font-bold text-white">{tx.description}</span>
                                <span className="text-[9px] text-brand-silver/30 font-medium">{new Date(tx.createdAt).toLocaleString()}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2.5 py-1 rounded-md text-[8px] font-black tracking-widest uppercase border ${
                                tx.status === 'SUCCESS' ? 'bg-green-500/10 border-green-500/30 text-green-400' :
                                tx.status === 'FAILED' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                                'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
                              }`}>
                                {tx.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className="text-xs font-black text-white">₦{tx.amount.toLocaleString()}</span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </Card>

                {/* Pagination Controls */}
                <div className="flex justify-between items-center bg-white/5 border border-brand-royal/10 rounded-2xl p-4">
                  <p className="text-[10px] uppercase tracking-widest font-black text-brand-silver/30">Page {txPage} of {txTotalPages}</p>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      disabled={txPage === 1}
                      onClick={() => setTxPage(prev => Math.max(1, prev - 1))}
                      className="border-brand-royal/10 text-xs font-black"
                    >
                      Prev
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      disabled={txPage === txTotalPages}
                      onClick={() => setTxPage(prev => Math.min(txTotalPages, prev + 1))}
                      className="border-brand-royal/10 text-xs font-black"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'market' && (
              <>
                <h2 className="text-xl font-black font-display uppercase tracking-widest">Global Reseller Plan Pricing Rules</h2>
                <p className="text-xs text-brand-silver/40">Adjust margin parameters dynamically to scale margins across VTU providers.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {marketAnalysis?.planPrices?.length === 0 ? (
                    <Card className="p-8 text-center border-brand-royal/10 md:col-span-2">
                      <p className="text-xs text-brand-silver/30 font-bold uppercase tracking-widest italic">No pricing customizer rules set. Utilizing standard static profit margin computations.</p>
                    </Card>
                  ) : (
                    marketAnalysis?.planPrices?.map((rule: any) => (
                      <Card key={rule.id} className="p-5 border-brand-royal/15 bg-white/[0.01]">
                        <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
                          <div>
                            <span className="text-[9px] font-black uppercase tracking-wider text-brand-cyan">{rule.provider}</span>
                            <h4 className="text-xs font-black text-white font-mono">{rule.planCode}</h4>
                          </div>
                          {editingPlanCode !== rule.planCode ? (
                            <Button 
                              size="sm" 
                              onClick={() => {
                                setEditingPlanCode(rule.planCode)
                                setPriceForm({
                                  providerPrice: String(rule.providerPrice),
                                  sellingPrice: String(rule.sellingPrice),
                                  resellerPrice: String(rule.resellerPrice)
                                })
                              }}
                              className="bg-brand-cyan text-brand-midnight text-[9px] font-black uppercase tracking-widest"
                            >
                              Edit Rules
                            </Button>
                          ) : (
                            <div className="flex gap-1">
                              <Button 
                                size="sm" 
                                onClick={() => handleUpdatePrice(rule)}
                                className="bg-green-500 text-white text-[9px] font-black uppercase tracking-widest px-2"
                              >
                                Save
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => setEditingPlanCode(null)}
                                className="border-white/5 text-[9px] font-black uppercase tracking-widest px-2"
                              >
                                Cancel
                              </Button>
                            </div>
                          )}
                        </div>

                        {editingPlanCode === rule.planCode ? (
                          <div className="space-y-3">
                            <Input 
                              label="Provider Base Price" 
                              value={priceForm.providerPrice} 
                              onChange={(e) => setPriceForm(p => ({ ...p, providerPrice: e.target.value }))}
                            />
                            <Input 
                              label="Customer Retail Price" 
                              value={priceForm.sellingPrice} 
                              onChange={(e) => setPriceForm(p => ({ ...p, sellingPrice: e.target.value }))}
                            />
                            <Input 
                              label="Reseller Wholesale Price" 
                              value={priceForm.resellerPrice} 
                              onChange={(e) => setPriceForm(p => ({ ...p, resellerPrice: e.target.value }))}
                            />
                          </div>
                        ) : (
                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                              <p className="text-[8px] font-black text-brand-silver/30 uppercase tracking-widest">Base Cost</p>
                              <p className="text-xs font-black text-white mt-0.5">₦{rule.providerPrice}</p>
                            </div>
                            <div className="p-2.5 rounded-xl bg-brand-cyan/5 border border-brand-cyan/10">
                              <p className="text-[8px] font-black text-brand-cyan/80 uppercase tracking-widest">Selling</p>
                              <p className="text-xs font-black text-white mt-0.5">₦{rule.sellingPrice}</p>
                            </div>
                            <div className="p-2.5 rounded-xl bg-brand-gold/5 border border-brand-gold/10">
                              <p className="text-[8px] font-black text-brand-gold/80 uppercase tracking-widest">Reseller</p>
                              <p className="text-xs font-black text-white mt-0.5">₦{rule.resellerPrice}</p>
                            </div>
                          </div>
                        )}
                      </Card>
                    ))
                  )}
                </div>
              </>
            )}

          </div>

          {/* Sidebar Analytics */}
          <div className="space-y-6">
            
            {/* Top Loyal Spenders */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Award className="text-brand-gold" size={18} />
                <h2 className="text-md font-black font-display uppercase tracking-widest">Loyalty Leaderboard</h2>
              </div>
              <Card className="p-5 border-brand-royal/10 bg-gradient-to-br from-white/5 to-transparent space-y-4">
                {users.slice(0, 5).map((u, i) => {
                  let badgeColor = 'text-brand-silver bg-white/5 border-white/10'
                  let rankTier = 'Silver Client'
                  if (i === 0) {
                    badgeColor = 'text-brand-gold bg-brand-gold/10 border-brand-gold/20'
                    rankTier = 'Platinum VIP'
                  } else if (i === 1) {
                    badgeColor = 'text-brand-cyan bg-brand-cyan/10 border-brand-cyan/20'
                    rankTier = 'Gold VIP'
                  }
                  
                  return (
                    <div key={u.id} className="flex items-center justify-between border-b border-white/5 pb-3 last:border-b-0 last:pb-0">
                      <div>
                        <p className="text-xs font-black text-white">{u.name}</p>
                        <p className="text-[8px] text-brand-silver/30 font-black uppercase tracking-widest mt-0.5">{rankTier}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${badgeColor}`}>
                        Rank #{i + 1}
                      </span>
                    </div>
                  )
                })}
              </Card>
            </div>

            {/* Provider Nodes */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Server className="text-brand-cyan" size={18} />
                <h2 className="text-md font-black font-display uppercase tracking-widest">Provider Nodes</h2>
              </div>
              <div className="space-y-4">
                {(stats?.providerBalances || []).map((pb: any) => (
                  <Card key={pb.id} className="p-5 border-brand-royal/10 bg-gradient-to-br from-white/5 to-transparent">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-brand-royal/10 flex items-center justify-center">
                          <Server size={18} className="text-brand-cyan" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-silver/40">{pb.provider}</p>
                          <p className="text-sm font-bold text-white">Cloud Node Active</p>
                        </div>
                      </div>
                      <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.5)] animate-pulse" />
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-brand-silver/30 text-xs">₦</span>
                      <span className="text-2xl font-black text-white">{(pb.balance || 0).toLocaleString()}</span>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Wallet Adjustment Modal */}
      <AnimatePresence>
        {creditModal.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setCreditModal({ ...creditModal, isOpen: false })} className="absolute inset-0 bg-brand-midnight/90 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-sm bg-[#0D1323] border border-brand-royal/20 rounded-3xl p-8 shadow-2xl">
              <h3 className="text-xl font-black mb-1 font-display">Wallet Adjustment</h3>
              <p className="text-brand-silver/30 text-xs mb-6 font-medium">Modifying wallet for {creditModal.name}</p>
              
              <div className="space-y-4">
                {/* Segmented control for CREDIT or DEBIT */}
                <div className="grid grid-cols-2 gap-2 bg-white/5 p-1 rounded-xl border border-white/5">
                  <button
                    type="button"
                    onClick={() => setAdjustmentAction('CREDIT')}
                    className={`py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                      adjustmentAction === 'CREDIT' ? 'bg-green-500 text-white shadow-lg' : 'text-brand-silver/40 hover:text-white'
                    }`}
                  >
                    Credit
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustmentAction('DEBIT')}
                    className={`py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                      adjustmentAction === 'DEBIT' ? 'bg-red-500 text-white shadow-lg' : 'text-brand-silver/40 hover:text-white'
                    }`}
                  >
                    Debit
                  </button>
                </div>

                <div className="relative">
                  <span className="absolute left-4 top-1/2 translate-y-3 text-brand-silver/40 text-sm font-bold">₦</span>
                  <Input 
                    label="Adjustment Amount"
                    type="number"
                    placeholder="Enter amount..."
                    value={adjustmentAmount}
                    onChange={(e) => setAdjustmentAmount(e.target.value)}
                    className="pl-8"
                  />
                </div>

                <Input 
                  label="Adjustment Reason"
                  placeholder="e.g. Funding reversal, VIP bonus..."
                  value={adjustmentDescription}
                  onChange={(e) => setAdjustmentDescription(e.target.value)}
                />

                <div className="flex gap-3 mt-4">
                  <Button onClick={() => setCreditModal({ ...creditModal, isOpen: false })} variant="outline" className="flex-1 border-white/10 uppercase tracking-widest text-[10px] font-black">Cancel</Button>
                  <Button 
                    onClick={handleWalletAdjustment} 
                    className={`flex-1 text-white shadow-lg uppercase tracking-widest text-[10px] font-black ${
                      adjustmentAction === 'CREDIT' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'
                    }`}
                  >
                    Apply Adjustment
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <BroadcastModal 
        isOpen={broadcastState.isOpen} 
        onClose={() => setBroadcastState({ isOpen: false })} 
        targetUserId={broadcastState.targetUserId}
        targetUserName={broadcastState.targetUserName}
      />
    </div>
  )
}

function StatCard({ title, value, icon: Icon, color }: any) {
  return (
    <Card className="p-6 border-brand-royal/10 bg-white/[0.02] relative overflow-hidden group">
      <div className={`absolute top-0 right-0 w-24 h-24 ${color} opacity-[0.03] group-hover:opacity-[0.08] transition-opacity`}>
        <Icon size={96} />
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-silver/30 mb-2">{title}</p>
      <div className="flex items-center justify-between">
        <h4 className="text-2xl font-black text-white">{value ?? '---'}</h4>
        <div className={`w-8 h-8 rounded-lg ${color.replace('text', 'bg')}/10 flex items-center justify-center ${color}`}>
          <Icon size={16} />
        </div>
      </div>
    </Card>
  )
}
