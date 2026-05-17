import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Mail, ArrowLeft, Home } from 'lucide-react'

export function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.includes('@')) {
      return toast.error('Please enter a valid email address.');
    }
    setLoading(true)
    try {
      const res = await api.post('/auth/forgot-password', { email })
      toast.success(res.data.message || 'If that email exists, a reset link has been sent.')
      setTimeout(() => navigate('/auth/login'), 2000)
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-brand-midnight">
      <div className="absolute top-8 left-8 z-20 flex gap-4">
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-brand-silver/50 hover:text-white hover:border-brand-cyan/30 transition-all text-xs font-black uppercase tracking-widest"
        >
          <Home size={14} />
          Home
        </button>
        <button 
          onClick={() => navigate('/auth/login')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-brand-silver/50 hover:text-white hover:border-brand-cyan/30 transition-all text-xs font-black uppercase tracking-widest"
        >
          <ArrowLeft size={14} />
          Back to Login
        </button>
      </div>

      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-royal/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-brand-cyan/10 rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <motion.img
            src="/logo.png"
            alt="AGD"
            className="w-16 h-16 object-contain mx-auto mb-5 drop-shadow-[0_0_15px_rgba(26,79,219,0.5)]"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />
          <h1 className="text-4xl font-black text-white font-display tracking-tight">Reset Password</h1>
          <p className="text-brand-silver/50 mt-2 text-sm">Enter your email to receive a reset link</p>
        </div>

        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="relative">
              <Mail size={15} className="absolute left-4 top-1/2 translate-y-3 text-brand-silver/30 pointer-events-none" />
              <Input id="email" type="email" label="Email Address" placeholder="name@example.com" required
                value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" />
            </div>

            <Button type="submit" disabled={loading} className="mt-2 w-full">
              {loading ? 'Sending link...' : 'Send Reset Link'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-brand-silver/50">
            Remember your password?{' '}
            <Link to="/auth/login" className="text-brand-cyan font-bold hover:underline">Log in</Link>
          </div>
        </Card>
      </motion.div>
    </main>
  )
}
