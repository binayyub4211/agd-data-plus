"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export function HeroSection() {
  return (
    <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 flex flex-col items-center justify-center overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-royal/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] bg-brand-cyan/20 rounded-full blur-[100px] pointer-events-none" />

      <div className="z-10 flex flex-col items-center max-w-4xl px-4">
        {/* Floating 3D Logo */}
        <motion.div
          animate={{ y: [0, -20, 0] }}
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          className="mb-8"
        >
          {/* We use a standard img tag here if next/image has caching/domain issues in local dev, but Image is preferred */}
          <img 
            src="/logo.png" 
            alt="AGD Data Plus Logo" 
            className="w-48 h-48 md:w-64 md:h-64 object-contain drop-shadow-2xl"
          />
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-4xl md:text-7xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-white via-brand-silver to-white mb-6 tracking-tight"
        >
          Elevate Your Digital Lifestyle
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-lg md:text-2xl text-brand-silver/80 text-center mb-10 max-w-2xl"
        >
          The premium fintech vault for instant data, seamless bills, and absolute security.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <a href="/auth/login" className="relative group inline-block">
            <div className="absolute -inset-1 bg-gradient-to-r from-brand-gold to-yellow-300 rounded-xl blur opacity-60 group-hover:opacity-100 transition duration-300"></div>
            <button className="relative px-8 py-4 bg-gradient-to-r from-brand-gold to-yellow-500 rounded-xl font-bold text-brand-midnight text-lg shadow-xl hover:scale-105 transition-transform duration-300 flex items-center gap-2">
              Fund Wallet
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </a>
        </motion.div>
      </div>
    </section>
  );
}
