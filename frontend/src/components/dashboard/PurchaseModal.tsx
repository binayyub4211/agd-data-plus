"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Smartphone, Wifi, Zap, Monitor } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

interface PurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceType: string;
  refreshProfile: () => void;
}

export function PurchaseModal({ isOpen, onClose, serviceType, refreshProfile }: PurchaseModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    phone: '',
    planCode: '',
    amount: '',
  });

  const getIcon = () => {
    switch (serviceType) {
      case 'DATA': return <Wifi className="text-brand-cyan" />;
      case 'AIRTIME': return <Smartphone className="text-brand-cyan" />;
      case 'ELECTRICITY': return <Zap className="text-brand-gold" />;
      case 'CABLE': return <Monitor className="text-purple-400" />;
      default: return <Send />;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/vtu/purchase', {
        serviceType,
        phone: formData.phone,
        planCode: formData.planCode || 'default',
        amount: Number(formData.amount),
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success(`${serviceType} Purchase Successful!`);
      refreshProfile();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Purchase failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-brand-midnight/80 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg bg-brand-midnight border border-brand-royal/20 rounded-3xl p-8 shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-brand-royal/10 flex items-center justify-center">
                  {getIcon()}
                </div>
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-widest">{serviceType}</h3>
                  <p className="text-brand-silver/40 text-xs">Premium Secure Purchase</p>
                </div>
              </div>
              <button onClick={onClose} className="text-brand-silver/40 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-brand-silver/60 uppercase tracking-widest ml-1">Recipient Phone</label>
                <input
                  type="tel"
                  required
                  placeholder="08012345678"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-brand-cyan transition-colors"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-brand-silver/60 uppercase tracking-widest ml-1">Select Plan / Amount</label>
                <input
                  type="number"
                  required
                  placeholder="₦ Amount"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-brand-cyan transition-colors"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-5 rounded-2xl bg-gradient-to-r from-brand-royal to-brand-cyan text-white font-black uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(26,79,219,0.3)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'CONFIRM PURCHASE'}
              </button>
            </form>
            
            <div className="mt-8 flex items-center justify-center gap-2 text-brand-silver/30">
              <Zap size={14} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Instant Delivery Guaranteed</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
