import React, { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const Input: React.FC<InputProps> = ({ label, id, className = '', ...props }) => {
  return (
    <div className="flex flex-col space-y-1 w-full">
      <label htmlFor={id} className="text-sm font-medium text-brand-silver">
        {label}
      </label>
      <input
        id={id}
        className={`bg-brand-midnight/50 border border-brand-silver/30 text-white text-sm rounded-lg focus:ring-brand-cyan focus:border-brand-cyan block w-full p-2.5 outline-none transition-all duration-200 ${className}`}
        {...props}
      />
    </div>
  );
};
