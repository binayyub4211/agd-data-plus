"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/landing/HeroSection";
import { TrustBar } from "@/components/landing/TrustBar";
import { ServicesTab } from "@/components/landing/ServicesTab";
import { PwaInstallBanner } from "@/components/landing/PwaInstallBanner";

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const sectionVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" }
    }
  };

  // Prevent hydration mismatch by rendering a static shell until mounted
  if (!mounted) {
    return (
      <main className="min-h-screen bg-brand-midnight text-white flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-brand-cyan border-t-transparent rounded-full animate-spin"></div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-brand-midnight text-white selection:bg-brand-cyan/30">
      <Header />
      
      <HeroSection />
      
      <motion.div 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={sectionVariants}
      >
        <TrustBar />
      </motion.div>
      
      <motion.div 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={sectionVariants}
      >
        <ServicesTab />
      </motion.div>
      
      {/* Bottom CTA Section */}
      <motion.section 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={sectionVariants}
        className="py-24 px-4 border-t border-brand-royal/10 bg-gradient-to-b from-brand-midnight to-[#050810] relative overflow-hidden"
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-brand-cyan/50 to-transparent" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-6xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-white to-brand-silver">
            Ready to scale your digital reach?
          </h2>
          <p className="text-brand-silver/60 mb-12 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Join thousands of users enjoying the fastest, most secure VTU delivery in the industry.
          </p>
          <a 
            href="/auth/register" 
            className="px-12 py-5 bg-gradient-to-r from-brand-gold to-yellow-500 text-brand-midnight font-black rounded-2xl hover:scale-105 transition-all shadow-[0_0_40px_rgba(245,166,35,0.2)] active:scale-95"
          >
            GET STARTED NOW
          </a>
        </div>
      </motion.section>

      <Footer />
      <PwaInstallBanner />
    </main>
  );
}


