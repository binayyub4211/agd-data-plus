import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, className = '', ...props }) => {
  return (
    <div
      className={`bg-brand-midnight/60 backdrop-blur-md border border-brand-silver/20 rounded-2xl shadow-xl ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
