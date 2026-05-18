import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, RefreshCw } from 'lucide-react';
import api from '@/lib/api';

const APP_VERSION = '1.0.0';

export function UpdateModal() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [newVersion, setNewVersion] = useState('');

  useEffect(() => {
    const checkForUpdates = async () => {
      try {
        const res = await api.get('/system/version');
        if (res.data.version && res.data.version !== APP_VERSION) {
          setNewVersion(res.data.version);
          setUpdateAvailable(true);
        }
      } catch (error) {
        console.warn('Update check failed:', error);
      }
    };

    // Check on mount
    checkForUpdates();

    // Check every 3 minutes
    const interval = setInterval(checkForUpdates, 3 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdate = () => {
    // Clear caches and force reload
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (let registration of registrations) {
          registration.unregister();
        }
      });
    }
    window.location.reload();
  };

  if (!updateAvailable) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[250] flex items-center justify-center px-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-brand-midnight/95 backdrop-blur-xl"
        />

        {/* Modal Box */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-[#0e1424]/90 border border-brand-cyan/20 rounded-3xl p-8 shadow-[0_0_80px_rgba(0,212,255,0.15)] overflow-hidden"
        >
          {/* Cyan Glow Animation */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-brand-cyan/10 blur-[60px] rounded-full pointer-events-none" />

          {/* Icon Header */}
          <div className="flex flex-col items-center text-center relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-brand-cyan/10 border border-brand-cyan/30 flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(0,212,255,0.2)] animate-bounce">
              <Download className="text-brand-cyan" size={28} />
            </div>
            
            <h3 className="text-2xl font-black text-white uppercase tracking-wider">Update Required</h3>
            <p className="text-brand-cyan/80 text-xs font-black uppercase tracking-widest mt-1">New Version {newVersion} is Live</p>

            <div className="bg-white/5 rounded-2xl p-5 border border-white/5 mt-6 w-full text-left">
              <p className="text-brand-silver text-sm leading-relaxed">
                A critical system security and performance update (v{newVersion}) is available. Please update now to ensure full access to VTU purchases and wallet operations.
              </p>
            </div>

            <button
              onClick={handleUpdate}
              className="mt-8 w-full py-5 rounded-2xl bg-gradient-to-r from-brand-royal to-brand-cyan text-white font-black uppercase tracking-widest transition-all shadow-[0_0_30px_rgba(26,79,219,0.3)] hover:shadow-[0_0_40px_rgba(0,212,255,0.5)] flex items-center justify-center gap-3 active:scale-95 duration-255"
            >
              <RefreshCw size={18} className="animate-spin" />
              <span>Update and Restart</span>
            </button>

            <p className="text-brand-silver/20 text-[9px] uppercase tracking-widest mt-4">Current version: v{APP_VERSION}</p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
