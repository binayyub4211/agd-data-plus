"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, X } from 'lucide-react';
import axios from 'axios';

interface GlobalAlert {
  id: string;
  message: string;
  isActive: boolean;
  updatedAt: string;
}

export function GlobalAlertModal() {
  const [alert, setAlert] = useState<GlobalAlert | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const fetchAlert = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const res = await axios.get('http://localhost:5000/api/notifications/alert/active', {
          headers: { Authorization: `Bearer ${token}` }
        });

        const activeAlert = res.data.alert;
        if (activeAlert) {
          // Check if this specific alert was dismissed in THIS session
          const dismissedAlertId = sessionStorage.getItem('dismissedAlertId');
          if (dismissedAlertId !== activeAlert.id) {
            setAlert(activeAlert);
            setIsVisible(true);
          }
        }
      } catch (error) {
        console.error('Failed to fetch system alert', error);
      }
    };

    fetchAlert();
  }, []);

  const handleDismiss = () => {
    if (alert) {
      sessionStorage.setItem('dismissedAlertId', alert.id);
      setIsVisible(false);
    }
  };

  if (!isVisible || !alert) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-brand-midnight/90 backdrop-blur-md"
        />

        {/* Modal Box */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-lg bg-[#111111] border border-red-500/30 rounded-3xl p-8 shadow-[0_0_50px_rgba(239,68,68,0.15)] overflow-hidden"
        >
          {/* Animated Background Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-red-500/10 blur-[50px] rounded-full pointer-events-none" />

          {/* Header */}
          <div className="flex items-center justify-between mb-8 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center animate-pulse">
                <ShieldAlert className="text-red-500" size={28} />
              </div>
              <div>
                <h3 className="text-xl font-black text-white uppercase tracking-widest">System Alert</h3>
                <p className="text-red-400/80 text-xs font-semibold uppercase tracking-wider">Important Announcement</p>
              </div>
            </div>
            <button 
              onClick={handleDismiss} 
              className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-brand-silver/50 hover:text-white transition-all"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="relative z-10 bg-black/40 rounded-2xl p-6 border border-white/5">
            <p className="text-brand-silver text-sm leading-relaxed whitespace-pre-wrap">
              {alert.message}
            </p>
          </div>

          {/* Action Button */}
          <button
            onClick={handleDismiss}
            className="mt-8 w-full py-5 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-bold uppercase tracking-widest transition-all border border-white/10 hover:border-white/20"
          >
            I Understand, Dismiss
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
