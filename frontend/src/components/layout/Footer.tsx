import Link from "next/link";
import { Facebook, Twitter, Instagram, Mail, Phone } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-[#050810] border-t border-brand-royal/10 pt-20 pb-10 px-4 md:px-6 overflow-hidden relative">
      {/* Background Decor */}
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-brand-royal/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 relative z-10">
        {/* Brand Column */}
        <div className="col-span-1 md:col-span-1">
          <div className="flex items-center gap-2 mb-6">
            <img src="/logo.png" alt="AGD Logo" className="w-10 h-10 object-contain" />
            <span className="text-xl font-bold text-white tracking-tight">AGD DATA PLUS</span>
          </div>
          <p className="text-brand-silver/60 text-sm leading-relaxed mb-8">
            Elevating your digital lifestyle with premium VTU services, seamless payments, and bank-grade security.
          </p>
          <div className="flex gap-4">
            {[Facebook, Twitter, Instagram].map((Icon, idx) => (
              <a
                key={idx}
                href="#"
                className="w-10 h-10 rounded-full bg-brand-midnight border border-brand-royal/20 flex items-center justify-center text-brand-silver hover:text-brand-cyan hover:border-brand-cyan transition-all"
              >
                <Icon size={18} />
              </a>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-white font-bold mb-6">Quick Links</h4>
          <ul className="space-y-4">
            {["Home", "About Us", "Services", "Pricing", "Contact"].map((item) => (
              <li key={item}>
                <Link href="#" className="text-brand-silver/60 hover:text-brand-cyan text-sm transition-colors">
                  {item}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Support */}
        <div>
          <h4 className="text-white font-bold mb-6">Support</h4>
          <ul className="space-y-4">
            {["FAQ", "Terms of Service", "Privacy Policy", "Refund Policy"].map((item) => (
              <li key={item}>
                <Link href="#" className="text-brand-silver/60 hover:text-brand-cyan text-sm transition-colors">
                  {item}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 className="text-white font-bold mb-6">Contact Us</h4>
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-brand-silver/60 text-sm">
              <Mail size={16} className="text-brand-cyan" />
              <span>support@agddata.com</span>
            </div>
            <div className="flex items-center gap-3 text-brand-silver/60 text-sm">
              <Phone size={16} className="text-brand-cyan" />
              <span>+234 800 000 0000</span>
            </div>
          </div>
          <div className="mt-8 p-4 rounded-2xl bg-brand-royal/10 border border-brand-royal/20">
            <p className="text-xs text-brand-silver/50 leading-relaxed">
              AGD Data Plus is a licensed digital payment platform. Secured by AES-256 encryption.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-brand-royal/5 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-brand-silver/40 text-xs">
          © {new Date().getFullYear()} AGD Data Plus. All rights reserved.
        </p>
        <div className="flex gap-6">
          <img src="https://paystack.com/assets/payment/img/paystack-badge-cards.png" alt="Payment Methods" className="h-6 opacity-50 grayscale hover:grayscale-0 transition-all" />
        </div>
      </div>
    </footer>
  );
}
