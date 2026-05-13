"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

import { Menu, X } from "lucide-react";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "About Us", href: "#about" },
    { name: "Services", href: "#services" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-[60] transition-all duration-500 ${
        scrolled || mobileMenuOpen
          ? "bg-brand-midnight/90 backdrop-blur-xl py-4 border-b border-brand-royal/20"
          : "bg-transparent py-6"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between">
        {/* Logo Section */}
        <Link href="/" className="flex items-center gap-2 group z-[70]">
          <div className="relative">
            <motion.img
              src="/logo.png"
              alt="AGD Logo"
              className="w-10 h-10 md:w-12 md:h-12 object-contain drop-shadow-[0_0_8px_rgba(26,79,219,0.5)]"
              whileHover={{
                scale: 1.1,
                rotateY: 180,
                transition: { duration: 0.6 }
              }}
            />
          </div>
          <span className="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-brand-silver to-brand-gold">
            AGD DATA PLUS
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="text-brand-silver hover:text-brand-cyan transition-colors font-medium text-xs uppercase tracking-[0.2em]"
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Mobile Menu Toggle */}
        <button 
          className="md:hidden text-white z-[70]"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>

        {/* Auth CTAs & Mobile Menu Overlay */}
        <div className={`
          fixed inset-0 bg-brand-midnight z-[65] flex flex-col items-center justify-center gap-8 transition-transform duration-500 md:static md:bg-transparent md:flex-row md:inset-auto md:translate-x-0
          ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
        `}>
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden text-2xl text-brand-silver hover:text-brand-cyan transition-colors font-bold uppercase tracking-widest"
            >
              {link.name}
            </Link>
          ))}
          <div className="flex flex-col md:flex-row items-center gap-6 mt-4 md:mt-0">
            <Link
              href="/auth/login"
              onClick={() => setMobileMenuOpen(false)}
              className="text-brand-silver hover:text-white transition-colors font-semibold"
            >
              Login
            </Link>
            <Link
              href="/auth/register"
              onClick={() => setMobileMenuOpen(false)}
              className="px-8 py-3 rounded-2xl bg-gradient-to-r from-brand-royal to-brand-cyan text-white font-black text-sm shadow-[0_0_20px_rgba(26,79,219,0.3)] hover:shadow-brand-cyan/40 transition-all active:scale-95 uppercase tracking-widest"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
