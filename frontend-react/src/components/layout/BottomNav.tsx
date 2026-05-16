import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, Gift, User, ShieldAlert, History, Smartphone, LogIn, UserPlus, HelpCircle } from 'lucide-react'

export function BottomNav() {
  const location = useLocation()
  const userStr = localStorage.getItem('user')
  const user = userStr ? JSON.parse(userStr) : null
  const isAdmin = user?.role === 'ADMIN'
  const isLandingPage = location.pathname === '/'

  let navItems = []

  if (isLandingPage && !user) {
    // Landing Page Footer (Not logged in)
    navItems = [
      { path: '/auth/login',    label: 'Login',   icon: LogIn },
      { path: '/auth/register', label: 'Sign Up', icon: UserPlus },
    ]
  } else {
    // Dashboard / Logged In Footer
    navItems = [
      { path: '/dashboard',     label: 'Home',  icon: Home },
      { path: 'https://wa.me/2348000000000', label: 'Help',  icon: HelpCircle, isExternal: true },
      { path: '/referrals',     label: 'Earn',  icon: Gift },
    ]
    
    if (isAdmin) {
      navItems.push({ path: '/admin', label: 'Admin', icon: ShieldAlert })
    }
  }

  // Hide on desktop landing page (md:hidden handles desktop generally)
  // The user says: "this footer should not appear on the desktop landing page" -> already true via md:hidden
  
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-6 pb-6 pt-2 bg-gradient-to-t from-brand-midnight via-brand-midnight/90 to-transparent">
      <div className="bg-[#0D1323]/80 backdrop-blur-2xl border border-brand-royal/20 rounded-2xl h-16 flex items-center justify-around px-2 shadow-[0_-10px_40px_rgba(0,0,0,0.4)]">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path
          
          if (item.isExternal) {
            return (
              <a 
                key={item.label} 
                href={item.path}
                target="_blank"
                rel="noopener noreferrer"
                className="relative flex flex-col items-center justify-center flex-1 h-full"
              >
                <div className="relative z-10 text-brand-silver/30">
                  <item.icon size={20} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest mt-1 text-brand-silver/20">
                  {item.label}
                </span>
              </a>
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
  )
}
