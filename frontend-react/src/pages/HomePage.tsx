import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import {
  ArrowRight, Shield, Zap, Wifi, Smartphone, Bolt,
  Monitor, Star, ChevronRight
} from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.55, ease: 'easeOut' } }),
}

const SERVICES = [
  { icon: Wifi,      name: 'Data Bundles',   desc: 'All networks, instant delivery',    color: 'from-blue-500/20 to-brand-royal/10',  border: 'border-blue-500/20'  },
  { icon: Smartphone,name: 'Airtime Top-Up', desc: 'MTN, Airtel, Glo, 9mobile',         color: 'from-green-500/20 to-emerald-500/10', border: 'border-green-500/20' },
  { icon: Zap,       name: 'Electricity',    desc: 'IKEDC, EKEDC, AEDC & more',         color: 'from-brand-gold/20 to-yellow-500/10', border: 'border-brand-gold/20'},
  { icon: Monitor,   name: 'Cable TV',       desc: 'DSTV, GOtv, Startimes',             color: 'from-purple-500/20 to-violet-500/10', border: 'border-purple-500/20'},
]

const STATS = [
  { value: '500K+', label: 'Active Users'      },
  { value: '99.9%', label: 'Uptime'            },
  { value: '<5s',   label: 'Avg Delivery'      },
  { value: '₦2B+',  label: 'Transactions Done' },
]

const TESTIMONIALS = [
  { name: 'Chukwuemeka A.', role: 'Business Owner', text: 'AGD Data Plus is the fastest VTU platform I have ever used. My customers are always satisfied.' },
  { name: 'Fatima B.',      role: 'Reseller',       text: 'I\'ve been reselling for 2 years and the uptime is incredible. Their support is top-notch.' },
  { name: 'David O.',       role: 'Student',        text: 'Super affordable data plans and the wallet funding is seamless via bank transfer!' },
]

