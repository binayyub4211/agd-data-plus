import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Gift, Users, Copy, Check, Info, TrendingUp, DollarSign } from 'lucide-react'

export function ReferralsPage() {
  const [referrals, setReferrals] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token')
      const [userRes, refRes] = await Promise.all([
        api.get('/auth/me'),
        api.get('/auth/referrals')
      ])
      setUser(userRes.data)
      setReferrals(refRes.data)
    } catch (err) {
      toast.error('Failed to load referral data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const copyToClipboard = () => {
    if (!user?.referralCode) return
    const link = `${window.location.origin}/#/auth/register?ref=${user.referralCode}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    toast.success('Referral link copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  const totalEarned = referrals
    .filter(r => r.status === 'PAID')
    .reduce((sum, r) => sum + r.bonusAmount, 0)

  if (loading) return (
    <div className="min-h-[400px] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand-royal/30 border-t-brand-cyan rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black font-display tracking-tight text-white">Refer & <span className="text-brand-cyan">Earn</span></h1>
          <p className="text-brand-silver/40 text-sm mt-1">Invite friends and get ₦100 on their first deposit.</p>
        </div>
        
        <div className="bg-brand-cyan/10 border border-brand-cyan/20 px-4 py-2 rounded-2xl flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-brand-cyan/20 flex items-center justify-center">
            <DollarSign size={16} className="text-brand-cyan" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-brand-cyan/60">Total Earned</p>
            <p className="text-lg font-black text-white">₦{totalEarned.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Referral Card */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="p-8 bg-gradient-to-br from-brand-royal/20 to-transparent border-brand-royal/20 relative overflow-hidden group">
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-brand-cyan/10 rounded-full blur-3xl group-hover:bg-brand-cyan/20 transition-all duration-700" />
            
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-brand-cyan/10 border border-brand-cyan/20 flex items-center justify-center mb-6">
                <Gift size={28} className="text-brand-cyan" />
              </div>
              
              <h3 className="text-xl font-black text-white mb-2">Your Referral Link</h3>
              <p className="text-brand-silver/50 text-xs mb-6 leading-relaxed">
                Share this link with your friends. Once they sign up and fund their wallet, you'll instantly receive ₦100.
              </p>

              <div className="space-y-4">
                <div className="relative group/input">
                  <div className="absolute inset-0 bg-brand-cyan/5 rounded-xl blur opacity-0 group-hover/input:opacity-100 transition-opacity" />
                  <div className="relative flex items-center gap-2 p-1.5 bg-brand-midnight/50 border border-brand-royal/10 rounded-xl">
                    <input 
                      type="text" 
                      readOnly 
                      value={user?.referralCode}
                      className="flex-1 bg-transparent border-none text-xs font-mono font-bold text-brand-silver/80 px-3 focus:outline-none"
                    />
                    <button 
                      onClick={copyToClipboard}
                      className={`p-2.5 rounded-lg transition-all ${copied ? 'bg-green-500 text-white' : 'bg-brand-royal/20 text-brand-cyan hover:bg-brand-cyan hover:text-brand-midnight'}`}
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>

                <Button onClick={copyToClipboard} className="w-full h-12 text-xs uppercase tracking-widest font-black shadow-[0_0_30px_rgba(0,212,255,0.1)]">
                  Copy Invite Link
                </Button>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-brand-royal/10 bg-white/[0.02]">
            <div className="flex items-center gap-4 text-brand-silver/30">
              <Info size={16} />
              <p className="text-[10px] uppercase tracking-widest font-bold">How it works</p>
            </div>
            <ul className="mt-4 space-y-4">
              <Step number="1" text="Friend signs up using your code" />
              <Step number="2" text="They fund their wallet (min ₦100)" />
              <Step number="3" text="You get ₦100 instantly!" />
            </ul>
          </Card>
        </div>

        {/* Referrals List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black font-display uppercase tracking-widest text-white">Invite History</h2>
            <div className="flex items-center gap-2 text-brand-silver/40 text-[10px] font-black uppercase tracking-widest">
              <Users size={12} />
              {referrals.length} Total Invites
            </div>
          </div>

          <Card className="overflow-hidden border-brand-royal/10 bg-white/[0.02]">
            {referrals.length === 0 ? (
              <div className="p-20 text-center">
                <Users size={48} className="mx-auto text-brand-royal/20 mb-4" />
                <p className="text-brand-silver/30 text-sm">No referrals yet. Start sharing to earn!</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/5 text-[10px] uppercase tracking-widest text-brand-silver/40 font-black border-b border-brand-royal/10">
                    <th className="px-6 py-4">Referred User</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4 text-right">Bonus</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-royal/10">
                  {referrals.map((ref, idx) => (
                    <tr key={idx} className="hover:bg-white/[0.03] transition-colors">
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-white">{ref.referredName}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${ref.status === 'PAID' ? 'bg-green-500/10 text-green-400 border border-green-400/20' : 'bg-brand-gold/10 text-brand-gold border border-brand-gold/20'}`}>
                          {ref.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-brand-silver/30 font-medium">
                        {new Date(ref.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-black text-brand-cyan">₦{ref.bonusAmount}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}

function Step({ number, text }: { number: string; text: string }) {
  return (
    <li className="flex items-center gap-4">
      <div className="w-6 h-6 rounded-lg bg-brand-royal/10 border border-brand-royal/20 flex items-center justify-center text-[10px] font-black text-brand-cyan">
        {number}
      </div>
      <span className="text-xs text-brand-silver/60 font-medium">{text}</span>
    </li>
  )
}
