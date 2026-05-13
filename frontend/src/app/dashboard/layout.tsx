import React from 'react';
import Link from 'next/link';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-brand-midnight text-white overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-brand-silver/10 bg-brand-midnight/80 backdrop-blur-xl">
        <div className="p-6">
          <Link href="/dashboard" className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-cyan to-brand-royal">
            AGD Data Plus
          </Link>
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <Link href="/dashboard" className="block px-4 py-3 rounded-lg bg-brand-royal/20 text-brand-cyan border border-brand-royal/30">
            Dashboard
          </Link>
          <Link href="/dashboard/wallet" className="block px-4 py-3 rounded-lg text-brand-silver hover:bg-white/5 transition-colors">
            Wallet
          </Link>
          <Link href="/dashboard/transactions" className="block px-4 py-3 rounded-lg text-brand-silver hover:bg-white/5 transition-colors">
            Transactions
          </Link>
          <Link href="/dashboard/settings" className="block px-4 py-3 rounded-lg text-brand-silver hover:bg-white/5 transition-colors">
            Settings
          </Link>
        </nav>
        <div className="p-4 border-t border-brand-silver/10">
          <div className="flex items-center space-x-3 px-4 py-2">
            <div className="w-8 h-8 rounded-full bg-brand-gold text-brand-midnight flex items-center justify-center font-bold">
              U
            </div>
            <div className="text-sm">
              <p className="font-medium">User Account</p>
              <Link href="/auth/login" className="text-brand-silver hover:text-white text-xs">Sign out</Link>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative overflow-y-auto">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-brand-silver/10 bg-brand-midnight/90 backdrop-blur-md sticky top-0 z-50">
          <Link href="/dashboard" className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-cyan to-brand-royal">
            AGD
          </Link>
          <div className="w-8 h-8 rounded-full bg-brand-gold text-brand-midnight flex items-center justify-center font-bold">
            U
          </div>
        </header>

        {/* Global Background Blurs for Dashboard */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-royal/10 rounded-full blur-[120px] pointer-events-none fixed" />
        
        <main className="flex-1 p-4 md:p-8 z-10">
          {children}
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden flex justify-around items-center p-3 border-t border-brand-silver/10 bg-brand-midnight/90 backdrop-blur-md sticky bottom-0 z-50 pb-safe">
          <Link href="/dashboard" className="flex flex-col items-center text-brand-cyan">
            <span className="text-xs mt-1 font-medium">Home</span>
          </Link>
          <Link href="/dashboard/wallet" className="flex flex-col items-center text-brand-silver">
            <span className="text-xs mt-1">Wallet</span>
          </Link>
          <Link href="/dashboard/transactions" className="flex flex-col items-center text-brand-silver">
            <span className="text-xs mt-1">History</span>
          </Link>
        </nav>
      </div>
    </div>
  );
}
