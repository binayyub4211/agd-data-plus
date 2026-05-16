import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { WelcomeAnimation } from '@/components/auth/WelcomeAnimation'
import { User, Mail, Phone, Lock, Eye, EyeOff, ShieldCheck, Home } from 'lucide-react'

export function RegisterPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showWelcome, setShowWelcome] = useState(false)
  const [registeredName, setRegisteredName] = useState('')
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', password: '', referralCode: '',
  })

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api.post('/auth/register', formData)
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('refreshToken', res.data.refreshToken)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      setRegisteredName(formData.name)
      setShowWelcome(true)
    } catch (err: any) {
      const msg = err.response?.data?.error
      toast.error(typeof msg === 'string' ? msg : 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <AnimatePresence>
        {showWelcome && (
          <WelcomeAnimation
            name={registeredName}
            onComplete={() => navigate('/dashboard')}
          />
        )}
      </AnimatePresence>

      <main className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-brand-midnight">
        <div className="absolute top-8 left-8 z-20">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-brand-silver/50 hover:text-white hover:border-brand-cyan/30 transition-all text-xs font-black uppercase tracking-widest"
          >
            <Home size={14} />
            Home
          </button>
        </div>
        {/* Background orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-royal/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-brand-cyan/10 rounded-full blur-[100px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 w-full max-w-md"
        >
          {/* Logo & Heading */}
          <div className="text-center mb-8">
            <motion.img
              src="/logo.png"
              alt="AGD"
              className="w-16 h-16 object-contain mx-auto mb-5 drop-shadow-[0_0_15px_rgba(26,79,219,0.5)]"
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            />
            <h1 className="text-4xl font-black text-white font-display tracking-tight">Create Account</h1>
            <p className="text-brand-silver/50 mt-2 text-sm">Join AGD Data Plus — it's free</p>
          </div>

          <Card className="p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="relative">
                <User size={15} className="absolute left-4 top-1/2 translate-y-3 text-brand-silver/30 pointer-events-none" />
                <Input id="name" label="Full Name" placeholder="John Doe" required
                  value={formData.name} onChange={update('name')}
                  className="pl-10" />
              </div>

              <div className="relative">
                <Mail size={15} className="absolute left-4 top-1/2 translate-y-3 text-brand-silver/30 pointer-events-none" />
                <Input id="email" type="email" label="Email Address" placeholder="name@example.com" required
                  value={formData.email} onChange={update('email')}
                  className="pl-10" />
              </div>

              <div className="relative">
                <Phone size={15} className="absolute left-4 top-1/2 translate-y-3 text-brand-silver/30 pointer-events-none" />
                <Input id="phone" label="Phone Number" placeholder="08012345678" required
                  value={formData.phone} onChange={update('phone')}
                  className="pl-10" />
              </div>

              <div className="relative">
                <Lock size={15} className="absolute left-4 top-1/2 translate-y-3 text-brand-silver/30 pointer-events-none" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  label="Password"
                  placeholder="Min. 8 characters"
                  required
                  value={formData.password}
                  onChange={update('password')}
                  className="pl-10 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 translate-y-3 text-brand-silver/30 hover:text-brand-cyan transition-colors"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              <div className="relative">
                <ShieldCheck size={15} className="absolute left-4 top-1/2 translate-y-3 text-brand-silver/30 pointer-events-none" />
                <Input
                  id="referralCode"
                  label="Referral Code (Optional)"
                  placeholder="e.g. 123e4567-e89b..."
                  value={formData.referralCode}
                  onChange={update('referralCode')}
                  className="pl-10"
                />
              </div>

              <Button type="submit" disabled={loading} className="mt-2">
                {loading ? 'Creating your account...' : 'Create Account'}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-brand-silver/50">
              Already have an account?{' '}
              <Link to="/auth/login" className="text-brand-cyan font-bold hover:underline">
                Sign in
              </Link>
            </div>
          </Card>

          {/* Security badge */}
          <div className="flex items-center justify-center gap-2 mt-6 text-brand-silver/25">
            <ShieldCheck size={13} />
            <span className="text-[10px] uppercase tracking-widest">256-bit AES encrypted</span>
          </div>
        </motion.div>
      </main>
    </>
  )
}
