import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Menu, X, Shield } from 'lucide-react'

const navLinks = [
  { name: 'Home', href: '/' },
  { name: 'About Us', href: '#about' },
  { name: 'Services', href: '#services' },
]

export function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close on resize to desktop
  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setMobileOpen(false) }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const handleAnchor = (href: string) => {
    setMobileOpen(false)
    if (href.startsWith('#')) {
      document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' })
    } else {
      navigate(href)
    }
  }

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-[60] transition-all duration-500 ${
          scrolled || mobileOpen
            ? 'bg-brand-midnight/95 backdrop-blur-xl py-4 border-b border-brand-royal/20 shadow-[0_4px_30px_rgba(0,0,0,0.4)]'
            : 'bg-transparent py-6'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group z-[70]">
            <motion.img
              src="/logo.png"
              alt="AGD Logo"
              className="w-10 h-10 object-contain drop-shadow-[0_0_10px_rgba(26,79,219,0.5)]"
              whileHover={{ scale: 1.1, rotateY: 180 }}
              transition={{ duration: 0.5 }}
            />
            <span className="text-xl md:text-2xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-brand-silver to-brand-gold font-display">
              AGD DATA PLUS
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((l) => (
              <button
                key={l.name}
                onClick={() => handleAnchor(l.href)}
                className="text-brand-silver/70 hover:text-brand-cyan transition-colors text-xs font-bold uppercase tracking-[0.22em]"
              >
                {l.name}
              </button>
            ))}
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              to="/auth/login"
              className="text-brand-silver hover:text-white transition-colors font-semibold text-sm"
            >
              Login
            </Link>
            <Link
              to="/auth/register"
              className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-brand-royal to-brand-cyan text-white font-black text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(26,79,219,0.35)] hover:shadow-[0_0_30px_rgba(0,212,255,0.4)] hover:scale-105 transition-all active:scale-95"
            >
              Sign Up Free
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden text-white z-[70] p-1"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
      </header>

      {/* Mobile Overlay */}
      <motion.div
        initial={false}
        animate={mobileOpen ? { x: 0, opacity: 1 } : { x: '100%', opacity: 0 }}
        transition={{ type: 'tween', duration: 0.35 }}
        className="fixed inset-0 z-[65] bg-brand-midnight flex flex-col items-center justify-center gap-10 md:hidden"
      >
        {/* Subtle background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-brand-royal/20 rounded-full blur-[80px]" />
        </div>

        <img src="/logo.png" alt="AGD" className="w-16 h-16 object-contain mb-2 drop-shadow-[0_0_12px_rgba(0,212,255,0.4)]" />

        {navLinks.map((l, i) => (
          <motion.button
            key={l.name}
            initial={{ opacity: 0, y: 20 }}
            animate={mobileOpen ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ delay: i * 0.07 }}
            onClick={() => handleAnchor(l.href)}
            className="text-3xl font-black text-brand-silver hover:text-brand-cyan transition-colors uppercase tracking-widest font-display"
          >
            {l.name}
          </motion.button>
        ))}

        <div className="flex flex-col items-center gap-4 mt-4 w-full px-10">
          <Link
            to="/auth/login"
            onClick={() => setMobileOpen(false)}
            className="w-full py-4 rounded-2xl border border-brand-royal/40 text-center text-white font-bold hover:bg-brand-royal/10 transition-all"
          >
            Login
          </Link>
          <Link
            to="/auth/register"
            onClick={() => setMobileOpen(false)}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-brand-royal to-brand-cyan text-white font-black text-center uppercase tracking-widest shadow-[0_0_25px_rgba(26,79,219,0.4)] active:scale-95 transition-all"
          >
            Sign Up Free
          </Link>
        </div>

        <div className="flex items-center gap-2 text-brand-silver/20 text-xs mt-2">
          <Shield size={12} />
          <span className="uppercase tracking-widest">256-bit AES Encrypted</span>
        </div>
      </motion.div>
    </>
  )
}
