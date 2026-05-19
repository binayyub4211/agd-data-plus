import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
  const [theme, setTheme] = useState<'LIGHT' | 'DARK'>('DARK');

  useEffect(() => {
    const isLight = document.documentElement.classList.contains('light');
    setTheme(isLight ? 'LIGHT' : 'DARK');
  }, []);

  const toggleTheme = () => {
    const isCurrentlyLight = document.documentElement.classList.contains('light');
    if (isCurrentlyLight) {
      document.documentElement.classList.remove('light');
      localStorage.setItem('theme', 'DARK');
      setTheme('DARK');
    } else {
      document.documentElement.classList.add('light');
      localStorage.setItem('theme', 'LIGHT');
      setTheme('LIGHT');
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className="w-9 h-9 rounded-xl bg-brand-royal/10 border border-brand-royal/20 flex items-center justify-center text-brand-silver/50 hover:text-brand-cyan hover:scale-105 active:scale-95 transition-all"
      title={theme === 'LIGHT' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
    >
      {theme === 'LIGHT' ? <Moon size={16} /> : <Sun size={16} />}
    </button>
  );
}
