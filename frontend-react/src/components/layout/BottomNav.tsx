import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Home, Gift, LogIn, UserPlus, HelpCircle, LogOut, MessageCircle, X, ShieldAlert } from 'lucide-react'

export function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()
  const [isHelpOpen, setIsHelpOpen] = useState(false)

  const userStr = localStorage.getItem('user')
  const user = userStr ? JSON.parse(userStr) : null
  const isAdmin = user?.role === 'ADMIN'
  const isLandingPage = location.pathname === '/'

  let navItems = []

  if (!user) {
    if (isLandingPage) {
      navItems = [
        { path: '/auth/login',    label: 'Login',   icon: LogIn },
        { path: '/auth/register', label: 'Sign Up', icon: UserPlus },
      ]
    } else {
      return null
    }
  } else {
    // Dashboard / Logged In Footer
    navItems = [
      { path: '/dashboard', label: 'Home', icon: Home },
      { label: 'Help', icon: HelpCircle, action: () => setIsHelpOpen(true) },
      { path: '/referrals', label: 'Earn', icon: Gift },
      { label: 'Logout', icon: LogOut, action: () => {
          if (window.confirm('Are you sure you want to logout?')) {
            localStorage.clear()
            navigate('/auth/login')
          }
        } 
      }
    ]
    
    if (isAdmin) {
      navItems.push({ path: '/admin', label: 'Admin', icon: ShieldAlert })
    }
  }

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-6 pb-6 pt-2 bg-gradient-to-t from-brand-midnight via-brand-midnight/90 to-transparent">
        <div className="bg-[#0D1323]/80 backdrop-blur-2xl border border-brand-royal/20 rounded-2xl h-16 flex items-center justify-around px-2 shadow-[0_-10px_40px_rgba(0,0,0,0.4)]">
          {navItems.map((item: any) => {
            const isActive = item.path ? location.pathname === item.path : false
            
            if (item.action) {
              return (
                <button 
                  key={item.label} 
                  onClick={item.action}
                  className="relative flex flex-col items-center justify-center flex-1 h-full"
                >
                  <div className="relative z-10 transition-colors duration-300 text-brand-silver/30 hover:text-brand-cyan">
                    <item.icon size={20} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest mt-1 text-brand-silver/20">
                    {item.label}
                  </span>
                </button>
              )
            }

            return (
              <Link 
                key={item.path} 
                to={item.path}
                className="relative flex flex-col items-center justify-center flex-1 h-full"
              >
                <div className={`relative z-10 transition-colors duration-300 ${isActive ? 'text-brand-cyan' : 'text-brand-silver/30'}`}>
                  <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest mt-1 transition-colors duration-300 ${isActive ? 'text-brand-cyan' : 'text-brand-silver/20'}`}>
                  {item.label}
                </span>
                
                {isActive && (
                  <motion.div 
                    layoutId="bottomNavGlow"
                    className="absolute inset-x-2 inset-y-2 bg-brand-cyan/5 rounded-xl -z-0"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Help Modal */}
      <AnimatePresence>
        {isHelpOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsHelpOpen(false)}
              className="absolute inset-0 bg-brand-midnight/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-[#0D1323] border border-brand-royal/20 rounded-3xl p-6 shadow-2xl z-10 text-white"
            >
              <button 
                onClick={() => setIsHelpOpen(false)}
                className="absolute top-4 right-4 p-1.5 bg-white/5 hover:bg-white/10 rounded-full text-brand-silver/50 hover:text-white transition-all"
              >
                <X size={16} />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-brand-cyan/10 border border-brand-cyan/20 flex items-center justify-center text-brand-cyan">
                  <HelpCircle size={20} />
                </div>
                <div>
                  <h3 className="text-md font-black uppercase tracking-wider">Support Center</h3>
                  <p className="text-[10px] text-brand-silver/40 font-bold uppercase tracking-widest">AGD Data Plus Support</p>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div className="p-4 bg-white/5 border border-white/5 rounded-2xl">
                  <h4 className="text-xs font-bold text-brand-cyan mb-1">Frequently Asked Questions</h4>
                  <div className="space-y-2 text-[11px] text-brand-silver/70">
                    <p><strong>Q: How do I fund my wallet?</strong><br />A: Copy your virtual account number from the dashboard and transfer money to it. It credits automatically.</p>
                    <p><strong>Q: What if my transaction fails?</strong><br />A: Failed transactions are automatically refunded to your wallet balance instantly.</p>
                  </div>
                </div>

                <div className="p-4 bg-white/5 border border-white/5 rounded-2xl">
                  <h4 className="text-xs font-bold text-brand-gold mb-1">Downtime or Issues?</h4>
                  <p className="text-[11px] text-brand-silver/70">Our automated system monitors provider API nodes and failover routes to ensure 99.9% uptime.</p>
                </div>
              </div>

              <a 
                href="https://wa.me/2348030000000"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-[0_4px_15px_rgba(37,211,102,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <MessageCircle size={16} />
                Chat on WhatsApp
              </a>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
