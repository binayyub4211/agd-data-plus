import { Link } from 'react-router-dom'
import { Shield, Zap, Lock, Twitter, Instagram, Facebook, Mail, Phone } from 'lucide-react'

const services = ['Buy Data', 'Airtime Top-Up', 'Electricity Bills', 'Cable TV', 'Exam PINs', 'Bulk SMS']
const company = [
  { name: 'About Us', href: '#about' },
  { name: 'Services', href: '#services' },
  { name: 'Blog', href: '#' },
  { name: 'Contact', href: '#' },
]
const legal = ['Privacy Policy', 'Terms of Service', 'Refund Policy', 'Security']

export function Footer() {
  return (
    <footer className="relative mt-24 border-t border-brand-royal/10 overflow-hidden">
      {/* Background Glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-brand-royal/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 md:px-8 py-16">
        {/* Top Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          {/* Brand Column */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <img src="/logo.png" alt="AGD" className="w-10 h-10 object-contain drop-shadow-[0_0_8px_rgba(26,79,219,0.5)]" />
              <span className="font-black text-white text-lg tracking-tight font-display">AGD DATA PLUS</span>
            </div>
            <p className="text-brand-silver/50 text-sm leading-relaxed mb-6">
              Nigeria's most trusted premium VTU & digital payment platform. Fast, secure, reliable.
            </p>
            <div className="flex gap-3">
              {[Twitter, Instagram, Facebook].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-9 h-9 rounded-xl bg-brand-royal/10 border border-brand-royal/20 flex items-center justify-center text-brand-silver/40 hover:text-brand-cyan hover:border-brand-cyan/40 transition-all"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-[0.2em] mb-6">Services</h4>
            <ul className="space-y-3">
              {services.map((s) => (
                <li key={s}>
                  <a href="#" className="text-brand-silver/50 hover:text-brand-cyan text-sm transition-colors">{s}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-[0.2em] mb-6">Company</h4>
            <ul className="space-y-3">
              {company.map((c) => (
                <li key={c.name}>
                  <a href={c.href} className="text-brand-silver/50 hover:text-brand-cyan text-sm transition-colors">{c.name}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-[0.2em] mb-6">Support</h4>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-brand-silver/50 text-sm">
                <Mail size={14} className="text-brand-cyan shrink-0" />
                agdamgagennet@gmail.com
              </li>
              <li className="flex items-center gap-3 text-brand-silver/50 text-sm">
                <Phone size={14} className="text-brand-cyan shrink-0" />
                +234 7064889585
              </li>
            </ul>
            <div className="mt-8 p-4 rounded-2xl bg-brand-royal/10 border border-brand-royal/20">
              <p className="text-brand-cyan text-xs font-bold uppercase tracking-widest mb-1">24/7 Support</p>
              <p className="text-brand-silver/40 text-xs">We're always here to help</p>
            </div>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="flex flex-wrap justify-center gap-6 mb-12 py-8 border-y border-brand-royal/10">
          {[
            { icon: Shield, label: 'SSL Secured' },
            { icon: Lock, label: 'AES-256 Encrypted' },
            { icon: Zap, label: 'Instant Delivery' },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2 text-brand-silver/30">
              <Icon size={14} className="text-brand-cyan" />
              <span className="text-xs font-bold uppercase tracking-widest">{label}</span>
            </div>
          ))}
        </div>

        {/* Bottom Row */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-brand-silver/25 text-xs">
          <p>© {new Date().getFullYear()} AGD Data Plus. All rights reserved.</p>
          <div className="flex gap-6">
            {legal.map((item) => (
              <a key={item} href="#" className="hover:text-brand-cyan transition-colors">{item}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
