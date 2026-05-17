import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Lock, Eye, EyeOff, Home } from 'lucide-react'

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, color: 'bg-brand-silver/20', text: '' })

  useEffect(() => {
    if (!token) {
      toast.error('Invalid or missing reset token.')
      navigate('/auth/login')
    }
  }, [token, navigate])

  const validatePassword = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Za-z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    let color = 'bg-brand-silver/20';
    let text = '';
    if (pass.length === 0) { color = 'bg-brand-silver/20'; text = ''; }
    else if (score <= 2) { color = 'bg-red-500'; text = 'Weak'; }
    else if (score === 3) { color = 'bg-yellow-500'; text = 'Good'; }
    else if (score === 4) { color = 'bg-green-500'; text = 'Strong'; }

    setPasswordStrength({ score, color, text });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPassword(val);
    validatePassword(val);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      return toast.error('Passwords do not match.')
    }
    if (passwordStrength.score < 3) {
      return toast.error('Password is too weak. Please include letters, numbers, and special characters.');
    }

    setLoading(true)
    try {
      const res = await api.post('/auth/reset-password', { token, password })
      toast.success(res.data.message || 'Password reset successfully.')
      navigate('/auth/login')
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to reset password. The token may be expired.')
    } finally {
      setLoading(false)
    }
  }

  return (
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
          <h1 className="text-4xl font-black text-white font-display tracking-tight">Set New Password</h1>
          <p className="text-brand-silver/50 mt-2 text-sm">Choose a strong password for your account</p>
        </div>

        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="relative">
              <Lock size={15} className="absolute left-4 top-1/2 translate-y-3 text-brand-silver/30 pointer-events-none" />
              <Input
                id="password" type={showPassword ? 'text' : 'password'}
                label="New Password" placeholder="Min. 8 characters" required
                value={password} onChange={handlePasswordChange}
                className="pl-10 pr-12"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 translate-y-3 text-brand-silver/30 hover:text-brand-cyan transition-colors">
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            
            {password.length > 0 && (
              <div className="mt-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-brand-silver/50">Password Strength</span>
                  <span className={`text-xs font-bold ${passwordStrength.color.replace('bg-', 'text-')}`}>
                    {passwordStrength.text}
                  </span>
                </div>
                <div className="flex gap-1 h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className={`h-full ${passwordStrength.color} transition-all duration-300`} style={{ width: `${(passwordStrength.score / 4) * 100}%` }} />
                </div>
              </div>
            )}

            <div className="relative">
              <Lock size={15} className="absolute left-4 top-1/2 translate-y-3 text-brand-silver/30 pointer-events-none" />
              <Input
                id="confirmPassword" type={showPassword ? 'text' : 'password'}
                label="Confirm Password" placeholder="Must match new password" required
                value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-10 pr-12"
              />
            </div>

            <Button type="submit" disabled={loading} className="mt-2 w-full">
              {loading ? 'Updating Password...' : 'Reset Password'}
            </Button>
          </form>
        </Card>
      </motion.div>
    </main>
  )
}