export function HomePage() {
  return (
    <div className="bg-brand-midnight">
      <Header />

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24 pb-20">
        {/* Ambient blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.3, 0.15] }}
            transition={{ duration: 8, repeat: Infinity }}
            className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-brand-royal rounded-full blur-[140px]"
          />
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [0.1, 0.2, 0.1] }}
            transition={{ duration: 10, repeat: Infinity, delay: 2 }}
            className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-brand-cyan rounded-full blur-[120px]"
          />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
          {/* Pill badge */}
          <motion.div
            variants={fadeUp} initial="hidden" animate="show"
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-brand-royal/15 border border-brand-royal/30 text-brand-cyan text-xs font-black uppercase tracking-widest mb-10"
          >
            <span className="w-2 h-2 rounded-full bg-brand-cyan animate-pulse" />
            Nigeria's #1 Premium VTU Platform
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={fadeUp} custom={1} initial="hidden" animate="show"
            className="text-5xl sm:text-6xl md:text-8xl font-black tracking-tighter leading-none text-white font-display mb-6"
          >
            Power Your{' '}
            <span className="shimmer-text">Digital Life</span>
            <br />Instantly.
          </motion.h1>

          <motion.p
            variants={fadeUp} custom={2} initial="hidden" animate="show"
            className="text-brand-silver/60 text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed"
          >
            Buy data, top up airtime, pay electricity and cable bills — all in one secure, blazing-fast platform built for Nigerians.
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={fadeUp} custom={3} initial="hidden" animate="show"
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              to="/auth/register"
              className="group inline-flex items-center justify-center gap-3 px-10 py-5 rounded-2xl bg-gradient-to-r from-brand-royal to-brand-cyan text-white font-black text-sm uppercase tracking-widest shadow-[0_0_40px_rgba(26,79,219,0.4)] hover:shadow-[0_0_60px_rgba(0,212,255,0.5)] hover:scale-105 transition-all"
            >
              Get Started Free
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="#services"
              className="inline-flex items-center justify-center gap-2 px-10 py-5 rounded-2xl border border-white/10 text-white font-bold text-sm uppercase tracking-widest hover:bg-white/5 transition-all"
            >
              See Services
              <ChevronRight size={16} />
            </a>
          </motion.div>

          {/* Floating logo */}
          <motion.div
            animate={{ y: [0, -16, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            className="mt-20 mx-auto w-32 h-32 relative"
          >
            <div className="absolute inset-0 bg-brand-royal/20 rounded-full blur-2xl" />
            <img src="/logo.png" alt="AGD Logo" className="relative w-full h-full object-contain drop-shadow-[0_0_40px_rgba(0,212,255,0.4)]" />
            {/* Reflection */}
            <div className="absolute top-full left-0 w-full h-16 opacity-20 scale-y-[-0.4] blur-sm pointer-events-none">
              <img src="/logo.png" alt="" className="w-full h-full object-contain" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="py-20 border-y border-brand-royal/10">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((s, i) => (
              <motion.div
                key={s.label}
                variants={fadeUp} custom={i} initial="hidden"
                whileInView="show" viewport={{ once: true }}
                className="text-center"
              >
                <p className="text-4xl md:text-5xl font-black text-white font-display">{s.value}</p>
                <p className="text-brand-silver/40 text-xs uppercase tracking-widest mt-2 font-bold">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SERVICES ── */}
      <section id="services" className="py-28 max-w-7xl mx-auto px-4">
        <motion.div
          variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-brand-cyan text-xs font-black uppercase tracking-[0.3em] mb-4">What We Offer</p>
          <h2 className="text-4xl md:text-5xl font-black text-white font-display tracking-tight">
            Every Service You Need
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {SERVICES.map((svc, i) => (
            <motion.div
              key={svc.name}
              variants={fadeUp} custom={i} initial="hidden" whileInView="show" viewport={{ once: true }}
              whileHover={{ y: -8 }}
              className={`group p-8 rounded-3xl bg-gradient-to-b ${svc.color} border ${svc.border} backdrop-blur-sm cursor-pointer transition-all`}
            >
              <div className="w-14 h-14 rounded-2xl bg-white/5 group-hover:bg-white/10 transition-all flex items-center justify-center mb-6">
                <svc.icon className="text-white/60 group-hover:text-white transition-colors" size={26} />
              </div>
              <h3 className="text-white font-black text-lg mb-2 font-display">{svc.name}</h3>
              <p className="text-brand-silver/40 text-sm leading-relaxed">{svc.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── SECURITY SECTION ── */}
      <section id="about" className="py-28 max-w-7xl mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}>
            <p className="text-brand-cyan text-xs font-black uppercase tracking-[0.3em] mb-4">Why Trust Us</p>
            <h2 className="text-4xl md:text-5xl font-black text-white leading-tight mb-8 font-display">
              Bank-Grade Security.<br />Lightning Speed.
            </h2>
            <div className="space-y-6">
              {[
                { icon: Shield, title: 'AES-256 Encryption', desc: 'Every transaction and piece of data is protected with bank-grade encryption.' },
                { icon: Zap,    title: 'Instant Processing',  desc: 'Sub-5 second delivery on data, airtime, and bill payments.' },
                { icon: Star,   title: 'Trusted by 500K+',   desc: 'Nigerians from Lagos to Abuja trust us with their digital payments daily.' },
              ].map(({ icon: I, title, desc }) => (
                <div key={title} className="flex gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-brand-royal/10 border border-brand-royal/20 flex items-center justify-center shrink-0">
                    <I size={20} className="text-brand-cyan" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold mb-1">{title}</h4>
                    <p className="text-brand-silver/40 text-sm leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            variants={fadeUp} custom={1} initial="hidden" whileInView="show" viewport={{ once: true }}
            className="relative hidden md:block"
          >
            <div className="absolute inset-0 bg-brand-royal/10 rounded-3xl blur-3xl" />
            <div className="relative grid grid-cols-2 gap-4">
              {['Fast', 'Secure', 'Reliable', 'Affordable'].map((word, i) => (
                <motion.div
                  key={word}
                  whileHover={{ scale: 1.05 }}
                  className="aspect-square rounded-3xl bg-gradient-to-br from-brand-royal/20 to-brand-midnight border border-brand-royal/20 flex items-center justify-center"
                >
                  <span className="text-2xl font-black text-white/80 font-display">{word}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-28 max-w-7xl mx-auto px-4">
        <motion.div
          variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-brand-cyan text-xs font-black uppercase tracking-[0.3em] mb-4">Testimonials</p>
          <h2 className="text-4xl md:text-5xl font-black text-white font-display">Loved by Nigerians</h2>
        </motion.div>
        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              variants={fadeUp} custom={i} initial="hidden" whileInView="show" viewport={{ once: true }}
              className="p-8 rounded-3xl bg-white/[0.03] border border-white/[0.06] hover:border-brand-royal/30 transition-all"
            >
              <div className="flex gap-1 mb-5">
                {[...Array(5)].map((_, j) => <Star key={j} size={14} className="text-brand-gold fill-brand-gold" />)}
              </div>
              <p className="text-brand-silver/70 text-sm leading-relaxed mb-6">"{t.text}"</p>
              <div>
                <p className="text-white font-bold">{t.name}</p>
                <p className="text-brand-silver/30 text-xs">{t.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="py-20 max-w-5xl mx-auto px-4">
        <motion.div
          variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
          className="relative rounded-3xl overflow-hidden text-center p-16 border border-brand-royal/20 bg-gradient-to-br from-brand-royal/20 to-brand-midnight"
        >
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-64 bg-brand-royal/20 rounded-full blur-[80px]" />
          </div>
          <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl font-black text-white font-display mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-brand-silver/60 mb-10 max-w-xl mx-auto">
              Join over 500,000 Nigerians who trust AGD Data Plus for fast and secure digital payments.
            </p>
            <Link
              to="/auth/register"
              className="inline-flex items-center gap-3 px-12 py-5 rounded-2xl bg-gradient-to-r from-brand-royal to-brand-cyan text-white font-black text-sm uppercase tracking-widest shadow-[0_0_40px_rgba(26,79,219,0.4)] hover:scale-105 transition-all"
            >
              Create Free Account <ArrowRight size={18} />
            </Link>
          </div>
        </motion.div>
      </section>

      <Footer />
    </div>
  )
}
