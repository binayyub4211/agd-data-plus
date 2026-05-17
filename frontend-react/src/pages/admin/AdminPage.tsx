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
  Search, Edit3, Check, X, Server, Database, Megaphone
} from 'lucide-react'
import { BroadcastModal } from '@/components/admin/BroadcastModal'

export function AdminPage() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<any>(null)
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [creditModal, setCreditModal] = useState<{ isOpen: boolean, userId: string, name: string }>({ isOpen: false, userId: '', name: '' })
  const [creditAmount, setCreditAmount] = useState('')
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [broadcastState, setBroadcastState] = useState<{ isOpen: boolean, targetUserId?: string, targetUserName?: string }>({ isOpen: false })
  const [activeAlert, setActiveAlert] = useState<string>('')

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token')
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

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000) // Auto-refresh every 30s
    return () => clearInterval(interval)
  }, [])

  const handleManualCredit = async () => {
    if (!creditAmount || isNaN(Number(creditAmount))) return toast.error('Enter a valid amount')
    
    try {
      const token = localStorage.getItem('token')
      await api.post('/admin/users/credit', {
        userId: creditModal.userId,
        amount: Number(creditAmount),
        description: 'Manual credit by Admin'
      }, { headers: { Authorization: `Bearer ${token}` } })
      
      toast.success(`Successfully credited ${creditModal.name}`)
      setCreditModal({ isOpen: false, userId: '', name: '' })
      setCreditAmount('')
      fetchData()
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Action failed')
    }
  }

  const handleDeleteUser = async (userId: string, name: string) => {
    if (!window.confirm(`Are you sure you want to completely delete ${name}? This action cannot be undone.`)) return
    
    try {
      const token = localStorage.getItem('token')
      await api.delete(`/admin/users/${userId}`, { headers: { Authorization: `Bearer ${token}` } })
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
      // In a real system, you'd want a bulk endpoint, but for now we'll trigger it for missing ones
      // or use the global refresh logic if implemented on backend
      await api.post('/user/generate-accounts') 
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
      await api.post('/user/generate-accounts', { targetId: userId, provider })
      toast.success(`${provider} Account generated successfully!`)
      fetchData()
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Failed to generate account')
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
            <span className="font-black text-xs uppercase tracking-widest text-red-500">Master Console</span>
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
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-4xl font-black font-display tracking-tight">Business <span className="text-red-500">Analytics</span></h1>
            <p className="text-brand-silver/30 text-sm mt-1">Real-time overview of your VTU empire.</p>
          </div>
          <div className="flex items-center gap-2 text-green-400 text-xs font-bold uppercase tracking-widest bg-green-400/5 px-3 py-1 rounded-full border border-green-400/10">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Live System Pulse
          </div>
        </div>

        {/* Top Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <StatCard title="Total Users" value={stats?.totalUsers ?? 0} icon={Users} color="text-blue-400" />
          <StatCard title="User Liabilities" value={`₦${(stats?.totalUserBalance ?? 0).toLocaleString()}`} icon={Wallet} color="text-brand-gold" />
          <StatCard title="24h Sales" value={`₦${(stats?.dailySales?.amount ?? 0).toLocaleString()}`} icon={TrendingUp} color="text-green-400" />
          <StatCard title="Total Profit" value={`₦${(stats?.totalSystemProfit ?? 0).toLocaleString()}`} icon={ArrowUpRight} color="text-brand-cyan" />
          <StatCard 
            title="CheapData Balance" 
            value={`₦${(stats?.providerBalances?.find((p: any) => p.provider === 'CHEAP_DATA_HUB')?.balance ?? 0).toLocaleString()}`} 
            icon={Server} 
            color="text-purple-400" 
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
                  className="bg-red-500 hover:bg-red-600 text-white uppercase tracking-widest text-xs font-black px-6"
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

            {/* Live Active Alert Display */}
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Management */}
          <div className="lg:col-span-2 space-y-4">
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
                            <span className="text-sm font-bold text-white">{user.name}</span>
                            <span className="text-[10px] text-brand-silver/30 font-medium">{user.email}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-black text-brand-silver/80">₦{(user.wallet?.balance ?? 0).toLocaleString()}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            {/* @ts-ignore */}
                            {!user.psAccountNumber && (
                              <button 
                                onClick={() => handleGenerateSingleAccount(user.id, 'PAYSTACK')}
                                className="px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-500 text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all"
                              >
                                Gen PS
                              </button>
                            )}
                            {/* @ts-ignore */}
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
                              onClick={() => setCreditModal({ isOpen: true, userId: user.id, name: user.name })}
                              className="px-3 py-1.5 rounded-lg bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan text-[10px] font-black uppercase tracking-widest hover:bg-brand-cyan hover:text-brand-midnight transition-all"
                            >
                              Modify
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
          </div>

          {/* Provider Health */}
          <div className="space-y-4">
            <h2 className="text-xl font-black font-display uppercase tracking-widest">Provider Nodes</h2>
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
                    <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.5)]" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-brand-silver/30 text-xs">₦</span>
                    <span className="text-2xl font-black text-white">{(pb.balance || 0).toLocaleString()}</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full mt-4 overflow-hidden">
                    <div className="h-full bg-brand-cyan w-[70%]" />
                  </div>
                </Card>
              ))}
              <Card className="p-6 bg-red-500/5 border-red-500/10 flex flex-col items-center justify-center text-center">
                <p className="text-xs font-bold text-brand-cyan/40 uppercase tracking-widest">Global Ledger</p>
                <p className="text-sm font-black text-white mt-1">PostgreSQL Cloud</p>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Credit Modal */}
      <AnimatePresence>
        {creditModal.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setCreditModal({ ...creditModal, isOpen: false })} className="absolute inset-0 bg-brand-midnight/90 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-sm bg-[#0D1323] border border-brand-royal/20 rounded-3xl p-8 shadow-2xl">
              <h3 className="text-xl font-black mb-1">Manual Adjustment</h3>
              <p className="text-brand-silver/30 text-xs mb-6 font-medium">Modifying wallet for {creditModal.name}</p>
              
              <div className="space-y-4">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 translate-y-3 text-brand-silver/40 text-sm font-bold">₦</span>
                  <Input 
                    label="Adjustment Amount"
                    type="number"
                    placeholder="Enter amount (use negative for debit)"
                    value={creditAmount}
                    onChange={(e) => setCreditAmount(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <div className="flex gap-3">
                  <Button onClick={() => setCreditModal({ ...creditModal, isOpen: false })} variant="outline" className="flex-1 border-white/10 uppercase tracking-widest text-[10px] font-black">Cancel</Button>
                  <Button onClick={handleManualCredit} className="flex-1 bg-red-500 hover:bg-red-600 text-white shadow-[0_0_20px_rgba(239,68,68,0.2)] uppercase tracking-widest text-[10px] font-black">Confirm Action</Button>
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
