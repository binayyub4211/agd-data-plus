import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { 
  User, Mail, Phone, Shield, Calendar, 
  ArrowLeft, Wallet, Settings as SettingsIcon
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function ProfilePage() {
  const navigate = useNavigate()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async () => {
    try {
      const res = await api.get('/auth/me')
      setUser(res.data)
    } catch {
      toast.error('Session expired')
      navigate('/auth/login')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchProfile() }, [])

  if (loading) return (
    <div className="min-h-screen bg-brand-midnight flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-brand-royal/30 border-t-brand-cyan rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-brand-midnight text-white pb-32">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-brand-royal/10 bg-brand-midnight/80 backdrop-blur-xl">
        <div className="max-w-2xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
              <ArrowLeft size={20} className="text-brand-silver/50" />
            </button>
            <h1 className="font-black text-xs uppercase tracking-[0.3em] text-white">Your Profile</h1>
          </div>
          <button 
            onClick={() => navigate('/dashboard/settings')}
            className="p-2 bg-brand-royal/10 rounded-xl text-brand-cyan hover:bg-brand-royal/20 transition-all"
          >
            <SettingsIcon size={20} />
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-10 space-y-8">
        {/* Profile Card */}
        <Card className="p-10 text-center border-brand-royal/20 bg-gradient-to-b from-brand-royal/10 to-transparent relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-cyan to-transparent opacity-50" />
          
          <div className="relative w-40 h-40 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-2 border-brand-cyan/20 animate-[pulse_3s_infinite]" />
            <div className="absolute inset-2 rounded-full overflow-hidden border-2 border-brand-cyan shadow-[0_0_30px_rgba(0,212,255,0.2)] bg-brand-midnight">
              {user?.profilePicture ? (
                <img src={user.profilePicture} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-brand-cyan/20">
                  <User size={64} />
                </div>
              )}
            </div>
          </div>

          <h2 className="text-3xl font-black font-display tracking-tight text-white mb-2">{user?.name}</h2>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan text-[10px] font-black uppercase tracking-widest">
            <Shield size={12} />
            Verified {user?.role} Account
          </div>
        </Card>

        {/* Info Grid */}
        <div className="grid grid-cols-1 gap-4">
          <InfoRow icon={Mail} label="Email Address" value={user?.email} />
          <InfoRow icon={Phone} label="Phone Number" value={user?.phone} />
          <InfoRow icon={Wallet} label="Wallet Balance" value={`₦${(user?.wallet?.balance ?? 0).toLocaleString()}.00`} />
          <InfoRow icon={Calendar} label="Member Since" value={new Date(user?.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })} />
        </div>

        <div className="pt-6">
          <Button 
            className="w-full h-14 bg-white text-brand-midnight hover:bg-brand-silver font-black uppercase tracking-widest rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.1)]"
            onClick={() => navigate('/dashboard/settings')}
          >
            Edit Profile Settings
          </Button>
        </div>

        <p className="text-center text-[10px] text-brand-silver/20 uppercase tracking-[0.4em] font-black">
          Secured by AGD Data Plus Node
        </p>
      </div>
    </div>
  )
}

function InfoRow({ icon: Icon, label, value }: any) {
  return (
    <Card className="p-6 border-brand-royal/10 bg-white/[0.02] flex items-center justify-between group hover:border-brand-royal/30 transition-colors">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-brand-royal/10 flex items-center justify-center text-brand-silver/40 group-hover:text-brand-cyan transition-colors">
          <Icon size={18} />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-brand-silver/20">{label}</p>
          <p className="text-sm font-bold text-white mt-0.5">{value || 'Not set'}</p>
        </div>
      </div>
    </Card>
  )
}
