import { Zap, ShieldCheck, Server } from "lucide-react";

export function TrustBar() {
  const features = [
    {
      icon: <Zap className="w-6 h-6 text-brand-gold" />,
      title: "Instant Delivery",
      desc: "Zero-wait transactions",
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-brand-cyan" />,
      title: "Secure Vault",
      desc: "Bank-grade encryption",
    },
    {
      icon: <Server className="w-6 h-6 text-brand-silver" />,
      title: "99.9% Uptime",
      desc: "Dual-API Backbone",
    },
  ];

  return (
    <section className="w-full py-12 px-4 border-y border-brand-royal/20 bg-brand-midnight/50 backdrop-blur-sm z-10 relative">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        {features.map((feature, idx) => (
          <div key={idx} className="flex flex-col items-center justify-center text-center group">
            <div className="w-16 h-16 rounded-2xl bg-brand-royal/10 border border-brand-royal/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-[0_0_15px_rgba(26,79,219,0.2)]">
              {feature.icon}
            </div>
            <h3 className="text-xl font-semibold text-white mb-1">{feature.title}</h3>
            <p className="text-brand-silver/70 text-sm">{feature.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
