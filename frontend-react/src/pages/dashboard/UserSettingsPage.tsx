import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { 
  User, Mail, Lock, Camera, Palette, Save, 
  ArrowLeft, CheckCircle2, Moon, Sun, Monitor
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function UserSettingsPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Forms
  const [emailData, setEmailData] = useState({ newEmail: '', password: '' })
  const [passData, setPassData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [selectedTheme, setSelectedTheme] = useState('DARK')
  const [profilePic, setProfilePic] = useState('')

  const fetchProfile = async () => {
    try {
      const res = await api.get('/auth/me')
      setUser(res.data)
      localStorage.setItem('user', JSON.stringify(res.data)) // Sync with local storage for header/footer
      setSelectedTheme(res.data.theme || 'DARK')
      setProfilePic(res.data.profilePicture || '')
    } catch {
      toast.error('Session expired')
      navigate('/auth/login')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchProfile() }, [])

  const handleUpdateSettings = async () => {
    setSaving(true)
    try {
      await api.put('/user/settings', { 
        theme: selectedTheme,
        profilePicture: profilePic 
      })
      toast.success('Preferences updated!')
      fetchProfile()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (passData.newPassword !== passData.confirmPassword) {
      return toast.error('Passwords do not match')
    }
    setSaving(true)
    try {
      await api.put('/user/password', {
        currentPassword: passData.currentPassword,
        newPassword: passData.newPassword
      })
      toast.success('Password changed successfully')
      setPassData({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Password reset failed')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.put('/user/email', {
        newEmail: emailData.newEmail,
        password: emailData.password
      })
      toast.success('Email updated successfully!')
      setEmailData({ newEmail: '', password: '' })
      fetchProfile()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Email update failed')
    } finally {
      setSaving(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 1024 * 1024) return toast.error('File too large (Max 1MB)')
      const reader = new FileReader()
      reader.onloadend = () => {
        setProfilePic(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-brand-midnight flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-brand-royal/30 border-t-brand-cyan rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-brand-midnight text-white pb-32">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-brand-royal/10 bg-brand-midnight/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
            <ArrowLeft size={20} className="text-brand-silver/50" />
          </button>
          <h1 className="font-black text-xs uppercase tracking-[0.3em] text-white">Account Settings</h1>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Left: Profile Summary */}
          <div className="space-y-6">
            <Card className="p-8 text-center border-brand-royal/20 bg-brand-royal/5">
              <div className="relative w-32 h-32 mx-auto mb-6 group">
                <div className="absolute inset-0 rounded-full border-2 border-brand-cyan/20 border-dashed animate-[spin_10s_linear_infinite]" />
                <div className="absolute inset-2 rounded-full overflow-hidden border-2 border-brand-cyan shadow-[0_0_20px_rgba(0,212,255,0.3)] bg-brand-midnight">
                  {profilePic ? (
                    <img src={profilePic} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-brand-cyan/20">
                      <User size={48} />
                    </div>
                  )}
                </div>
                <label className="absolute bottom-0 right-0 p-2.5 bg-brand-cyan text-brand-midnight rounded-full cursor-pointer shadow-lg hover:scale-110 transition-transform active:scale-95">
                  <Camera size={16} />
                  <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                </label>
              </div>
              <h2 className="text-xl font-black font-display">{user?.name}</h2>
              <p className="text-xs text-brand-silver/30 font-medium uppercase tracking-widest mt-1">{user?.role}</p>
            </Card>

            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-brand-silver/20 px-2">Theme Preference</p>
              <div className="grid grid-cols-3 gap-2">
                {['LIGHT', 'DARK', 'SYSTEM'].map(t => (
                  <button 
                    key={t}
                    onClick={() => setSelectedTheme(t)}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                      selectedTheme === t 
                        ? 'bg-brand-cyan/10 border-brand-cyan text-brand-cyan shadow-[0_0_15px_rgba(0,212,255,0.1)]' 
                        : 'bg-white/5 border-brand-royal/10 text-brand-silver/30 hover:border-brand-royal/30'
                    }`}
                  >
                    {t === 'LIGHT' ? <Sun size={14} /> : t === 'DARK' ? <Moon size={14} /> : <Monitor size={14} />}
                    <span className="text-[8px] font-black uppercase">{t}</span>
                  </button>
                ))}
              </div>
            </div>

            <Button 
              className="w-full bg-brand-cyan hover:bg-brand-cyan/80 text-brand-midnight font-black shadow-[0_0_20px_rgba(0,212,255,0.2)]"
              onClick={handleUpdateSettings}
              loading={saving}
            >
              <Save size={16} className="mr-2" />
              Save Preferences
            </Button>
          </div>

          {/* Right: Security & Data */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Update Password */}
            <Card className="p-8 border-brand-royal/10">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-brand-royal/10 rounded-lg text-brand-cyan">
                  <Lock size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest">Security</h3>
                  <p className="text-xs text-brand-silver/20">Change your account password</p>
                </div>
              </div>
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <Input 
                  label="Current Password" 
                  type="password" 
                  value={passData.currentPassword}
                  onChange={e => setPassData({...passData, currentPassword: e.target.value})}
                  placeholder="••••••••" 
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input 
                    label="New Password" 
                    type="password" 
                    value={passData.newPassword}
                    onChange={e => setPassData({...passData, newPassword: e.target.value})}
                    placeholder="Min 8 characters" 
                  />
                  <Input 
                    label="Confirm Password" 
                    type="password" 
                    value={passData.confirmPassword}
                    onChange={e => setPassData({...passData, confirmPassword: e.target.value})}
                    placeholder="Repeat password" 
                  />
                </div>
                <Button type="submit" variant="outline" className="w-full border-brand-royal/20" loading={saving}>Update Password</Button>
              </form>
            </Card>

            {/* Update Email */}
            <Card className="p-8 border-brand-royal/10">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-brand-royal/10 rounded-lg text-brand-cyan">
                  <Mail size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest">Email Address</h3>
                  <p className="text-xs text-brand-silver/20">Update your contact email</p>
                </div>
              </div>
              <form onSubmit={handleUpdateEmail} className="space-y-4">
                <Input 
                  label="New Email Address" 
                  type="email" 
                  value={emailData.newEmail}
                  onChange={e => setEmailData({...emailData, newEmail: e.target.value})}
                  placeholder="you@example.com" 
                />
                <Input 
                  label="Confirm with Password" 
                  type="password" 
                  value={emailData.password}
                  onChange={e => setEmailData({...emailData, password: e.target.value})}
                  placeholder="Enter current password" 
                />
                <Button type="submit" variant="outline" className="w-full border-brand-royal/20" loading={saving}>Change Email</Button>
              </form>
            </Card>

            <div className="p-6 bg-red-500/5 border border-red-500/10 rounded-2xl flex items-start gap-4">
               <div className="p-2 bg-red-500/10 rounded-lg text-red-500 shrink-0">
                 <CheckCircle2 size={16} />
               </div>
               <div>
                 <p className="text-xs font-bold text-white">Identity Verified</p>
                 <p className="text-[10px] text-brand-silver/30 leading-relaxed mt-1">
                   Your account was registered on {new Date(user?.createdAt).toLocaleDateString()}. Changes to core account data may require 2FA verification.
                 </p>
               </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
