import React, { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  className = '', 
  ...props 
}) => {
  const baseStyles = "w-full font-medium rounded-lg text-sm px-5 py-3 text-center transition-all duration-300 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "text-white bg-gradient-to-r from-brand-royal to-brand-cyan hover:from-brand-cyan hover:to-brand-royal shadow-[0_0_15px_rgba(0,212,255,0.3)] hover:shadow-[0_0_25px_rgba(0,212,255,0.5)]",
    secondary: "text-brand-midnight bg-brand-gold hover:bg-yellow-400 shadow-[0_0_15px_rgba(255,215,0,0.3)]",
    outline: "text-brand-cyan border border-brand-cyan hover:bg-brand-cyan/10"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
