"use client";

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Wallet, ArrowUpRight, ArrowDownLeft, Copy, ShieldCheck, Banknote } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(response.data);
      } catch (err) {
        console.error('Failed to fetch profile:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Account number copied!');
  };

  if (loading) return (
    <div className="flex h-96 items-center justify-center">
      <div className="w-10 h-10 border-4 border-brand-cyan border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20 px-4">
      {/* Top Section: Wallet + Virtual Account */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Balance Card */}
        <Card className="lg:col-span-2 p-8 bg-gradient-to-br from-brand-royal/40 to-brand-midnight/80 border-brand-royal/20 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Wallet size={120} />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-brand-silver/60 mb-2 font-medium">
              <ShieldCheck size={16} className="text-brand-cyan" />
              <span>SECURED WALLET BALANCE</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-black text-white tracking-tighter">
              ₦{Number(user?.wallet?.balance || 0).toLocaleString()}
              <span className="text-2xl text-brand-silver/40 font-normal">.00</span>
            </h2>
            
            <div className="flex gap-4 mt-10">
              <Button className="px-8 py-6 rounded-2xl bg-white text-brand-midnight font-black shadow-[0_0_30px_rgba(255,255,255,0.15)] hover:scale-105 transition-all">
                FUND WALLET
              </Button>
              <Button variant="outline" className="px-8 py-6 rounded-2xl border-white/10 hover:bg-white/5 text-white font-bold">
                TRANSFER
              </Button>
            </div>
          </div>
        </Card>

        {/* Dedicated Virtual Account Card */}
        <Card className="p-8 bg-brand-midnight/40 border-dashed border-brand-royal/30 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <span className="px-3 py-1 bg-brand-royal/20 text-brand-cyan text-[10px] font-black uppercase tracking-widest rounded-full">
                Auto-Funding
              </span>
              <Banknote size={20} className="text-brand-silver/30" />
            </div>
            <p className="text-brand-silver/60 text-xs font-bold uppercase tracking-widest mb-1">Your Virtual Account</p>
            {user?.virtualAccountNumber ? (
              <>
                <h3 className="text-2xl font-black text-white tracking-widest mb-1">{user.virtualAccountNumber}</h3>
                <p className="text-brand-cyan font-bold text-sm uppercase">{user.virtualAccountBank || 'Bank'}</p>
                <button 
                  onClick={() => copyToClipboard(user.virtualAccountNumber)}
                  className="mt-4 flex items-center gap-2 text-xs text-brand-silver/40 hover:text-brand-cyan transition-colors"
                >
                  <Copy size={12} />
                  Copy Account Number
                </button>
              </>
            ) : (
              <p className="text-brand-silver/40 text-sm italic">Assigning account...</p>
            )}
          </div>
          <p className="text-[10px] text-brand-silver/30 mt-6 leading-tight">
            Transfer money to this account to fund your wallet instantly.
          </p>
        </Card>
      </div>

      {/* Quick Actions Grid */}
      <div>
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          Digital Services
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { id: 'DATA', name: 'Buy Data', icon: Wifi, color: 'from-blue-500/20 to-brand-royal/20', border: 'border-blue-500/30' },
            { id: 'AIRTIME', name: 'Airtime', icon: Smartphone, color: 'from-green-500/20 to-emerald-700/20', border: 'border-green-500/30' },
            { id: 'ELECTRICITY', name: 'Electricity', icon: Zap, color: 'from-brand-gold/20 to-yellow-700/20', border: 'border-brand-gold/30' },
            { id: 'CABLE', name: 'Cable TV', icon: Monitor, color: 'from-purple-500/20 to-fuchsia-700/20', border: 'border-purple-500/30' }
          ].map((action, i) => (
            <button 
              key={i} 
              onClick={() => openPurchase(action.id)}
              className={`flex flex-col items-center justify-center p-8 rounded-3xl border ${action.border} bg-brand-midnight/40 backdrop-blur-xl transition-all active:scale-95 hover:-translate-y-2 group`}
            >
              <div className="w-14 h-14 rounded-2xl bg-white/5 mb-4 group-hover:bg-brand-cyan/20 transition-colors flex items-center justify-center">
                <action.icon className="text-brand-silver/40 group-hover:text-brand-cyan transition-colors" size={24} />
              </div>
              <span className="text-sm font-black text-brand-silver group-hover:text-white uppercase tracking-widest">{action.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Recent Activity</h3>
          <button className="text-brand-cyan text-sm font-bold uppercase tracking-widest hover:underline">See Logs</button>
        </div>
        <Card className="p-0 overflow-hidden border-brand-royal/10">
          <div className="p-8 text-center border-2 border-dashed border-brand-royal/5 rounded-3xl">
            <p className="text-brand-silver/30 text-sm">No recent transactions found.</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
