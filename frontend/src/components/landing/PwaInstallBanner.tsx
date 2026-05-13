"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X } from "lucide-react";

export function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI notify the user they can install the PWA
      setIsVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      console.log("User accepted the install prompt");
    } else {
      console.log("User dismissed the install prompt");
    }
    
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-6 left-4 right-4 z-50 md:left-auto md:right-6 md:w-[400px]"
        >
          <div className="relative p-6 rounded-3xl bg-brand-midnight/80 backdrop-blur-2xl border border-brand-royal/30 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden">
            {/* Decoration */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-brand-cyan/20 rounded-full blur-3xl pointer-events-none" />
            
            <button 
              onClick={() => setIsVisible(false)}
              className="absolute top-4 right-4 text-brand-silver/40 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-gold flex items-center justify-center flex-shrink-0 shadow-[0_0_20px_rgba(245,166,35,0.4)]">
                <Download className="w-6 h-6 text-brand-midnight" />
              </div>
              
              <div>
                <h3 className="text-white font-bold text-lg mb-1">Install AGD Data Plus</h3>
                <p className="text-brand-silver/60 text-sm mb-4">
                  Experience 2x faster transactions and offline access directly from your home screen.
                </p>
                
                <button
                  onClick={handleInstallClick}
                  className="w-full py-3 bg-brand-gold hover:bg-yellow-500 text-brand-midnight font-bold rounded-xl transition-all active:scale-95 shadow-lg"
                >
                  Install Now
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
